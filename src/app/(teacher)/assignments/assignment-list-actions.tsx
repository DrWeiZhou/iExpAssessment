"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAssignment, publishAssignment } from "@/actions/assignments";
import { useState } from "react";
import Link from "next/link";

interface AssignmentListActionsProps {
  assignmentId: string;
  isPublished: boolean;
}

export function AssignmentListActions({
  assignmentId,
  isPublished,
}: AssignmentListActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("确定要删除此作业吗？此操作不可恢复。")) return;
    setLoading("delete");
    const result = await deleteAssignment(assignmentId);
    setLoading(null);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  async function handlePublish() {
    if (!confirm("确定要发布此作业吗？发布后将无法编辑和删除。")) return;
    setLoading("publish");
    const result = await publishAssignment(assignmentId);
    setLoading(null);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  if (isPublished) {
    return (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/teacher/assignments/${assignmentId}/grading`}>
          <Button variant="outline" size="sm">
            批改查看
          </Button>
        </Link>
        <Link href={`/teacher/assignments/${assignmentId}`}>
          <Button variant="outline" size="sm">
            查看详情
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/teacher/assignments/${assignmentId}`}>
        <Button variant="outline" size="sm">
          编辑
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePublish}
        disabled={loading === "publish"}
      >
        {loading === "publish" ? "发布中..." : "发布"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={loading === "delete"}
        className="text-destructive hover:text-destructive"
      >
        {loading === "delete" ? "删除中..." : "删除"}
      </Button>
    </div>
  );
}
