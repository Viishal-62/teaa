import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/services/cloudinary.service";

/**
 * POST /api/upload-image
 * Body: { image: string (base64 data URI), folder?: string }
 * Returns: { url, publicId, width, height }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, folder = "spill-covers" } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing 'image' field (base64 data URI expected)" },
        { status: 400 },
      );
    }

    // Validate it's a data URI
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Send a base64 data URI." },
        { status: 400 },
      );
    }

    // Check size — reject if > 10MB (base64 is ~33% larger than binary)
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { error: "Image too large. Maximum 10MB." },
        { status: 400 },
      );
    }

    const result = await uploadImage({
      file: image,
      folder,
    });

    return NextResponse.json({
      url: result.secureUrl,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
