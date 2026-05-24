"use client";

import { useState, useTransition } from "react";
import { deleteModel } from "@/actions/models";
import { Button } from "@/components/ui/button";
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
import { ModelForm } from "@/components/teacher/model-form";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Model {
  id: string;
  displayName: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
  createdAt: Date;
}

export function ModelsContent({ models }: { models: Model[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditingModel(null);
    setDialogOpen(true);
  }

  function handleEdit(model: Model) {
    setEditingModel(model);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteModel(id);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">模型管理</h2>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>大语言模型</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
            添加模型
          </Button>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无模型，请添加一个大语言模型。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>显示名称</TableHead>
                  <TableHead>模型名称</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">
                      {model.displayName}
                    </TableCell>
                    <TableCell>{model.modelName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {model.baseUrl}
                    </TableCell>
                    <TableCell>
                      {model.isDefault ? (
                        <Badge>默认</Badge>
                      ) : (
                        <Badge variant="outline">普通</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleEdit(model)}
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(model.id)}
                          disabled={isPending}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Model Form Dialog */}
      <ModelForm
        model={editingModel}
        open={dialogOpen}
        onOpenChange={(val) => {
          setDialogOpen(val);
          if (!val) setEditingModel(null);
        }}
      />
    </div>
  );
}
