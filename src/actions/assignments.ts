"use server";

import { db } from "@/lib/db";
import {
  assignments,
  assignmentClasses,
  questions,
  llmModels,
  promptTemplates,
  courses,
  classes,
} from "@/lib/db/schema";
import { eq, and, inArray, sql, desc, asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Get all assignments for current teacher
export async function getAssignments() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  // Get course IDs for this teacher
  const teacherCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.teacherId, user.userId));

  const courseIds = teacherCourses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  // Get assignments for those courses
  const result = await db
    .select({
      id: assignments.id,
      name: assignments.name,
      courseId: assignments.courseId,
      courseName: courses.name,
      date: assignments.date,
      deadline: assignments.deadline,
      description: assignments.description,
      llmModelId: assignments.llmModelId,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(inArray(assignments.courseId, courseIds))
    .orderBy(desc(assignments.createdAt));

  return result;
}

// Get single assignment with questions and classes
export async function getAssignment(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return null;

  const assignment = await db
    .select({
      id: assignments.id,
      name: assignments.name,
      courseId: assignments.courseId,
      courseName: courses.name,
      date: assignments.date,
      deadline: assignments.deadline,
      description: assignments.description,
      llmModelId: assignments.llmModelId,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(assignments.id, id), eq(courses.teacherId, user.userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!assignment) return null;

  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.assignmentId, id))
    .orderBy(asc(questions.sortOrder));

  const classList = await db
    .select({
      id: classes.id,
      name: classes.name,
    })
    .from(assignmentClasses)
    .innerJoin(classes, eq(assignmentClasses.classId, classes.id))
    .where(eq(assignmentClasses.assignmentId, id));

  return {
    ...assignment,
    questions: questionList,
    classes: classList,
  };
}

// Create assignment
export async function createAssignment(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const courseId = formData.get("courseId") as string;
  const description = (formData.get("description") as string) || null;
  const deadline = formData.get("deadline") as string;
  const llmModelId = (formData.get("llmModelId") as string) || null;
  const classIdsRaw = formData.get("classIds") as string;

  if (!name || !courseId || !deadline) {
    return { error: "作业名称、所属课程和截止时间为必填项" };
  }

  // Verify course belongs to teacher
  const course = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.teacherId, user.userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!course) return { error: "课程不存在或无权限" };

  const [assignment] = await db
    .insert(assignments)
    .values({
      courseId,
      name,
      deadline: new Date(deadline),
      description,
      llmModelId: llmModelId || null,
      isPublished: false,
    })
    .returning();

  // Insert assignment-class associations
  if (classIdsRaw) {
    const classIds = classIdsRaw.split(",").filter(Boolean);
    if (classIds.length > 0) {
      await db.insert(assignmentClasses).values(
        classIds.map((classId) => ({
          assignmentId: assignment.id,
          classId,
        }))
      );
    }
  }

  revalidatePath("/teacher/assignments");
  return { success: true, id: assignment.id };
}

// Update assignment
export async function updateAssignment(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const courseId = formData.get("courseId") as string;
  const description = (formData.get("description") as string) || null;
  const deadline = formData.get("deadline") as string;
  const llmModelId = (formData.get("llmModelId") as string) || null;
  const classIdsRaw = formData.get("classIds") as string;

  if (!name || !courseId || !deadline) {
    return { error: "作业名称、所属课程和截止时间为必填项" };
  }

  // Verify assignment belongs to teacher via course
  const existing = await db
    .select({
      id: assignments.id,
      isPublished: assignments.isPublished,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(eq(assignments.id, id), eq(courses.teacherId, user.userId))
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) return { error: "作业不存在或无权限" };
  if (existing.isPublished) return { error: "已发布的作业无法编辑" };

  await db
    .update(assignments)
    .set({
      name,
      courseId,
      deadline: new Date(deadline),
      description,
      llmModelId: llmModelId || null,
    })
    .where(eq(assignments.id, id));

  // Update assignment-class associations
  // Delete existing and re-insert
  await db
    .delete(assignmentClasses)
    .where(eq(assignmentClasses.assignmentId, id));

  if (classIdsRaw) {
    const classIds = classIdsRaw.split(",").filter(Boolean);
    if (classIds.length > 0) {
      await db.insert(assignmentClasses).values(
        classIds.map((classId) => ({
          assignmentId: id,
          classId,
        }))
      );
    }
  }

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${id}`);
  return { success: true };
}

// Delete assignment (only if not published)
export async function deleteAssignment(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const existing = await db
    .select({
      id: assignments.id,
      isPublished: assignments.isPublished,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(eq(assignments.id, id), eq(courses.teacherId, user.userId))
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) return { error: "作业不存在或无权限" };
  if (existing.isPublished) return { error: "已发布的作业无法删除" };

  // Delete cascading: questions, assignment_classes, then assignment
  await db.delete(questions).where(eq(questions.assignmentId, id));
  await db
    .delete(assignmentClasses)
    .where(eq(assignmentClasses.assignmentId, id));
  await db.delete(assignments).where(eq(assignments.id, id));

  revalidatePath("/teacher/assignments");
  return { success: true };
}

// Publish assignment
export async function publishAssignment(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const existing = await db
    .select({
      id: assignments.id,
      isPublished: assignments.isPublished,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(eq(assignments.id, id), eq(courses.teacherId, user.userId))
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) return { error: "作业不存在或无权限" };
  if (existing.isPublished) return { error: "作业已发布" };

  // Check that assignment has at least one question
  const questionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.assignmentId, id))
    .then((rows) => rows[0]?.count ?? 0);

  if (questionCount === 0) {
    return { error: "作业至少需要一道题目才能发布" };
  }

  await db
    .update(assignments)
    .set({ isPublished: true })
    .where(eq(assignments.id, id));

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${id}`);
  return { success: true };
}

// Create question
export async function createQuestion(assignmentId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const scoreStr = formData.get("score") as string;
  const evalMethod = (formData.get("evalMethod") as string) || null;
  const evalCriteria = (formData.get("evalCriteria") as string) || null;
  const referenceAnswer = (formData.get("referenceAnswer") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const showFeedback = formData.get("showFeedback") === "on";
  const promptTemplateId =
    (formData.get("promptTemplateId") as string) || null;
  const evalPrompt = (formData.get("evalPrompt") as string) || null;

  if (!name) return { error: "题目名称为必填项" };
  const score = parseInt(scoreStr, 10);
  if (!scoreStr || isNaN(score) || score < 1 || score > 100) {
    return { error: "题目分值必须为 1-100 的整数" };
  }

  // Verify assignment belongs to teacher
  const assignment = await db
    .select({
      id: assignments.id,
      isPublished: assignments.isPublished,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(courses.teacherId, user.userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!assignment) return { error: "作业不存在或无权限" };
  if (assignment.isPublished) return { error: "已发布的作业无法添加题目" };

  // Get max sortOrder
  const maxSort = await db
    .select({ maxSort: sql<number>`coalesce(max(${questions.sortOrder}), 0)` })
    .from(questions)
    .where(eq(questions.assignmentId, assignmentId))
    .then((rows) => rows[0]?.maxSort ?? 0);

  await db.insert(questions).values({
    assignmentId,
    name,
    score,
    evalMethod,
    evalCriteria,
    referenceAnswer,
    notes,
    showFeedback,
    promptTemplateId: promptTemplateId || null,
    evalPrompt,
    sortOrder: maxSort + 1,
  });

  revalidatePath(`/teacher/assignments/${assignmentId}`);
  return { success: true };
}

// Update question
export async function updateQuestion(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const scoreStr = formData.get("score") as string;
  const evalMethod = (formData.get("evalMethod") as string) || null;
  const evalCriteria = (formData.get("evalCriteria") as string) || null;
  const referenceAnswer = (formData.get("referenceAnswer") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const showFeedback = formData.get("showFeedback") === "on";
  const promptTemplateId =
    (formData.get("promptTemplateId") as string) || null;
  const evalPrompt = (formData.get("evalPrompt") as string) || null;

  if (!name) return { error: "题目名称为必填项" };
  const score = parseInt(scoreStr, 10);
  if (!scoreStr || isNaN(score) || score < 1 || score > 100) {
    return { error: "题目分值必须为 1-100 的整数" };
  }

  // Verify question belongs to teacher via assignment -> course
  const question = await db
    .select({
      id: questions.id,
      assignmentId: questions.assignmentId,
      isPublished: assignments.isPublished,
    })
    .from(questions)
    .innerJoin(assignments, eq(questions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(questions.id, id), eq(courses.teacherId, user.userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!question) return { error: "题目不存在或无权限" };
  if (question.isPublished)
    return { error: "已发布作业的题目无法编辑" };

  await db
    .update(questions)
    .set({
      name,
      score,
      evalMethod,
      evalCriteria,
      referenceAnswer,
      notes,
      showFeedback,
      promptTemplateId: promptTemplateId || null,
      evalPrompt,
    })
    .where(eq(questions.id, id));

  revalidatePath(`/teacher/assignments/${question.assignmentId}`);
  return { success: true };
}

// Delete question
export async function deleteQuestion(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const question = await db
    .select({
      id: questions.id,
      assignmentId: questions.assignmentId,
      isPublished: assignments.isPublished,
    })
    .from(questions)
    .innerJoin(assignments, eq(questions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(questions.id, id), eq(courses.teacherId, user.userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!question) return { error: "题目不存在或无权限" };
  if (question.isPublished)
    return { error: "已发布作业的题目无法删除" };

  await db.delete(questions).where(eq(questions.id, id));

  revalidatePath(`/teacher/assignments/${question.assignmentId}`);
  return { success: true };
}

// Get courses for current teacher (for select dropdown)
export async function getTeacherCourses() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db
    .select({
      id: courses.id,
      name: courses.name,
      academicYear: courses.academicYear,
      semester: courses.semester,
    })
    .from(courses)
    .where(eq(courses.teacherId, user.userId))
    .orderBy(desc(courses.createdAt));
}

// Get classes for a specific course
export async function getCourseClasses(courseId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  // Verify course belongs to teacher
  const course = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.teacherId, user.userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!course) return [];

  return db
    .select({
      id: classes.id,
      name: classes.name,
    })
    .from(classes)
    .where(eq(classes.courseId, courseId))
    .orderBy(asc(classes.name));
}
