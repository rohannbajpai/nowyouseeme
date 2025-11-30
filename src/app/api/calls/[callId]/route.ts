import { NextRequest } from "next/server";
import { db } from '@/lib/firebase-admin';
import { NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";

type Context = { params: { [key: string]: string | string[] } };

async function handleDelete(
    _req: NextRequest,
    context: Context,
    userId: string
) {
    try {
        const { callId } = context.params;
        if (!callId || Array.isArray(callId)) {
            return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
        }
        const callRef = db.collection('calls').doc(callId);
        const callSnapshot = await callRef.get();

        if (!callSnapshot.exists) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 });
        }

        const callData = callSnapshot.data();
        if (!callData) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 });
        }
        if (callData.callerId !== userId || callData.receiverId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await callRef.delete();
        return NextResponse.json({ message: 'Call deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting call:', error);
        return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }
}

export const DELETE = authWrapper(handleDelete);
