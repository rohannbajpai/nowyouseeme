import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export interface IncomingCall {
    callId: string;
    callerId: string;
    offer: any;
}

export function useWebRTC(userId: string) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
    const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Keep ref in sync with state for callbacks
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    // Poll for incoming calls
    useEffect(() => {
        if (!userId) return;

        const checkIncomingCalls = async () => {
            // We always poll to show the list, even if busy (though UI might block accepting)
            try {
                const res = await fetch('/api/calls/incoming');
                if (res.ok) {
                    const data = await res.json();
                    console.log(data);
                    setIncomingCalls(data.calls || []);

                    // If we are idle and have calls, we can set status to incoming (optional, mostly for UI triggers)
                    if (callStatus === 'idle' && data.calls && data.calls.length > 0) {
                        setCallStatus('incoming');
                    } else if (callStatus === 'incoming' && (!data.calls || data.calls.length === 0)) {
                        setCallStatus('idle');
                    }
                }
            } catch (error) {
                console.error("Error checking incoming calls:", error);
            }
        };

        const interval = setInterval(checkIncomingCalls, 3000);
        return () => clearInterval(interval);
    }, [userId, callStatus]);

    const createPeerConnection = (callId: string, isCaller: boolean, stream?: MediaStream) => {
        console.log(`[WebRTC] Creating PeerConnection. Caller: ${isCaller}, CallId: ${callId}`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && callId) {
                console.log(`[WebRTC] New ICE candidate generated: ${event.candidate.candidate}`);
                const collectionName = isCaller ? 'offerCandidates' : 'answerCandidates';
                const candidatesCol = collection(db, 'calls', callId, collectionName);
                addDoc(candidatesCol, event.candidate.toJSON())
                    .then(() => console.log(`[WebRTC] Successfully added ICE candidate to ${collectionName}`))
                    .catch(e => console.error(`[WebRTC] Failed to add ICE candidate to ${collectionName}:`, e));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state changed: ${pc.connectionState}`);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE connection state changed: ${pc.iceConnectionState}`);
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Track received: ${event.streams[0].id}`);
            const track = event.track; // Use event.track directly
            console.log(`[WebRTC] Track kind: ${track.kind}, Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);

            setRemoteStream((prev) => {
                if (prev) {
                    // If we already have a stream, check if track is present
                    if (!prev.getTracks().find(t => t.id === track.id)) {
                        console.log(`[WebRTC] Adding new track to existing remote stream (creating new ref)`);
                        return new MediaStream([...prev.getTracks(), track]);
                    }
                    return prev;
                }
                // Create a new stream with this track
                console.log(`[WebRTC] Creating new remote stream with track`);
                return new MediaStream([track]);
            });
        };

        const streamToShare = stream || localStreamRef.current;
        if (streamToShare) {
            console.log(`[WebRTC] Adding local tracks to PC`);
            streamToShare.getTracks().forEach((track) => {
                pc.addTrack(track, streamToShare);
            });
        } else {
            console.warn(`[WebRTC] No local stream to add to PC`);
        }

        peerConnection.current = pc;
        return pc;
    };

    const startCall = async (receiverId: string, stream?: MediaStream) => {
        console.log(`[WebRTC] Starting call to ${receiverId}`);
        const streamToUse = stream || localStream;
        if (!streamToUse) {
            console.error("No local stream to share");
            return;
        }

        setCallStatus('calling');

        // Create PC immediately
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        // Queue for ICE candidates until we have callId
        const iceQueue: RTCIceCandidate[] = [];
        let callIdForIce: string | null = null;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] New ICE candidate generated: ${event.candidate.candidate}`);
                if (callIdForIce) {
                    const candidatesCol = collection(db, 'calls', callIdForIce, 'offerCandidates');
                    addDoc(candidatesCol, event.candidate.toJSON())
                        .then(() => console.log(`[WebRTC] Successfully added ICE candidate to offerCandidates`))
                        .catch(e => console.error(`[WebRTC] Failed to add ICE candidate to offerCandidates:`, e));
                } else {
                    console.log(`[WebRTC] Queueing ICE candidate (no callId yet)`);
                    iceQueue.push(event.candidate);
                }
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state changed: ${pc.connectionState}`);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE connection state changed: ${pc.iceConnectionState}`);
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Track received: ${event.streams[0].id}`);
            const track = event.track;

            setRemoteStream((prev) => {
                if (prev) {
                    if (!prev.getTracks().find(t => t.id === track.id)) {
                        console.log(`[WebRTC] Adding new track to existing remote stream (creating new ref)`);
                        return new MediaStream([...prev.getTracks(), track]);
                    }
                    return prev;
                }
                console.log(`[WebRTC] Creating new remote stream with track`);
                return new MediaStream([track]);
            });
        };

        // Add tracks
        console.log(`[WebRTC] Adding local tracks to PC`);
        streamToUse.getTracks().forEach(track => pc.addTrack(track, streamToUse));

        // Create Offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        console.log(`[WebRTC] Offer created and set on PC`);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        // Create Call via API
        try {
            console.log(`[WebRTC] Sending offer to API`);
            const res = await fetch('/api/calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId, offer }),
            });

            if (!res.ok) throw new Error('Failed to create call');

            const data = await res.json();
            const callId = data.callId;
            console.log(`[WebRTC] Call created with ID: ${callId}`);
            setCurrentCallId(callId);
            callIdForIce = callId;

            // Flush ICE queue
            console.log(`[WebRTC] Flushing ${iceQueue.length} queued ICE candidates`);
            const candidatesCol = collection(db, 'calls', callId, 'offerCandidates');
            iceQueue.forEach(candidate => {
                addDoc(candidatesCol, candidate.toJSON())
                    .then(() => console.log(`[WebRTC] Successfully added queued ICE candidate`))
                    .catch(e => console.error(`[WebRTC] Failed to add queued ICE candidate:`, e));
            });

            // Listen for Answer
            const callDoc = doc(db, 'calls', callId);
            onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                if (!pc.currentRemoteDescription && data?.answer) {
                    console.log(`[WebRTC] Answer received from remote`);
                    const answerDescription = new RTCSessionDescription(data.answer);
                    pc.setRemoteDescription(answerDescription);
                    setCallStatus('connected');
                }
            });

            // Listen for Answer Candidates
            const answerCandidates = collection(db, 'calls', callId, 'answerCandidates');
            onSnapshot(answerCandidates, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        console.log(`[WebRTC] Received remote ICE candidate`);
                        const candidate = new RTCIceCandidate(change.doc.data());
                        pc.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus('idle');
            pc.close();
        }
    };

    const acceptCall = async (callId: string, offer: any) => {
        console.log(`[WebRTC] Accepting call ${callId}`);
        setCurrentCallId(callId);
        setCallStatus('connected'); // Optimistic

        const pc = createPeerConnection(callId, false);

        // Set Remote Description (Offer)
        console.log(`[WebRTC] Setting remote description (Offer)`);
        const offerDescription = new RTCSessionDescription(offer);
        await pc.setRemoteDescription(offerDescription);

        // Create Answer
        console.log(`[WebRTC] Creating answer`);
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        // Send Answer via API
        console.log(`[WebRTC] Sending answer to API`);
        await fetch(`/api/signaling/${callId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
        });

        // Listen for Offer Candidates
        const offerCandidatesPath = `calls/${callId}/offerCandidates`;
        console.log(`[WebRTC] Listening for offer candidates at: ${offerCandidatesPath}`);
        const offerCandidates = collection(db, 'calls', callId, 'offerCandidates');

        // Wait for auth to be ready
        if (!auth.currentUser) {
            console.warn("[WebRTC] Waiting for Firebase Auth... Current User is null");
        } else {
            console.log(`[WebRTC] Auth ready. User: ${auth.currentUser.uid}`);
        }

        onSnapshot(offerCandidates, (snapshot) => {
            console.log(`[WebRTC] Offer candidates snapshot update. Docs: ${snapshot.docs.length}, Changes: ${snapshot.docChanges().length}`);
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log(`[WebRTC] Received remote ICE candidate (Offer)`);
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate).catch(e => console.error("[WebRTC] Error adding ICE candidate:", e));
                }
            });
        }, (error) => {
            console.error(`[WebRTC] Error listening for offer candidates at ${offerCandidatesPath}:`, error);
        });
    };

    const endCall = async () => {
        if (currentCallId) {
            // Call API to delete
            await fetch(`/api/calls/${currentCallId}`, { method: 'DELETE' });
        }
        cleanup();
    };

    const cleanup = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setCallStatus('idle');
        setIncomingCalls([]);
        setCurrentCallId(null);
    };

    return {
        localStream,
        setLocalStream,
        remoteStream,
        callStatus,
        incomingCalls,
        startCall,
        acceptCall,
        endCall,
    };
}
