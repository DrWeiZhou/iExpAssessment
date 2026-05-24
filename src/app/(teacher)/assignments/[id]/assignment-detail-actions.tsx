"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishAssignment } from "@/actions/assignments";
import { useState } from "react";

interface AssignmentDetailActionsProps {
  assignmentId: string;
}

export function AssignmentDetailActions({
  assignmentId,
}: AssignmentDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!confirm("确定要发布此作业吗？发布后将无法编辑和删除。")) return;
    setLoading(true);
    const result = await publishAssignment(assignmentId);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  return (
    <Button onClick={handlePublish} disabled={loading}>
      {loading ? "发布中..." : "发布作业"}
    </Button>
  );
}
