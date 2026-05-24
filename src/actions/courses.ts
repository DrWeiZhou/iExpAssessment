"use server";

import { db } from "@/lib/db";
import { courses, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.courses.findMany({
    where: eq(courses.teacherId, user.userId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getCourse(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return null;

  return db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.teacherId, user.userId)),
    with: { classes: true },
  });
}

export async function createCourse(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const academicYear = formData.get("academicYear") as string;
  const semester = formData.get("semester") as string;
  const studentCountStr = formData.get("studentCount") as string;
  const classComposition = formData.get("classComposition") as string;

  if (!name || !academicYear || !semester) {
    return { error: "课程名称、学年、学期为必填项" };
  }

  const studentCount = studentCountStr ? parseInt(studentCountStr, 10) : 0;

  await db.insert(courses).values({
    teacherId: user.userId,
    name,
    academicYear,
    semester,
    studentCount,
    classComposition: classComposition || null,
  });

  revalidatePath("/teacher/courses");
  return { success: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const academicYear = formData.get("academicYear") as string;
  const semester = formData.get("semester") as string;
  const studentCountStr = formData.get("studentCount") as string;
  const classComposition = formData.get("classComposition") as string;

  if (!name || !academicYear || !semester) {
    return { error: "课程名称、学年、学期为必填项" };
  }

  const studentCount = studentCountStr ? parseInt(studentCountStr, 10) : 0;

  await db
    .update(courses)
    .set({
      name,
      academicYear,
      semester,
      studentCount,
      classComposition: classComposition || null,
    })
    .where(and(eq(courses.id, id), eq(courses.teacherId, user.userId)));

  revalidatePath("/teacher/courses");
  revalidatePath(`/teacher/courses/${id}`);
  return { success: true };
}

export async function deleteCourse(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.teacherId, user.userId)));

  revalidatePath("/teacher/courses");
  return { success: true };
}

export async function createClass(courseId: string, name: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  // Verify ownership of the course
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), eq(courses.teacherId, user.userId)),
  });
  if (!course) return { error: "课程不存在或无权操作" };

  await db.insert(classes).values({ courseId, name });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}
