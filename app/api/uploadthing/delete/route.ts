import { UTApi } from "uploadthing/server";
import { NextRequest, NextResponse } from "next/server";

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }
    await utapi.deleteFiles(fileKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UT Delete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}