"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { QuestionForm } from "@/components/teacher/question-form";

interface QuestionAddButtonProps {
  assignmentId: string;
}

export function QuestionAddButton({ assignmentId }: QuestionAddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4 mr-1" />
        添加题目
      </Button>
      <QuestionForm
        assignmentId={assignmentId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
