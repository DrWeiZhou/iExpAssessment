"use client";

import { useState } from "react";
import { updateEvaluationScore } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ScoreEditor({
  evaluationId,
  initialScore,
}: {
  evaluationId: string;
  initialScore: number;
}) {
  const [score, setScore] = useState(initialScore);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateEvaluationScore(evaluationId, Math.min(100, Math.max(0, score)));
    setEditing(false);
    setSaving(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-medium text-blue-600 hover:underline cursor-pointer"
      >
        {score} 分
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="number" min={0} max={100} value={score}
        onChange={(e) => setScore(Number(e.target.value))} className="w-20" />
      <Button size="sm" onClick={handleSave} disabled={saving}>保存</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>取消</Button>
    </div>
  );
}
