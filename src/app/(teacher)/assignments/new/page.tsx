import Link from "next/link";
import { AssignmentForm } from "@/components/teacher/assignment-form";

export default function NewAssignmentPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/teacher/assignments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; 返回作业列表
        </Link>
      </div>
      <AssignmentFormWrapper />
    </div>
  );
}

function AssignmentFormWrapper() {
  return <NewAssignmentFormClient />;
}

import { NewAssignmentFormClient } from "./new-assignment-form-client";
