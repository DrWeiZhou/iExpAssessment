import Link from "next/link";
import { getStudentAssignments } from "@/actions/student";
import { Clock, CheckCircle, AlertCircle, ClipboardList } from "lucide-react";

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

export default async function StudentAssignmentsPage() {
  const assignments = await getStudentAssignments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">我的作业</h1>
        <p className="text-muted-foreground">
          查看所有已发布的作业列表
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">暂无可用作业</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  作业名称
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  课程
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  截止时间
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  进度
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((assignment) => {
                const status = statusConfig[assignment.status];
                const StatusIcon = status.icon;
                const isOverdue =
                  assignment.deadline &&
                  new Date() > new Date(assignment.deadline);

                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/student/assignments/${assignment.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {assignment.name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {assignment.courseName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={isOverdue ? "text-red-500" : "text-muted-foreground"}>
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleDateString("zh-CN")
                          : "无截止时间"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {assignment.submittedCount}/{assignment.totalQuestions}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
