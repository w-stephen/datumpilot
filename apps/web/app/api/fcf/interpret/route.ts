import { NextResponse } from "next/server";
import { z } from "zod";

import { orchestrateFcfInterpretation } from "@/lib/ai/orchestrator.server";
import { fcfJsonSchema } from "@/lib/fcf/schema";

const calculationInputSchema = z
  .object({
    characteristic: z.enum(["position", "flatness", "perpendicularity", "profile"]),
    input: z.unknown()
  })
  .optional();

const interpretRequestSchema = z.object({
    imageUrl: z.string().url().optional(),
    text: z.string().optional(),
    fcf: z.unknown().optional(),
    calculationInput: calculationInputSchema,
    parseConfidenceOverride: z.number().min(0).max(1).optional(),
    correlationId: z.string().optional()
  })
  .refine((val) => Boolean(val.fcf || val.imageUrl || val.text), {
    message: "Provide fcf or imageUrl/text"
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = interpretRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    // Optional server-side schema validation if fcf provided directly.
    if (parsed.data.fcf) {
      const check = fcfJsonSchema.safeParse(parsed.data.fcf);
      if (!check.success) {
        return NextResponse.json(
          { error: "Invalid FcfJson payload", details: check.error.format() },
          { status: 400 }
        );
      }
    }

    const result = await orchestrateFcfInterpretation(parsed.data);
    const statusCode = result.status === "ok" ? 200 : result.stage === "extraction" ? 502 : 400;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[fcf/interpret] failed", error);
    return NextResponse.json({ error: "Interpretation failed" }, { status: 500 });
  }
}
