import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateForm, FormGenerationError } from "@/lib/ai/generate-form";
import type { ApiResponse, FormField } from "@/types";

const generateSchema = z.object({ prompt: z.string().min(1) });

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FormField[]>>> {
  try {
    const raw: unknown = await request.json();
    const { prompt } = generateSchema.parse(raw);
    const fields = await generateForm(prompt);
    return NextResponse.json({ ok: true, data: fields });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { ok: false, error: "Invalid input", code: 400 },
        { status: 400 }
      );
    if (error instanceof FormGenerationError)
      return NextResponse.json(
        { ok: false, error: error.message, code: error.status },
        { status: error.status }
      );
    console.error("POST /api/generate failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Something went wrong while generating the form. Please try again.",
        code: 500,
      },
      { status: 500 }
    );
  }
}
