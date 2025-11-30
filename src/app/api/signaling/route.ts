import { NextRequest, NextResponse } from "next/server";
import { authWrapper } from "@/lib/auth-wrapper";
import { db } from '@/lib/firebase-admin';

async function handleGet(req: NextRequest, userId: string) {

}