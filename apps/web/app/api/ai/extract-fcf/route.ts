import { NextResponse } from "next/server";
import { z } from "zod";

import { runExtractionAgent } from "@/lib/ai/extractionAgent";
import { promptVersion } from "@/lib/ai/prompts";
import { fcfJsonSchema } from "@/lib/fcf/schema";

const requestSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    text: z.string().optional(),
    hints: z
      .object({
        featureType: z.string().optional(),
        standard: z.string().optional()
      })
      .optional()
  })
  .refine((val) => Boolean(val.imageUrl || val.text), {
    message: "Provide imageUrl or text"
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const extraction = await runExtractionAgent(parsed.data);
    // Optional server-side schema check to fail fast before returning to clients.
    const schemaCheck = fcfJsonSchema.safeParse(extraction.fcf);
    if (!schemaCheck.success) {
      return NextResponse.json(
        { error: "Extraction produced invalid FcfJson", details: schemaCheck.error.format() },
        { status: 502 }
      );
    }

    return NextResponse.json({ ...extraction, promptVersion });
  } catch (error) {
    console.error("[extract-fcf] failed", error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
