import { NextResponse } from "next/server";

export async function POST() {
    // Middleware intercepts this first and updates the cookie.
    // We just return a success payload.
    return NextResponse.json({ active: true }, { status: 200 });
}
