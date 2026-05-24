"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createPromptTemplate, updatePromptTemplate } from "@/actions/settings";

const PLACEHOLDERS = [
  "{题目名称}",
  "{题目分值}",
  "{评价方式}",
  "{参考答案}",
  "{学生答案}",
  "{备注}",
];

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isSystem: boolean;
}

export function PromptTemplateForm({
  template,
  open,
  onOpenChange,
}: {
  template?: PromptTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!template;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !content.trim()) {
      setError("名称和内容为必填项");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("content", content);

      let result;
      if (isEdit) {
        result = await updatePromptTemplate(template.id, formData);
      } else {
        result = await createPromptTemplate(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        setName("");
        setContent("");
      }
    } catch {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleInsertPlaceholder(placeholder: string) {
    setContent((prev) => prev + placeholder);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setError(null);
      // Reset form when closing
      if (!isEdit) {
        setName("");
        setContent("");
      }
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "编辑模板" : "添加模板"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">模板名称</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入模板名称"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-content">模板内容</Label>
            <Textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入模板内容，可使用下方占位符"
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground leading-6">
                可用占位符：
              </span>
              {PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => handleInsertPlaceholder(ph)}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  {ph}
                </button>
              ))}
            </div>
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
