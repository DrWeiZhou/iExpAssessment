"use server";

import { db } from "@/lib/db";
import {
  submissions,
  questions,
  evaluations,
  assignments,
  llmModels,
  submissionStatusEnum,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { findMaxSimilarity } from "@/lib/plagiarism";
import { getSetting } from "@/actions/settings";
import { evaluateAnswer } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function saveDraft(
  questionId: string,
  answer: string,
  notes: string
) {
  const user = await getAuthUser();
  if (!user || user.role !== "student") return { error: "未授权" };

  const existing = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.questionId, questionId),
      eq(submissions.studentId, user.userId)
    ),
  });

  if (existing) {
    await db
      .update(submissions)
      .set({
        answer,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id));
  } else {
    await db.insert(submissions).values({
      questionId,
      studentId: user.userId,
      answer,
      notes,
      status: "draft",
    });
  }

  revalidatePath("/student");
  return { success: true };
}

export async function submitAnswer(
  questionId: string,
  answer: string,
  notes: string
) {
  const user = await getAuthUser();
  if (!user || user.role !== "student") return { error: "未授权" };

  if (!answer || !answer.trim()) {
    return { error: "答案不能为空" };
  }

  // Get all existing submitted answers for the same question
  const existingSubmissions = await db.query.submissions.findMany({
    where: and(
      eq(submissions.questionId, questionId),
      eq(submissions.status, submissionStatusEnum.enumValues[1]) // "submitted"
    ),
  });

  const existingAnswers = existingSubmissions
    .map((s) => s.answer)
    .filter((a): a is string => a !== null);

  // Check plagiarism using findMaxSimilarity (it normalizes whitespace internally)
  const maxSimilarity = findMaxSimilarity(answer, existingAnswers);

  // Get plagiarism threshold from system settings
  const thresholdStr = await getSetting("plagiarism_threshold");
  const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.99;

  if (maxSimilarity >= threshold) {
    return { error: "重复率过高，提交被拒绝" };
  }

  // Save or update submission as submitted (preserve original answer with spaces/newlines)
  const existing = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.questionId, questionId),
      eq(submissions.studentId, user.userId)
    ),
  });

  let submissionId: string;

  if (existing) {
    await db
      .update(submissions)
      .set({
        answer,
        notes,
        status: "submitted",
        plagiarismRate: String(maxSimilarity),
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id));
    submissionId = existing.id;
  } else {
    const [inserted] = await db
      .insert(submissions)
      .values({
        questionId,
        studentId: user.userId,
        answer,
        notes,
        status: "submitted",
        plagiarismRate: String(maxSimilarity),
        submittedAt: new Date(),
      })
      .returning();
    submissionId = inserted.id;
  }

  // Trigger AI evaluation directly
  try {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (question?.evalPrompt) {
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, question.assignmentId),
      });

      if (assignment?.llmModelId) {
        const model = await db.query.llmModels.findFirst({
          where: eq(llmModels.id, assignment.llmModelId),
        });

        if (model) {
          const prompt = question.evalPrompt.replace(
            /\{学生答案\}/g,
            answer
          );

          const result = await evaluateAnswer(
            {
              modelName: model.modelName,
              baseUrl: model.baseUrl,
              apiKey: model.apiKey,
            },
            prompt
          );

          // Save evaluation
          await db.insert(evaluations).values({
            submissionId,
            score: result.score,
            evaluation: result.evaluation,
            suggestion: result.suggestion,
          });
        }
      }
    }
  } catch (error) {
    console.error("AI evaluation error during submission:", error);
    // Don't fail the submission if evaluation fails
  }

  revalidatePath("/student");
  return { success: true };
}

export async function getSubmission(questionId: string) {
  const user = await getAuthUser();
  if (!user) return null;

  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.questionId, questionId),
      eq(submissions.studentId, user.userId)
    ),
    with: {
      evaluations: true,
    },
  });

  return submission;
}

export async function getSubmissionsForQuestion(questionId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.submissions.findMany({
    where: eq(submissions.questionId, questionId),
    with: {
      student: {
        with: {
          studentProfile: true,
        },
      },
      evaluations: true,
    },
    orderBy: (s, { desc }) => [desc(s.submittedAt)],
  });
}

export async function getStudentSubmissions(studentId: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.submissions.findMany({
    where: and(
      eq(submissions.studentId, studentId),
      eq(submissions.status, "submitted" as const)
    ),
    with: {
      question: {
        with: {
          assignment: true,
        },
      },
      evaluations: true,
    },
    orderBy: (s, { desc }) => [desc(s.submittedAt)],
  });
}

export async function updateEvaluationScore(
  evaluationId: string,
  score: number
) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  if (score < 0 || score > 100) {
    return { error: "分数必须在 0-100 之间" };
  }

  await db
    .update(evaluations)
    .set({ score })
    .where(eq(evaluations.id, evaluationId));

  revalidatePath("/teacher");
  return { success: true };
}
