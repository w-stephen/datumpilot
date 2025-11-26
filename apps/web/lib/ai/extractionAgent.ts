import { ExtractionAgentRequest, ExtractionAgentResponse } from "./types";

/**
 * Calls the GPT-5.1 Extraction Agent to parse an FCF from an image or text.
 * This is a typed stub; wire it to the OpenAI client and prompt template.
 */
export async function runExtractionAgent(
  request: ExtractionAgentRequest
): Promise<ExtractionAgentResponse> {
  if (!request.imageUrl && !request.text) {
    throw new Error("runExtractionAgent requires imageUrl or text input");
  }

  throw new Error("Extraction Agent not implemented - connect to GPT-5.1 client");
}
