import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");
  const wolframId = process.env.WOLFRAM_ID; // Use private env var for security

  if (!input) {
    return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(
        input,
      )}&format=image%2Cplaintext&appid=${wolframId}`,
    );

    if (!response.ok) {
      return NextResponse.json({ error: "WolframAlpha API error" }, { status: response.status });
    }

    const data = await response.text();
    return new NextResponse(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}