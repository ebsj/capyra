import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "capyra-web",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}

