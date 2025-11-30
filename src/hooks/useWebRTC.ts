import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useWebRTC(userId: string) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
    const [incomingCallData, setIncomingCallData] = useState<any | null>(null);
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
            if (callStatus !== 'idle') return;

            try {
                const res = await fetch('/api/calls/incoming');
                if (res.ok) {
                    const data = await res.json();
                    if (data.calls && data.calls.length > 0) {
                        const call = data.calls[0];
                        setIncomingCallData(call);
                        setCallStatus('incoming');
                        setCurrentCallId(call.callId);
                    }
                }
            } catch (error) {
                console.error("Error checking incoming calls:", error);
            }
        };

        const interval = setInterval(checkIncomingCalls, 3000);
        return () => clearInterval(interval);
    }, [userId, callStatus]);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && currentCallId) {
                const collectionName = incomingCallData ? 'answerCandidates' : 'offerCandidates';
                const candidatesCol = collection(db, 'calls', currentCallId, collectionName);
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

    const startCall = async (receiverId: string) => {
        if (!localStream) {
            console.error("No local stream to share");
            return;
        }

        setCallStatus('calling');
        const pc = createPeerConnection();

        // Create Offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

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

            // Listen for Answer
            const callDoc = doc(db, 'calls', callId);
            onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                if (!pc.currentRemoteDescription && data?.answer) {
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
                        const candidate = new RTCIceCandidate(change.doc.data());
                        pc.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus('idle');
        }
    };

    const acceptCall = async () => {
        if (!currentCallId || !incomingCallData) return;

        setCallStatus('connected'); // Optimistic
        const pc = createPeerConnection();

        // Set Remote Description (Offer)
        const offerDescription = new RTCSessionDescription(incomingCallData.offer);
        await pc.setRemoteDescription(offerDescription);

        // Create Answer
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        // Send Answer via API
        await fetch(`/api/signaling/${currentCallId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
        });

        // Listen for Offer Candidates
        const offerCandidates = collection(db, 'calls', currentCallId, 'offerCandidates');
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
        setIncomingCallData(null);
        setCurrentCallId(null);
    };

    return {
        localStream,
        setLocalStream,
        remoteStream,
        callStatus,
        incomingCallData,
        startCall,
        acceptCall,
        endCall,
    };
}
