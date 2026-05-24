"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteQuestion } from "@/actions/assignments";
import { QuestionForm } from "@/components/teacher/question-form";

interface QuestionData {
  id: string;
  name: string;
  score: number;
  evalMethod: string | null;
  evalCriteria: string | null;
  referenceAnswer: string | null;
  notes: string | null;
  showFeedback: boolean;
  promptTemplateId: string | null;
  evalPrompt: string | null;
  sortOrder: number;
}

interface QuestionActionsProps {
  questionId: string;
  assignmentId: string;
  question: QuestionData;
}

export function QuestionActions({
  questionId,
  assignmentId,
  question,
}: QuestionActionsProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("确定要删除此题目吗？")) return;
    setLoading(true);
    const result = await deleteQuestion(questionId);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditForm(true)}
        >
          编辑
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="text-destructive hover:text-destructive"
        >
          {loading ? "删除中..." : "删除"}
        </Button>
      </div>

      <QuestionForm
        assignmentId={assignmentId}
        question={question}
        open={showEditForm}
        onOpenChange={setShowEditForm}
      />
    </>
  );
}
