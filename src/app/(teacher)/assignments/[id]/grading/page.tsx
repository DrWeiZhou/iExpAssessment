import { notFound } from "next/navigation";
import { getAssignment } from "@/actions/assignments";
import { getSubmissionsForQuestion } from "@/actions/submissions";
import { GradingClient } from "./grading-client";

export const dynamic = 'force-dynamic';

export default async function GradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignment = await getAssignment(id);

  if (!assignment) {
    notFound();
  }

  // Fetch submissions for each question in parallel
  const questionSubmissions: Record<
    string,
    Awaited<ReturnType<typeof getSubmissionsForQuestion>>
  > = {};

  await Promise.all(
    assignment.questions.map(async (question) => {
      questionSubmissions[question.id] =
        await getSubmissionsForQuestion(question.id);
    })
  );

  const questions = assignment.questions.map((q) => ({
    id: q.id,
    name: q.name,
    score: q.score,
  }));

  return (
    <GradingClient
      assignmentId={id}
      assignmentName={assignment.name}
      questions={questions}
      questionSubmissions={questionSubmissions}
    />
  );
}
