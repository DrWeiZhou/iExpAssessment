import Link from "next/link";
import { getStudentAssignment } from "@/actions/student";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  Save,
  Circle,
} from "lucide-react";

const submissionStatusConfig = {
  "未答": { color: "text-gray-400", icon: Circle, label: "未答" },
  "暂存": { color: "text-blue-500", icon: Save, label: "暂存" },
  "已提交": { color: "text-green-600", icon: CheckCircle, label: "已提交" },
} as const;

export const dynamic = 'force-dynamic';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStudentAssignment(id);

  if (!data) {
    notFound();
  }

  const isOverdue = data.isPastDeadline;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回作业列表
      </Link>

      {/* Assignment header */}
      <div>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.courseName && <span>课程：{data.courseName}</span>}
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            截止时间：
            {new Date(data.deadline).toLocaleString("zh-CN")}
            {isOverdue && " (已截止)"}
          </span>
        </div>
        {data.description && (
          <p className="mt-3 text-sm text-muted-foreground">
            {data.description}
          </p>
        )}
      </div>

      {/* Questions list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">题目列表</h2>
        <div className="space-y-3">
          {data.questions.map((q, index) => {
            const status = submissionStatusConfig[q.submissionStatus];
            const StatusIcon = status.icon;
            const canAnswer =
              !isOverdue || q.submissionStatus === "已提交";

            return (
              <div
                key={q.id}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {index + 1}. {q.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({q.score} 分)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${status.color}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {status.label}
                    </span>

                    {q.submissionStatus !== "已提交" && !isOverdue && (
                      <Link
                        href={`/student/questions/${q.id}`}
                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        {q.submissionStatus === "暂存" ? "继续作答" : "开始作答"}
                      </Link>
                    )}

                    {q.submissionStatus === "已提交" && !isOverdue && (
                      <span className="text-sm text-muted-foreground">
                        已提交
                      </span>
                    )}
                  </div>
                </div>

                {/* Show evaluation results if available */}
                {q.evaluation && (
                  <div className="mt-3 rounded-md bg-green-50 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      批改结果
                    </div>
                    <div className="mt-2 space-y-1 text-green-700">
                      {q.evaluation.score !== null && (
                        <p>
                          得分：
                          <span className="font-semibold">
                            {q.evaluation.score}/{q.score}
                          </span>
                        </p>
                      )}
                      {q.evaluation.evaluation && (
                        <p>评价：{q.evaluation.evaluation}</p>
                      )}
                      {q.evaluation.suggestion && (
                        <p>建议：{q.evaluation.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {data.questions.length === 0 && (
          <p className="text-center text-muted-foreground">
            暂无题目
          </p>
        )}
      </div>
    </div>
  );
}
