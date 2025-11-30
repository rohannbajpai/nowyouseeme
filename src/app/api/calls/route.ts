import { NextRequest, NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";
import { db } from '@/lib/firebase-admin';

async function handlePost(
    req: NextRequest,
    _context: any,
    userId: string
) {
    try {
        const body = await req.json();
        const { offer, receiverId } = body;

        if (!offer || !receiverId) {
            return NextResponse.json(
                { error: 'Offer and receiverId are required' },
                { status: 400 }
            );
        }

        const newCallDocRef = db.collection('calls').doc();
        const newDocId = newCallDocRef.id;

        await newCallDocRef.set({
            callerId: userId,
            callId: newDocId,
            receiverId: receiverId,
            createdAt: new Date(),
            offer,
            answer: null,
            status: 'pending',
        });

        return NextResponse.json({ callId: newDocId }, { status: 201 });
    } catch (error) {
        console.error('Error creating new call:', error);
        return NextResponse.json(
            { error: 'Failed to create new call' },
            { status: 500 }
        );
    }
}

export const POST = authWrapper(handlePost);