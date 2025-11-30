// lib/auth-wrapper.ts
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server";

// Define a generic type for the context (params)
// Define a generic type for the context (params)
// In Next.js 15, params is a Promise. We support both for compatibility or strictness.
type RouteContext = { params: Promise<{ [key: string]: string | string[] }> };

// The handler now receives: Request, Context, and UserId
type AuthenticatedHandler = (
    req: NextRequest,
    context: { params: { [key: string]: string | string[] } }, // Handler gets resolved params
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

        // Resolve params before passing to handler
        const params = await context.params;

        // 2. Call the handler with ALL arguments
        return handler(req, { params }, userId);
    };
}