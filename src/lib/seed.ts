import { seedSystemTemplates } from "@/actions/settings";

export async function runSeed() {
  console.log("Seeding system templates...");
  await seedSystemTemplates();
  console.log("Seed completed successfully.");
}
