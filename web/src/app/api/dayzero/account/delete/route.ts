// DayZero — account deletion route (Next.js App Router).
//
// This route is the web-side entrypoint for account deletion. It delegates the
// actual authorization, password verification, dependent-record cleanup, and session
// invalidation to the PocketBase backend so security guarantees are enforced
// server-side.

import { NextRequest, NextResponse } from 'next/server';
import { pbClient, type PbClient } from '../../../../../../lib/pb';

// Deny any direct GET requests.
export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, keepData } = body;

    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: 'password_required' },
        { status: 400 }
      );
    }

    const pb = (await pbClient()) as PbClient;

    // This route does not itself delete the account. It calls the backend custom
    // endpoint that enforces server-side ownership, recent-auth/password checks,
    // dependent-record cleanup, and session invalidation.
    const response = await pb.fetch('/api/dayzero/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, keepData: Boolean(keepData) }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('/api/dayzero/account/delete failure', err);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    );
  }
}
