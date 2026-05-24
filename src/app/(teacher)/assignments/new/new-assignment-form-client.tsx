"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/teacher/assignment-form";

export function NewAssignmentFormClient() {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      router.push("/teacher/assignments");
    }
  }

  return <AssignmentForm open={open} onOpenChange={handleOpenChange} />;
}
