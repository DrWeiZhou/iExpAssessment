"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createModel, updateModel } from "@/actions/models";

interface ModelData {
  id: string;
  displayName: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
}

export function ModelForm({
  model,
  open,
  onOpenChange,
}: {
  model?: ModelData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!model;

  const [displayName, setDisplayName] = useState(model?.displayName ?? "");
  const [modelName, setModelName] = useState(model?.modelName ?? "");
  const [baseUrl, setBaseUrl] = useState(model?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(model?.apiKey ?? "");
  const [isDefault, setIsDefault] = useState(model?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !modelName.trim() || !baseUrl.trim()) {
      setError("显示名称、模型名称和 Base URL 为必填项");
      return;
    }

    if (!isEdit && !apiKey.trim()) {
      setError("API Key 为必填项");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("displayName", displayName);
      formData.append("modelName", modelName);
      formData.append("baseUrl", baseUrl);
      formData.append("apiKey", apiKey);
      formData.append("isDefault", isDefault ? "on" : "off");

      let result;
      if (isEdit) {
        result = await updateModel(model.id, formData);
      } else {
        result = await createModel(formData);
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
      setDisplayName("");
      setModelName("");
      setBaseUrl("");
      setApiKey("");
      setIsDefault(false);
    }
    setError(null);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      resetForm();
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑模型" : "添加模型"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">显示名称</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="如: GPT-4, DeepSeek"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="modelName">模型名称</Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="如: gpt-4, deepseek-chat"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="如: https://api.openai.com/v1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEdit ? "留空则不修改" : "请输入 API Key"}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <span className="text-sm">设为默认模型</span>
          </label>

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
