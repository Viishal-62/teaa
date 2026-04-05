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

export async function summarizeConfessions(texts: string[]): Promise<string> {
  if (!openRouterAPIKey) {
    throw new Error("OPENROUTER_API_KEY is not defined");
  }

  const context = texts.join("\n---\n").slice(0, 8000); // limit context

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterAPIKey,
  });

  const prompt = `
    You are a witty, aesthetic gossip columnist for "Teaaa!", a platform where people spill their deepest secrets.
    Below is a collection of anonymous confessions. 
    
    Your goal: Generate a "Board Vibe" summary that is funny, shareable, and slightly dramatic. 
    Use tea metaphors (steeping, brewing, bitter, sweet, spilling, etc.).
    Keep it to exactly 2 sentences. 
    Make it sound sophisticated yet playful.
    
    CONFESSIONS:
    ${context}
    
    SUMMARY:
  `;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  const summary = response.choices?.[0]?.message?.content;
  if (!summary) throw new Error("AI failed to generate summary");

  return summary.trim();
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

/**
 * Moderate a piece of text using Gemini (via OpenRouter).
 * Checks for toxic intent, severe harassment, or illegal content.
 * Returns { isClean: boolean, reason: string }.
 */
export async function moderateTextWithAI(text: string): Promise<{
  isClean: boolean;
  reason: string;
}> {
  if (!openRouterAPIKey) {
    throw new Error("OPENROUTER_API_KEY is not defined");
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterAPIKey,
  });

  const prompt = `
    You are a strict but fair content moderator for "Teaaa!", an anonymous gossip platform.
    Your goal: Identify if the message below is "dangerous" or "hurtful".

    DO NOT block: 
    - Petty drama, gossip, or light "roasts".
    - Mild swear words (though they are filtered by a separate system).
    - Opinions, even if spicy or unpopular.

    DO BLOCK (isClean = false):
    - Severe slurs or hate speech.
    - Death threats or encouragement of self-harm/suicide.
    - Illegal content (drugs, weapons, CP).
    - Severe, targeted harassment (e.g., exposing a phone number or home address).
    - Hardcore sexual content.

    MESSAGE TO CHECK:
    "${text}"

    RESPONSE FORMAT (JSON ONLY):
    {
      "isClean": boolean,
      "reason": "Short, witty feedback explaining why (if isClean is false)"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1, // Keep it deterministic
    response_format: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI failed to moderate");

  try {
    const result = JSON.parse(content);
    return {
      isClean: result.isClean === true,
      reason:
        result.reason || "This content doesn't meet our community standards.",
    };
  } catch {
    // If JSON parsing fails, default to safe
    return { isClean: true, reason: "" };
  }
}
