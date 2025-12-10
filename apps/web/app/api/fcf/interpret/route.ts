import { NextResponse } from "next/server";
import { z } from "zod";

import { orchestrateFcfInterpretation } from "@/lib/ai/orchestrator.server";
import { InterpretFcfRequest } from "@/lib/ai/types";
import { fcfJsonSchema } from "@/lib/fcf/schema";

const calculationInputSchema = z
  .object({
    characteristic: z.enum(["position", "flatness", "perpendicularity", "profile"]),
    input: z.unknown()
  })
  .optional();

// Simplified for v1: FCF is required (no image/text extraction)
const interpretRequestSchema = z.object({
  fcf: fcfJsonSchema,
  calculationInput: calculationInputSchema,
  correlationId: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = interpretRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const request: InterpretFcfRequest = {
      fcf: parsed.data.fcf,
      calculationInput: parsed.data.calculationInput as InterpretFcfRequest["calculationInput"],
      correlationId: parsed.data.correlationId
    };

    const result = await orchestrateFcfInterpretation(request);
    const statusCode = result.status === "ok" ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[fcf/interpret] failed", error);
    return NextResponse.json({ error: "Interpretation failed" }, { status: 500 });
  }
}
