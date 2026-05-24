"use client";

import { useState } from "react";
import { saveDraft, submitAnswer } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Send, AlertCircle, CheckCircle } from "lucide-react";

interface AnswerFormProps {
  questionId: string;
  questionName: string;
  questionScore: number;
  initialAnswer?: string | null;
  initialNotes?: string | null;
  isSubmitted: boolean;
  isPastDeadline: boolean;
  evaluation?: {
    score: number | null;
    evaluation: string | null;
    suggestion: string | null;
  } | null;
}

export function AnswerForm({
  questionId,
  questionName,
  questionScore,
  initialAnswer,
  initialNotes,
  isSubmitted,
  isPastDeadline,
  evaluation,
}: AnswerFormProps) {
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const readOnly = isSubmitted || isPastDeadline;

  async function handleSaveDraft() {
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await saveDraft(questionId, answer, notes);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "暂存成功" });
      }
    } catch {
      setMessage({ type: "error", text: "暂存失败，请重试" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) {
      setMessage({ type: "error", text: "答案不能为空" });
      return;
    }
    setShowConfirm(false);
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await submitAnswer(questionId, answer, notes);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "提交成功" });
        // Reload to reflect submitted state
        window.location.reload();
      }
    } catch {
      setMessage({ type: "error", text: "提交失败，请重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Question info */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{questionName}</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {questionScore} 分
          </span>
        </div>
      </div>

      {/* Evaluation results (read-only view) */}
      {isSubmitted && evaluation && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle className="h-5 w-5" />
            批改结果
          </h3>
          <div className="space-y-2 text-sm text-green-700">
            {evaluation.score !== null && (
              <p>
                得分：
                <span className="text-lg font-bold text-green-800">
                  {evaluation.score}
                </span>
                / {questionScore}
              </p>
            )}
            {evaluation.evaluation && (
              <div>
                <span className="font-medium">评价：</span>
                {evaluation.evaluation}
              </div>
            )}
            {evaluation.suggestion && (
              <div>
                <span className="font-medium">建议：</span>
                {evaluation.suggestion}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submitted notice */}
      {isSubmitted && !evaluation && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          已提交，等待批改结果。
        </div>
      )}

      {/* Answer form */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">答案</label>
              <span className="text-xs text-muted-foreground">
                {answer.length}/10000
              </span>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => {
                if (e.target.value.length <= 10000) {
                  setAnswer(e.target.value);
                }
              }}
              disabled={readOnly}
              placeholder={readOnly ? "" : "请输入你的答案..."}
              rows={8}
              className="resize-y"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">备注</label>
              <span className="text-xs text-muted-foreground">
                {notes.length}/1000
              </span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setNotes(e.target.value);
                }
              }}
              disabled={readOnly}
              placeholder={readOnly ? "" : "可选备注..."}
              rows={3}
              className="resize-y"
            />
          </div>

          {/* Action buttons */}
          {!readOnly && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "保存中..." : "暂存"}
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={isSaving || isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "提交中..." : "提交"}
              </Button>
            </div>
          )}

          {/* Read-only indicator */}
          {readOnly && (
            <p className="text-sm text-muted-foreground">
              {isSubmitted
                ? "已提交，无法修改"
                : "已过截止时间，无法提交"}
            </p>
          )}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">确认提交</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              提交后无法修改，是否确认提交？
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                确认提交
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
