import { NextRequest, NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";
import { db } from '@/lib/firebase-admin';

type Context = { params: { [key: string]: string | string[] } };

async function handleGet(
    _req: NextRequest,
    context: Context,
    userId: string
) {
    try {
        const { callId } = context.params;

        if (typeof callId !== 'string') {
            return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
        }

        const callsRef = db.collection('calls');
        const callSnapshot = await callsRef
            .where('callId', '==', callId)
            .where('status', '==', 'pending')
            .where('receiverId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (callSnapshot.empty) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 });
        }

        const callData = callSnapshot.docs[0].data();
        return NextResponse.json({
            callId: callData.callId,
            offer: callData.offer,
            callerId: callData.callerId,
        });
    } catch (error) {
        console.error('Error fetching call:', error);
        return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
    }
}

export const GET = authWrapper(handleGet);