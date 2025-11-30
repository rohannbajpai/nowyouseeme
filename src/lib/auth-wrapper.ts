// lib/auth-wrapper.ts
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server";

// Define a generic type for the context (params)
type RouteContext = { params: { [key: string]: string | string[] } };

// The handler now receives: Request, Context, and UserId
type AuthenticatedHandler = (
    req: NextRequest,
    context: RouteContext, // 👈 Pass this through
    userId: string         // 👈 Inject this
) => Promise<NextResponse>;

export function authWrapper(handler: AuthenticatedHandler) {
    return async (req: NextRequest, context: RouteContext) => {
        // 1. Get Session
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. Call the handler with ALL arguments
        return handler(req, context, userId);
    };
}