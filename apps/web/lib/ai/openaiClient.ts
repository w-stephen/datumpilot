import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("[openai] OPENAI_API_KEY is not set; AI calls will fail");
}

export const openaiClient = new OpenAI({ apiKey });

export type ChatJSONOptions = {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
};

/**
 * Calls OpenAI chat completions with JSON response_format enforced.
 */
export async function chatJson<T>(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: ChatJSONOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);

  try {
    const completion = await openaiClient.chat.completions.create(
      {
        model: options.model ?? "gpt-5.1",
        temperature: options.temperature ?? 0,
        response_format: { type: "json_object" },
        messages
      },
      { signal: controller.signal }
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned no content");
    }

    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeout);
  }
}
