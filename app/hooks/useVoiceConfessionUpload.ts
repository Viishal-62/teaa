import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getVisitorId } from "@/app/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface UseVoiceConfessionUploadOptions {
  boardId?: Id<"boards">;
}

export const useVoiceConfessionUpload = (
  options?: UseVoiceConfessionUploadOptions,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConfession = useMutation(api.confessions.create);

  const uploadVoiceConfession = async (
    audioBlob: Blob,
    category: string,
    boardId?: Id<"boards">,
    voiceTitle?: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Upload audio to Cloudinary
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const uploadResponse = await fetch("/api/upload-voice", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(
          errorData.message || "Failed to upload audio to Cloudinary",
        );
      }

      const { secure_url, public_id, duration } = await uploadResponse.json();

      // Step 2: Create confession record in Convex
      const confessionId = await createConfession({
        type: "voice",
        category,
        audioUrl: secure_url,
        voiceTitle: voiceTitle || undefined,
        cloudinaryPublicId: public_id,
        isAnonymousVoice: false,
        duration,
        boardId: (boardId || options?.boardId)!,
        visitorId: getVisitorId(),
      });

      return {
        success: true,
        confessionId,
        audioUrl: secure_url,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadVoiceConfession,
    isLoading,
    error,
  };
};
