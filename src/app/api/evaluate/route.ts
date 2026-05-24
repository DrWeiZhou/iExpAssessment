import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  submissions,
  questions,
  evaluations,
  llmModels,
  assignments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { evaluateAnswer } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json();

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });
    if (!submission) {
      return NextResponse.json({ error: "提交不存在" }, { status: 404 });
    }

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, submission.questionId),
    });
    if (!question?.evalPrompt) {
      return NextResponse.json(
        { error: "题目或评价提示词不存在" },
        { status: 400 }
      );
    }

    // Get the assignment's LLM model
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, question.assignmentId),
    });
    if (!assignment?.llmModelId) {
      return NextResponse.json(
        { error: "未配置批改模型" },
        { status: 400 }
      );
    }

    const model = await db.query.llmModels.findFirst({
      where: eq(llmModels.id, assignment.llmModelId),
    });
    if (!model) {
      return NextResponse.json({ error: "模型不存在" }, { status: 400 });
    }

    // Render prompt with student answer
    const prompt = question.evalPrompt.replace(
      /\{学生答案\}/g,
      submission.answer || ""
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
      submissionId: submission.id,
      score: result.score,
      evaluation: result.evaluation,
      suggestion: result.suggestion,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI evaluation error:", error);
    return NextResponse.json({ error: "AI 评价失败" }, { status: 500 });
  }
}
