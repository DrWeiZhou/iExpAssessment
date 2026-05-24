import { seedSystemTemplates } from "@/actions/settings";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await seedSystemTemplates();
    return NextResponse.json({ success: true, message: "System templates seeded" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Seed failed", error: String(error) },
      { status: 500 }
    );
  }
}
