import { OpenAI } from "openai";

const openRouterAPIKey = process.env.OPENROUTER_API_KEY;

const models = [
  "google/gemini-3.1-flash-image-preview",
  "black-forest-labs/flux.2-pro",
];

export async function generateCoverImage(options: {
  title: string;
  context?: string;
  custom?: string;
}): Promise<string> {
  for (const model of models) {
    try {
      return await generateWithModel(model, options);
    } catch (e) {
      console.error("Model failed:", model);
    }
  }
  throw new Error("All models failed");
}

async function generateWithModel(
  model: string,
  options: {
    title: string;
    context?: string;
    custom?: string;
  },
): Promise<string> {
  if (!openRouterAPIKey) {
    throw new Error("OPENROUTER_API_KEY is not defined");
  }

  const { title, context, custom } = options;

  let imagePrompt: string;

  if (custom && custom.trim().length > 0) {
    imagePrompt = `Create a cinematic cover image. ${custom.trim()}. Title: "${title}". No text.`;
  } else if (context && context.trim().length > 30) {
    const snippet = context.trim().slice(0, 500);
    imagePrompt = `Create a cinematic cover image. Title: "${title}". Context: "${snippet}". No text.`;
  } else {
    imagePrompt = `Create a cinematic cover image for "${title}". No text.`;
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterAPIKey,
  });

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: imagePrompt,
      },
    ],
    // @ts-expect-error
    modalities: ["image"],
  });

  const message = response.choices?.[0]?.message;

  if (!message) {
    throw new Error("No message");
  }

  const content = message.content;

  if (typeof content === "string" && content.length > 0) {
    const trimmed = content.trim();

    if (trimmed.startsWith("data:") || trimmed.startsWith("http")) {
      return trimmed;
    }

    const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/);
    if (urlMatch) return urlMatch[0];

    const clean = trimmed
      .replace(/^data:image\/[a-z]+;base64,/, "")
      .replace(/[^A-Za-z0-9+/=]/g, "");

    if (clean.length > 200) {
      return `data:image/png;base64,${clean}`;
    }
  }

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === "image_url" && block.image_url?.url) {
        return block.image_url.url;
      }
      if (block.type === "image" && block.url) {
        return block.url;
      }
      if (block.type === "text" && typeof block.text === "string") {
        const urlMatch = block.text.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch) return urlMatch[0];

        if (block.text.startsWith("data:")) return block.text;

        const clean = block.text
          .replace(/^data:image\/[a-z]+;base64,/, "")
          .replace(/[^A-Za-z0-9+/=]/g, "");

        if (clean.length > 200) {
          return `data:image/png;base64,${clean}`;
        }
      }
    }
  }

  const msgAny = message as unknown as Record<string, unknown>;

  if (typeof msgAny.image_url === "string") return msgAny.image_url;
  if (typeof msgAny.url === "string") return msgAny.url;

  if (typeof content === "string" && content.length > 50) {
    const fallback = content
      .replace(/^data:image\/[a-z]+;base64,/, "")
      .replace(/[^A-Za-z0-9+/=]/g, "");

    if (fallback.length > 200) {
      return `data:image/png;base64,${fallback}`;
    }
  }

  throw new Error("Extraction failed");
}
