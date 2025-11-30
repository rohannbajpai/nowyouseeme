import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
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

    const createPeerConnection = (callId: string, isCaller: boolean) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && callId) {
                const collectionName = isCaller ? 'offerCandidates' : 'answerCandidates';
                const candidatesCol = collection(db, 'calls', callId, collectionName);
                addDoc(candidatesCol, event.candidate.toJSON());
            }
        };

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                setRemoteStream((prev) => {
                    if (!prev) {
                        return event.streams[0];
                    }
                    return prev;
                });
            });
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        peerConnection.current = pc;
        return pc;
    };

    const startCall = async (receiverId: string, stream?: MediaStream) => {
        const streamToUse = stream || localStream;
        if (!streamToUse) {
            console.error("No local stream to share");
            return;
        }

        setCallStatus('calling');

        // Create Offer
        const pc = new RTCPeerConnection(ICE_SERVERS); // Temp PC to create offer
        // We need to add tracks to generate offer with video/audio
        if (streamToUse) {
            streamToUse.getTracks().forEach(track => pc.addTrack(track, streamToUse));
        }

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription); // Set on temp PC

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        pc.close(); // Close temp PC, we will recreate properly with ID

        // Create Call via API
        try {
            const res = await fetch('/api/calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId, offer }),
            });

            if (!res.ok) throw new Error('Failed to create call');

            const data = await res.json();
            const callId = data.callId;
            setCurrentCallId(callId);

            // Re-create PC with callId for candidates
            const realPC = createPeerConnection(callId, true);
            await realPC.setLocalDescription(offerDescription);

            // Listen for Answer
            const callDoc = doc(db, 'calls', callId);
            onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                if (!realPC.currentRemoteDescription && data?.answer) {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    realPC.setRemoteDescription(answerDescription);
                    setCallStatus('connected');
                }
            });

            // Listen for Answer Candidates
            const answerCandidates = collection(db, 'calls', callId, 'answerCandidates');
            onSnapshot(answerCandidates, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        realPC.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus('idle');
        }
    };

    const acceptCall = async (callId: string, offer: any) => {
        setCurrentCallId(callId);
        setCallStatus('connected'); // Optimistic

        const pc = createPeerConnection(callId, false);

        // Set Remote Description (Offer)
        const offerDescription = new RTCSessionDescription(offer);
        await pc.setRemoteDescription(offerDescription);

        // Create Answer
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        // Send Answer via API
        await fetch(`/api/signaling/${callId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
        });

        // Listen for Offer Candidates
        const offerCandidates = collection(db, 'calls', callId, 'offerCandidates');
        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
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
