"use client";

import { useState } from "react";
import { removeStudentFromClass } from "@/actions/classes";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface RemoveStudentButtonProps {
  classId: string;
  studentId: string;
  studentName: string;
}

export function RemoveStudentButton({
  classId,
  studentId,
  studentName,
}: RemoveStudentButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    if (!confirm(`确定要将 ${studentName} 从班级中移除吗？`)) return;
    setIsRemoving(true);
    try {
      await removeStudentFromClass(classId, studentId);
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={isRemoving}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="size-4 mr-1" />
      移除
    </Button>
  );
}
