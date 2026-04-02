import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/services/cloudinary.service";

/**
 * POST /api/upload-doodle
 * Body: { image: string (base64 data URI) }
 * Returns: { url, publicId, width, height }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing 'image' field (base64 data URI expected)" },
        { status: 400 },
      );
    }

    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Send a base64 data URI." },
        { status: 400 },
      );
    }

    // Check size — reject if > 5MB
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024;
    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { error: "Doodle too large. Maximum 5MB." },
        { status: 400 },
      );
    }

    const result = await uploadImage({
      file: image,
      folder: "doodle-confessions",
    });

    return NextResponse.json({
      url: result.secureUrl,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Doodle upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload doodle" },
      { status: 500 },
    );
  }
}
