"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuestion,
  updateQuestion,
} from "@/actions/assignments";
import { getPromptTemplates } from "@/actions/settings";

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

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
}

interface QuestionFormProps {
  assignmentId: string;
  question?: QuestionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionForm({
  assignmentId,
  question,
  open,
  onOpenChange,
}: QuestionFormProps) {
  const isEdit = !!question;

  const [name, setName] = useState(question?.name ?? "");
  const [score, setScore] = useState(question?.score?.toString() ?? "");
  const [evalMethod, setEvalMethod] = useState(question?.evalMethod ?? "");
  const [evalCriteria, setEvalCriteria] = useState(
    question?.evalCriteria ?? ""
  );
  const [referenceAnswer, setReferenceAnswer] = useState(
    question?.referenceAnswer ?? ""
  );
  const [notes, setNotes] = useState(question?.notes ?? "");
  const [showFeedback, setShowFeedback] = useState(
    question?.showFeedback ?? true
  );
  const [promptTemplateId, setPromptTemplateId] = useState(
    question?.promptTemplateId ?? ""
  );
  const [evalPrompt, setEvalPrompt] = useState(question?.evalPrompt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  // Find the currently selected template
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === promptTemplateId),
    [templates, promptTemplateId]
  );

  // Fetch templates on mount
  useEffect(() => {
    async function loadTemplates() {
      const data = await getPromptTemplates();
      setTemplates(data as PromptTemplate[]);
    }
    loadTemplates();
  }, []);

  // Auto-fill evalPrompt from template when template changes
  useEffect(() => {
    if (selectedTemplate && !manualEdit) {
      let content = selectedTemplate.content;
      content = content.replace(/\{题目名称\}/g, name || "{题目名称}");
      content = content.replace(
        /\{题目分值\}/g,
        score || "{题目分值}"
      );
      content = content.replace(
        /\{评价方式\}/g,
        evalMethod || "{评价方式}"
      );
      content = content.replace(
        /\{参考答案\}/g,
        referenceAnswer || "{参考答案}"
      );
      content = content.replace(/\{备注\}/g, notes || "{备注}");
      setEvalPrompt(content);
    }
  }, [selectedTemplate, name, score, evalMethod, referenceAnswer, notes, manualEdit]);

  // Mark as manual edit when user directly modifies evalPrompt
  function handleEvalPromptChange(value: string) {
    setManualEdit(true);
    setEvalPrompt(value);
  }

  // When template is selected, reset manual edit flag
  function handleTemplateChange(value: string | null) {
    setManualEdit(false);
    setPromptTemplateId(value ?? "");
    // Immediately apply template content
    const tmpl = templates.find((t) => t.id === value);
    if (tmpl) {
      let content = tmpl.content;
      content = content.replace(/\{题目名称\}/g, name || "{题目名称}");
      content = content.replace(/\{题目分值\}/g, score || "{题目分值}");
      content = content.replace(/\{评价方式\}/g, evalMethod || "{评价方式}");
      content = content.replace(/\{参考答案\}/g, referenceAnswer || "{参考答案}");
      content = content.replace(/\{备注\}/g, notes || "{备注}");
      setEvalPrompt(content);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("题目名称为必填项");
      return;
    }
    const scoreNum = parseInt(score, 10);
    if (!score || isNaN(scoreNum) || scoreNum < 1 || scoreNum > 100) {
      setError("题目分值必须为 1-100 的整数");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("score", score);
      formData.append("evalMethod", evalMethod);
      formData.append("evalCriteria", evalCriteria);
      formData.append("referenceAnswer", referenceAnswer);
      formData.append("notes", notes);
      formData.append("showFeedback", showFeedback ? "on" : "off");
      formData.append("promptTemplateId", promptTemplateId);
      formData.append("evalPrompt", evalPrompt);

      let result;
      if (isEdit && question) {
        result = await updateQuestion(question.id, formData);
      } else {
        result = await createQuestion(assignmentId, formData);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        resetForm();
      }
    } catch {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    if (!isEdit) {
      setName("");
      setScore("");
      setEvalMethod("");
      setEvalCriteria("");
      setReferenceAnswer("");
      setNotes("");
      setShowFeedback(true);
      setPromptTemplateId("");
      setEvalPrompt("");
    }
    setError(null);
    setManualEdit(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      resetForm();
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑题目" : "添加题目"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-name">题目名称</Label>
            <Input
              id="question-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入题目名称"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-score">题目分值</Label>
            <Input
              id="question-score"
              type="number"
              min={1}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="1-100"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-evalMethod">评价方式</Label>
            <Textarea
              id="question-evalMethod"
              value={evalMethod}
              onChange={(e) => setEvalMethod(e.target.value)}
              placeholder="请描述评价方式"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-evalCriteria">评价标准</Label>
            <Textarea
              id="question-evalCriteria"
              value={evalCriteria}
              onChange={(e) => setEvalCriteria(e.target.value)}
              placeholder="请描述评价标准"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-referenceAnswer">参考答案</Label>
            <Textarea
              id="question-referenceAnswer"
              value={referenceAnswer}
              onChange={(e) => setReferenceAnswer(e.target.value)}
              placeholder="请输入参考答案"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-notes">备注</Label>
            <Textarea
              id="question-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="请输入备注"
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showFeedback}
              onCheckedChange={(checked) => setShowFeedback(checked === true)}
            />
            <span className="text-sm">评价结果是否反馈给学生</span>
          </label>

          <div className="flex flex-col gap-2">
            <Label>评价提示词模板</Label>
            <Select
              value={promptTemplateId}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择提示词模板" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question-evalPrompt">评价提示词</Label>
            <Textarea
              id="question-evalPrompt"
              value={evalPrompt}
              onChange={(e) => handleEvalPromptChange(e.target.value)}
              placeholder="请输入评价提示词，或选择模板自动填充"
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              取消
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
