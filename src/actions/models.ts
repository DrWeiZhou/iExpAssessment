"use server";

import { db } from "@/lib/db";
import { llmModels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getModels() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.llmModels.findMany({
    where: eq(llmModels.teacherId, user.userId),
    orderBy: (models, { desc }) => [desc(models.createdAt)],
  });
}

export async function createModel(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const displayName = formData.get("displayName") as string;
  const modelName = formData.get("modelName") as string;
  const baseUrl = formData.get("baseUrl") as string;
  const apiKey = formData.get("apiKey") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (!displayName || !modelName || !baseUrl || !apiKey) {
    return { error: "所有字段为必填项" };
  }

  if (isDefault) {
    await db
      .update(llmModels)
      .set({ isDefault: false })
      .where(
        and(eq(llmModels.teacherId, user.userId), eq(llmModels.isDefault, true))
      );
  }

  await db.insert(llmModels).values({
    teacherId: user.userId,
    displayName,
    modelName,
    baseUrl,
    apiKey,
    isDefault,
  });

  revalidatePath("/teacher/models");
  return { success: true };
}

export async function updateModel(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const displayName = formData.get("displayName") as string;
  const modelName = formData.get("modelName") as string;
  const baseUrl = formData.get("baseUrl") as string;
  const apiKey = formData.get("apiKey") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (!displayName || !modelName || !baseUrl) {
    return { error: "显示名称、模型名称和 Base URL 为必填项" };
  }

  if (isDefault) {
    await db
      .update(llmModels)
      .set({ isDefault: false })
      .where(
        and(eq(llmModels.teacherId, user.userId), eq(llmModels.isDefault, true))
      );
  }

  const updateData: Record<string, unknown> = {
    displayName,
    modelName,
    baseUrl,
    isDefault,
  };

  // Only update apiKey if a new value is provided
  if (apiKey) {
    updateData.apiKey = apiKey;
  }

  await db
    .update(llmModels)
    .set(updateData)
    .where(and(eq(llmModels.id, id), eq(llmModels.teacherId, user.userId)));

  revalidatePath("/teacher/models");
  return { success: true };
}

export async function deleteModel(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .delete(llmModels)
    .where(and(eq(llmModels.id, id), eq(llmModels.teacherId, user.userId)));

  revalidatePath("/teacher/models");
  return { success: true };
}
