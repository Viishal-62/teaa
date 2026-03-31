import { NextRequest, NextResponse } from "next/server";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary credentials not configured");
}

/**
 * Upload audio to Cloudinary
 * POST /api/upload-voice
 * Body: FormData with 'audio' field containing Blob
 * Returns: { secure_url: string, public_id: string, duration: number }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 }
      );
    }

    // Create FormData for Cloudinary API
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", audioFile);
    cloudinaryFormData.append("upload_preset", "voice_confessions"); // You'll need to create this preset in Cloudinary
    cloudinaryFormData.append("resource_type", "auto");
    cloudinaryFormData.append("folder", "voice-confessions");
    cloudinaryFormData.append("tags", "voice,confession");

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Cloudinary upload error:", error);
      return NextResponse.json(
        { error: "Upload failed", details: error },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      secure_url: data.secure_url,
      public_id: data.public_id,
      duration: data.duration,
      format: data.format,
      size: data.bytes,
    });
  } catch (error) {
    console.error("Voice upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
