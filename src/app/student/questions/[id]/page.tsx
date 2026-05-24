import Link from "next/link";
import { getStudentQuestion } from "@/actions/student";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnswerForm } from "@/components/student/answer-form";

export default async function QuestionAnswerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStudentQuestion(id);

  if (!data) {
    notFound();
  }

  const { question, assignment, submission, evaluation, isPastDeadline } = data;
  const isSubmitted = submission?.status === "submitted";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href={`/student/assignments/${assignment.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 {assignment.name}
      </Link>

      {/* Assignment info bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>作业：{assignment.name}</span>
        <span
          className={
            isPastDeadline ? "text-red-500 font-medium" : ""
          }
        >
          截止时间：
          {new Date(assignment.deadline).toLocaleString("zh-CN")}
          {isPastDeadline && " (已截止)"}
        </span>
      </div>

      {/* Answer form */}
      <AnswerForm
        questionId={question.id}
        questionName={question.name}
        questionScore={question.score}
        initialAnswer={submission?.answer}
        initialNotes={submission?.notes}
        isSubmitted={isSubmitted}
        isPastDeadline={isPastDeadline}
        evaluation={evaluation}
      />
    </div>
  );
}
