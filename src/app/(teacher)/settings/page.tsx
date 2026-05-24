import { getSetting, getPromptTemplates } from "@/actions/settings";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const threshold = await getSetting("plagiarism_threshold");
  const templates = await getPromptTemplates();

  return <SettingsContent threshold={threshold} templates={templates} />;
}
