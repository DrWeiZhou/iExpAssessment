import { getModels } from "@/actions/models";
import { ModelsContent } from "./models-content";

export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
  const models = await getModels();

  return <ModelsContent models={models} />;
}
