import { chatJson } from "./openaiClient";
import { buildExtractionUserPrompt, promptVersion, extractionSystemPrompt } from "./prompts";
import { exampleFcf } from "@/lib/fcf/examples";
import { ExtractionAgentRequest, ExtractionAgentResponse } from "./types";

const schemaSummaryForPrompt = `
{
  characteristic: "position|flatness|perpendicularity|profile|other",
  featureType?: "hole|slot|pin|boss|surface|plane|edge",
  sourceUnit: "mm|inch",
  source: { inputType: "image|builder|json", fileUrl?: string },
  tolerance: { value: number, diameter?: boolean, materialCondition?: "MMC|LMC|RFS", zoneShape?: "cylindrical|spherical|twoParallelPlanes|twoParallelLines" },
  datums?: [{ id: string, materialCondition?: "MMC|LMC|RFS" }],
  modifiers?: ["FREE_STATE"|"PROJECTED_TOLERANCE_ZONE"|"TANGENT_PLANE"|"UNEQUALLY_DISPOSED"],
  pattern?: { count?: number, note?: string },
  sizeDimension?: { nominal: number, tolerancePlus?: number, toleranceMinus?: number, unit?: "mm|inch", note?: string },
  projectedZone?: { height: number, unit?: "mm|inch" },
  composite?: object,
  notes?: string[]
}`;

export async function runExtractionAgent(
  request: ExtractionAgentRequest
): Promise<ExtractionAgentResponse> {
  if (!request.imageUrl && !request.text) {
    throw new Error("runExtractionAgent requires imageUrl or text input");
  }

  const userPrompt = buildExtractionUserPrompt({
    imageUrl: request.imageUrl,
    text: request.text,
    schema: schemaSummaryForPrompt,
    featureTypeHint: request.hints?.featureType,
    standard: request.hints?.standard,
    examples: JSON.stringify(exampleFcf, null, 2)
  });

  const response = await chatJson<ExtractionAgentResponse>(
    [
      { role: "system", content: extractionSystemPrompt.trim() },
      { role: "user", content: userPrompt.trim() }
    ],
    { model: "gpt-5.1", temperature: 0 }
  );

  return { ...response, notes: response.notes ?? [], parseConfidence: response.parseConfidence ?? 0, rawText: response.rawText, promptVersion };
}
