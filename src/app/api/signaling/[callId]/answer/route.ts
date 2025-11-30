import { NextRequest, NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";
import { db } from '@/lib/firebase-admin';

type Context = { params: { [key: string]: string | string[] } };

async function handleAnswer(
    req: NextRequest,
    context: Context,
    userId: string
) {
    try {
        const { callId: rawCallId } = context.params;
        const callId = Array.isArray(rawCallId) ? rawCallId[0] : rawCallId;
        const body = await req.json();
        const { answer } = body;

        if (!answer) {
            return NextResponse.json({ error: 'Invalid answer' }, { status: 400 });
        }

        if (!callId) {
            return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
        }

        const callRef = db.collection('calls').doc(callId);

        await db.runTransaction(async (transaction) => {
            const callSnapshot = await transaction.get(callRef);

            if (!callSnapshot.exists) {
                throw new Error('404');
            }

            const callData = callSnapshot.data();
            if (callData?.receiverId !== userId) throw new Error('403');
            if (callData?.status !== 'pending') throw new Error('409');

            transaction.update(callRef, {
                status: 'accepted',
                answer,
                answeredAt: new Date(),
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error fetching call:', error);
        return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
    }
}

export const POST = authWrapper(handleAnswer);