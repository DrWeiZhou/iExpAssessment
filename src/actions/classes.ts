"use server";

import { db } from "@/lib/db";
import {
  classes,
  classStudents,
  courseStudents,
  users,
  studentProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { parseStudentExcel } from "@/lib/excel";
import { revalidatePath } from "next/cache";

export async function getClass(classId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return null;

  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: {
      course: {
        columns: { id: true, name: true, teacherId: true },
      },
      classStudents: {
        with: {
          student: {
            with: {
              studentProfile: true,
            },
          },
        },
      },
    },
  });

  if (!classData) return null;
  if (classData.course.teacherId !== user.userId) return null;

  return classData;
}

export async function importStudents(
  classId: string,
  formData: FormData
): Promise<{
  imported: number;
  skipped: number;
  parseErrors: string[];
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return { imported: 0, skipped: 0, parseErrors: [], error: "未授权" };
  }

  // Verify class ownership
  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: { course: true },
  });

  if (!classData || classData.course.teacherId !== user.userId) {
    return { imported: 0, skipped: 0, parseErrors: [], error: "班级不存在或无权操作" };
  }

  const courseId = classData.courseId;
  const file = formData.get("file") as File | null;
  if (!file) {
    return { imported: 0, skipped: 0, parseErrors: [], error: "请选择文件" };
  }

  const buffer = await file.arrayBuffer();
  const { students, errors: parseErrors } = parseStudentExcel(buffer);

  let imported = 0;
  let skipped = 0;

  for (const row of students) {
    // Find existing student by studentNo
    let profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.studentNo, row.studentNo),
    });

    let studentId: string;

    if (profile) {
      studentId = profile.userId;
    } else {
      // Create user + student profile
      const passwordHash = await hashPassword(row.studentNo);
      const [newUser] = await db
        .insert(users)
        .values({
          username: row.studentNo,
          passwordHash,
          role: "student",
          phone: row.phone || null,
          email: row.email || null,
        })
        .returning({ id: users.id });

      studentId = newUser.id;

      await db.insert(studentProfiles).values({
        userId: studentId,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender || null,
        college: row.college || null,
        grade: row.grade || null,
        major: row.major || null,
        className: row.className || null,
        phone: row.phone || null,
        email: row.email || null,
        isRetake: row.isRetake ?? false,
      });

    }

    // Check if student is already in this class
    const existingInClass = await db.query.classStudents.findFirst({
      where: and(
        eq(classStudents.classId, classId),
        eq(classStudents.studentId, studentId)
      ),
    });

    if (existingInClass) {
      skipped++;
      continue;
    }

    // Add to classStudents
    await db.insert(classStudents).values({
      classId,
      studentId,
    });

    // Add to courseStudents if not already there
    const existingInCourse = await db.query.courseStudents.findFirst({
      where: and(
        eq(courseStudents.courseId, courseId),
        eq(courseStudents.studentId, studentId)
      ),
    });

    if (!existingInCourse) {
      await db.insert(courseStudents).values({
        courseId,
        studentId,
      });
    }

    imported++;
  }

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/teacher/courses/${courseId}`);

  return { imported, skipped, parseErrors };
}

export async function removeStudentFromClass(
  classId: string,
  studentId: string
) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return { error: "未授权" };
  }

  // Verify class ownership
  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: { course: true },
  });

  if (!classData || classData.course.teacherId !== user.userId) {
    return { error: "班级不存在或无权操作" };
  }

  await db
    .delete(classStudents)
    .where(
      and(
        eq(classStudents.classId, classId),
        eq(classStudents.studentId, studentId)
      )
    );

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}
