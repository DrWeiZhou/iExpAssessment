"use server";

import { db } from "@/lib/db";
import {
  assignments,
  assignmentClasses,
  classes,
  classStudents,
  submissions,
  questions,
  evaluations,
  courses,
} from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// Get assignments available to current student (published + assigned to their classes)
export async function getStudentAssignments() {
  const user = await getAuthUser();
  if (!user || user.role !== "student") return [];

  // 1. Find all classes the student is in
  const studentClasses = await db
    .select({ classId: classStudents.classId })
    .from(classStudents)
    .where(eq(classStudents.studentId, user.userId));

  const classIds = studentClasses.map((c) => c.classId);
  if (classIds.length === 0) return [];

  // 2. Find all assignment_classes for those classes
  const assignmentClassRows = await db
    .select({ assignmentId: assignmentClasses.assignmentId })
    .from(assignmentClasses)
    .where(inArray(assignmentClasses.classId, classIds));

  const assignmentIds = [
    ...new Set(assignmentClassRows.map((ac) => ac.assignmentId)),
  ];
  if (assignmentIds.length === 0) return [];

  // 3. Return those assignments that are published
  const result = await db
    .select({
      id: assignments.id,
      name: assignments.name,
      courseId: assignments.courseId,
      courseName: courses.name,
      date: assignments.date,
      deadline: assignments.deadline,
      description: assignments.description,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(
        inArray(assignments.id, assignmentIds),
        eq(assignments.isPublished, true)
      )
    )
    .orderBy(asc(assignments.deadline));

  // 4. For each assignment, compute completion status
  const enriched = await Promise.all(
    result.map(async (assignment) => {
      const questionList = await db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.assignmentId, assignment.id));

      const questionIds = questionList.map((q) => q.id);
      const totalQuestions = questionIds.length;

      let submittedCount = 0;
      let draftCount = 0;

      if (totalQuestions > 0) {
        const studentSubmissions = await db
          .select({ questionId: submissions.questionId, status: submissions.status })
          .from(submissions)
          .where(
            and(
              inArray(submissions.questionId, questionIds),
              eq(submissions.studentId, user.userId)
            )
          );

        for (const sub of studentSubmissions) {
          if (sub.status === "submitted") submittedCount++;
          else if (sub.status === "draft") draftCount++;
        }
      }

      let status: "not_started" | "in_progress" | "completed" = "not_started";
      if (submittedCount === totalQuestions && totalQuestions > 0) {
        status = "completed";
      } else if (submittedCount > 0 || draftCount > 0) {
        status = "in_progress";
      }

      return {
        ...assignment,
        totalQuestions,
        submittedCount,
        status,
      };
    })
  );

  return enriched;
}

// Get assignment with questions and student's submission status
export async function getStudentAssignment(assignmentId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "student") return null;

  const assignment = await db
    .select({
      id: assignments.id,
      name: assignments.name,
      courseId: assignments.courseId,
      courseName: courses.name,
      date: assignments.date,
      deadline: assignments.deadline,
      description: assignments.description,
      isPublished: assignments.isPublished,
      llmModelId: assignments.llmModelId,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(eq(assignments.id, assignmentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!assignment || !assignment.isPublished) return null;

  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.assignmentId, assignmentId))
    .orderBy(asc(questions.sortOrder));

  // Get submissions for this student for these questions
  const questionIds = questionList.map((q) => q.id);
  const studentSubmissions: Record<string, { status: string; id: string }> = {};

  if (questionIds.length > 0) {
    const subs = await db
      .select({
        questionId: submissions.questionId,
        status: submissions.status,
        id: submissions.id,
      })
      .from(submissions)
      .where(
        and(
          inArray(submissions.questionId, questionIds),
          eq(submissions.studentId, user.userId)
        )
      );

    for (const sub of subs) {
      studentSubmissions[sub.questionId] = {
        status: sub.status,
        id: sub.id,
      };
    }
  }

  // Check if past deadline for feedback display
  const isPastDeadline = new Date() > new Date(assignment.deadline);

  // Get evaluations for submitted questions (if past deadline)
  const evaluationMap: Record<
    string,
    { score: number | null; evaluation: string | null; suggestion: string | null }
  > = {};

  if (isPastDeadline) {
    const submittedIds = Object.values(studentSubmissions)
      .filter((s) => s.status === "submitted")
      .map((s) => s.id);

    if (submittedIds.length > 0) {
      const evals = await db
        .select({
          submissionId: evaluations.submissionId,
          score: evaluations.score,
          evaluation: evaluations.evaluation,
          suggestion: evaluations.suggestion,
        })
        .from(evaluations)
        .where(inArray(evaluations.submissionId, submittedIds));

      for (const ev of evals) {
        evaluationMap[ev.submissionId] = {
          score: ev.score,
          evaluation: ev.evaluation,
          suggestion: ev.suggestion,
        };
      }
    }
  }

  const questionsWithStatus = questionList.map((q) => {
    const sub = studentSubmissions[q.id];
    let submissionStatus: "未答" | "暂存" | "已提交" = "未答";
    let evaluationResult = null;

    if (sub) {
      if (sub.status === "submitted") {
        submissionStatus = "已提交";
        if (isPastDeadline && q.showFeedback && evaluationMap[sub.id]) {
          evaluationResult = evaluationMap[sub.id];
        }
      } else {
        submissionStatus = "暂存";
      }
    }

    return {
      ...q,
      submissionStatus,
      evaluation: evaluationResult,
    };
  });

  return {
    ...assignment,
    isPastDeadline,
    questions: questionsWithStatus,
  };
}

// Get question details with student's current submission
export async function getStudentQuestion(questionId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "student") return null;

  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!question) return null;

  // Get assignment info for deadline check
  const assignment = await db
    .select({
      id: assignments.id,
      name: assignments.name,
      deadline: assignments.deadline,
    })
    .from(assignments)
    .where(eq(assignments.id, question.assignmentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!assignment) return null;

  const isPastDeadline = new Date() > new Date(assignment.deadline);

  // Get student's submission
  const submission = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.questionId, questionId),
        eq(submissions.studentId, user.userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  let evaluationResult = null;
  if (
    submission?.status === "submitted" &&
    isPastDeadline &&
    question.showFeedback
  ) {
    const evalRow = await db
      .select({
        score: evaluations.score,
        evaluation: evaluations.evaluation,
        suggestion: evaluations.suggestion,
      })
      .from(evaluations)
      .where(eq(evaluations.submissionId, submission.id))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (evalRow) {
      evaluationResult = evalRow;
    }
  }

  return {
    question,
    assignment,
    submission,
    evaluation: evaluationResult,
    isPastDeadline,
  };
}
