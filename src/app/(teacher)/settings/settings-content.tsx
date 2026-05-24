"use client";

import { useState, useTransition } from "react";
import { setSetting, deletePromptTemplate } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PromptTemplateForm } from "@/components/teacher/prompt-template-form";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  isSystem: boolean;
}

export function SettingsContent({
  threshold,
  templates,
}: {
  threshold: string | null;
  templates: Template[];
}) {
  const [thresholdValue, setThresholdValue] = useState(
    threshold ?? "0.99"
  );
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSaveThreshold() {
    const num = parseFloat(thresholdValue);
    if (isNaN(num) || num < 0 || num > 1) {
      setThresholdMessage({ type: "error", text: "阈值必须在 0 到 1 之间" });
      return;
    }

    setSavingThreshold(true);
    setThresholdMessage(null);

    const result = await setSetting("plagiarism_threshold", thresholdValue);

    if (result?.error) {
      setThresholdMessage({ type: "error", text: result.error });
    } else {
      setThresholdMessage({ type: "success", text: "保存成功" });
    }
    setSavingThreshold(false);
  }

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingTemplate(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePromptTemplate(id);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">系统设置</h2>

      {/* Section 1: Plagiarism Threshold */}
      <Card>
        <CardHeader>
          <CardTitle>查重阈值设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plagiarism-threshold">查重相似度阈值</Label>
                <Input
                  id="plagiarism-threshold"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                onClick={handleSaveThreshold}
                disabled={savingThreshold}
              >
                {savingThreshold ? "保存中..." : "保存"}
              </Button>
            </div>
            {thresholdMessage && (
              <p
                className={`text-sm ${
                  thresholdMessage.type === "success"
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {thresholdMessage.text}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              相似度超过此阈值（0-1）的答案将被标记为疑似抄袭。默认值为 0.99。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Prompt Templates */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>评价提示词模板</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
            添加模板
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无模板，点击上方按钮添加。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模板名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>
                      {template.isSystem ? (
                        <Badge variant="secondary">系统</Badge>
                      ) : (
                        <Badge variant="outline">自定义</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleEdit(template)}
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!template.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDelete(template.id)}
                            disabled={isPending}
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <PromptTemplateForm
        template={editingTemplate}
        open={dialogOpen}
        onOpenChange={(val) => {
          setDialogOpen(val);
          if (!val) setEditingTemplate(null);
        }}
      />
    </div>
  );
}
