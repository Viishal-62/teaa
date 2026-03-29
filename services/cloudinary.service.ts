import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary configuration — initialized once.
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadOptions = {
  /** The base64 data URI or file URL to upload */
  file: string;
  /** Subfolder inside Cloudinary (e.g. "spill-covers") */
  folder?: string;
  /** Optional public_id override */
  publicId?: string;
  /** Cloudinary transformation to apply on upload */
  transformation?: Record<string, unknown>[];
};

export type UploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

/**
 * Upload an image to Cloudinary.
 * Accepts a base64 data URI (e.g. "data:image/jpeg;base64,...") or a remote URL.
 *
 * @example
 * const result = await uploadImage({
 *   file: "data:image/jpeg;base64,/9j/4AAQ...",
 *   folder: "spill-covers",
 * });
 * console.log(result.secureUrl);
 */
export async function uploadImage(
  options: UploadOptions,
): Promise<UploadResult> {
  const { file, folder = "teaa", publicId, transformation } = options;

  const uploadOptions: Record<string, unknown> = {
    folder,
    resource_type: "image",
    overwrite: true,
    quality: "auto:good",
    fetch_format: "auto",
  };

  if (publicId) uploadOptions.public_id = publicId;
  if (transformation) uploadOptions.transformation = transformation;

  const result = await cloudinary.uploader.upload(file, uploadOptions);

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete an image from Cloudinary by public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Build an optimized Cloudinary URL with transformations.
 *
 * @example
 * const url = getOptimizedUrl("teaa/spill-covers/abc123", {
 *   width: 600,
 *   height: 840,
 *   crop: "fill",
 *   gravity: "auto",
 * });
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    quality?: string | number;
    format?: string;
  } = {},
): string {
  const {
    width,
    height,
    crop = "fill",
    gravity = "auto",
    quality = "auto:good",
    format = "auto",
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      {
        ...(width && { width }),
        ...(height && { height }),
        crop,
        gravity,
        quality,
        fetch_format: format,
      },
    ],
    secure: true,
  });
}

export { cloudinary };
