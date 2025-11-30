import { NextRequest } from "next/server";
import { db } from '@/lib/firebase-admin';
import { NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";

type Context = { params: { [key: string]: string | string[] } };

async function handleDelete(
    req: NextRequest,
    context: Context,
    userId: string
) {
    const { callId: rawCallId } = context.params;
    const callId = Array.isArray(rawCallId) ? rawCallId[0] : rawCallId;

    if (!callId) {
        return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
    }

    const callRef = db.collection('calls').doc(callId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(callRef);
            if (!doc.exists) return; // Already deleted, ignore

            const data = doc.data();

            // Security: Only the participants can end the call
            if (data?.callerId !== userId && data?.receiverId !== userId) {
                throw new Error("Unauthorized");
            }

            // Delete the main call document
            t.delete(callRef);
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Error deleting call:', error);
        return NextResponse.json({ error: 'Failed to end call' }, { status: 500 });
    }
}

export const DELETE = authWrapper(handleDelete);
