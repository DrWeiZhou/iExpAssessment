import Link from "next/link";
import { getStudentAssignments } from "@/actions/student";
import { getAuthUser } from "@/lib/auth";
import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
  not_started: {
    label: "未开始",
    color: "bg-gray-100 text-gray-600",
    icon: AlertCircle,
  },
  in_progress: {
    label: "进行中",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  completed: {
    label: "已完成",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
} as const;

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const user = await getAuthUser();
  const assignments = await getStudentAssignments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-muted-foreground">
          {user ? `你好！查看你的作业进度。` : "请先登录。"}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">暂无可用作业</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const status = statusConfig[assignment.status];
            const StatusIcon = status.icon;
            const isOverdue =
              assignment.deadline && new Date() > new Date(assignment.deadline);

            return (
              <Link
                key={assignment.id}
                href={`/student/assignments/${assignment.id}`}
                className="group rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold group-hover:text-primary">
                    {assignment.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                {assignment.courseName && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {assignment.courseName}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className={isOverdue ? "text-red-500" : "text-muted-foreground"}>
                    <Clock className="mr-1 inline h-3 w-3" />
                    {assignment.deadline
                      ? new Date(assignment.deadline).toLocaleDateString("zh-CN")
                      : "无截止时间"}
                  </span>
                  <span className="text-muted-foreground">
                    {assignment.submittedCount}/{assignment.totalQuestions} 题
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
