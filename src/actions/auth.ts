"use server";

import { db } from "@/lib/db";
import { users, teacherProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";

export async function registerTeacher(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const college = formData.get("college") as string;
  const major = formData.get("major") as string;
  const phone = formData.get("phone") as string;

  if (!username || !password || !name) {
    return { error: "用户名、密码和姓名为必填项" };
  }

  if (username.length < 3) {
    return { error: "用户名至少3个字符" };
  }

  if (password.length < 6) {
    return { error: "密码至少6个字符" };
  }

  // Check unique username
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    return { error: "用户名已存在" };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      role: "teacher",
      phone: phone || null,
    })
    .returning();

  // Insert teacher profile
  await db.insert(teacherProfiles).values({
    userId: newUser.id,
    name,
    college: college || null,
    major: major || null,
  });

  // Create JWT and set cookie
  const token = await createToken({
    userId: newUser.id,
    role: "teacher",
  });
  await setAuthCookie(token);

  return { success: true, role: "teacher" as const };
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "用户名和密码为必填项" };
  }

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return { error: "用户名或密码错误" };
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "用户名或密码错误" };
  }

  // Create JWT and set cookie
  const token = await createToken({
    userId: user.id,
    role: user.role as "teacher" | "student",
  });
  await setAuthCookie(token);

  return { success: true, role: user.role as "teacher" | "student" };
}

export async function logout() {
  await clearAuthCookie();
  return { success: true };
}
