import { getModels } from "@/actions/models";
import { ModelsContent } from "./models-content";

export default async function ModelsPage() {
  const models = await getModels();

  return <ModelsContent models={models} />;
}
