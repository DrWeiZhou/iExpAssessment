"use server";

import { db } from "@/lib/db";
import { systemSettings, promptTemplates } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value } });

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function getPromptTemplates() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.promptTemplates.findMany({
    where: or(
      eq(promptTemplates.teacherId, user.userId),
      isNull(promptTemplates.teacherId)
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function createPromptTemplate(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;

  if (!name || !content) return { error: "名称和内容为必填项" };

  await db.insert(promptTemplates).values({
    teacherId: user.userId,
    name,
    content,
    isSystem: false,
  });

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function updatePromptTemplate(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;

  if (!name || !content) return { error: "名称和内容为必填项" };

  await db
    .update(promptTemplates)
    .set({ name, content })
    .where(eq(promptTemplates.id, id));

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function deletePromptTemplate(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db.delete(promptTemplates).where(eq(promptTemplates.id, id));

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function seedSystemTemplates() {
  const existing = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.isSystem, true),
  });

  if (!existing) {
    await db.insert(promptTemplates).values({
      teacherId: null,
      name: "默认评价模板",
      content: `本实践题目为{题目名称}，满分为{题目分值}

请以如下评价方式对学生答案进行评价。
评价方式为：{评价方式}

其中参考答案为：
{参考答案}

学生答案为：
{学生答案}

需要注意的是{备注}

你的回复以JSON格式输出，包括3部分：
- 评价分数（0-100整数）
- 学生作答的评价
- 下一步学习建议`,
      isSystem: true,
    });
  }

  const threshold = await getSetting("plagiarism_threshold");
  if (!threshold) {
    await setSetting("plagiarism_threshold", "0.99");
  }
}
