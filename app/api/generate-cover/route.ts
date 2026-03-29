import { NextRequest, NextResponse } from "next/server";
import { generateCoverImage } from "@/services/ai.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("[BODY]", body);
    const title = (body.title || body.prompt) as string;

    console.log(body);
    const context = body.context as string | undefined;
    const custom = body.custom as string | undefined;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required to generate a cover image." },
        { status: 400 },
      );
    }

    const imageUrl = await generateCoverImage({
      title: title.trim(),
      context: context?.trim(),
      custom: custom?.trim(),
    });

    console.log("[IMAGE URL]", imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Cover generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover image. Please try again." },
      { status: 500 },
    );
  }
}
