import { NextRequest, NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";
import { db } from '@/lib/firebase-admin';

type Context = { params: { [key: string]: string | string[] } };

async function handleGet(
    _req: NextRequest,
    _context: Context,
    userId: string
) {
    try {
        const callsRef = db.collection('calls');
        const callSnapshot = await callsRef
            .where('status', '==', 'pending')
            .where('receiverId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        if (callSnapshot.empty) {
            return NextResponse.json({ calls: [] });
        }

        const calls = callSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                callId: data.callId,
                offer: data.offer,
                callerId: data.callerId,
            };
        });

        return NextResponse.json({ calls });
    } catch (error) {
        console.error('Error fetching call:', error);
        return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
    }
}

export const GET = authWrapper(handleGet);