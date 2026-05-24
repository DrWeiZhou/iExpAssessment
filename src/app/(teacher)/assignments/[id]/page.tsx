import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssignment } from "@/actions/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftIcon } from "lucide-react";
import { AssignmentDetailActions } from "./assignment-detail-actions";
import { QuestionActions } from "./question-actions";
import { QuestionAddButton } from "./question-add-button";

export const dynamic = 'force-dynamic';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignment = await getAssignment(id);

  if (!assignment) {
    notFound();
  }

  const totalScore = assignment.questions.reduce(
    (sum, q) => sum + q.score,
    0
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/teacher/assignments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4 inline mr-1" />
          返回作业列表
        </Link>
      </div>

      {/* Assignment Info Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{assignment.name}</CardTitle>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span>课程: {assignment.courseName}</span>
              <span>
                截止时间:{" "}
                {new Date(assignment.deadline).toLocaleString("zh-CN")}
              </span>
              <span>总分: {totalScore}</span>
              <span>题目数: {assignment.questions.length}</span>
              {assignment.classes.length > 0 && (
                <span>
                  班级: {assignment.classes.map((c) => c.name).join(", ")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assignment.isPublished ? (
              <Badge variant="default">已发布</Badge>
            ) : (
              <Badge variant="secondary">未发布</Badge>
            )}
            {!assignment.isPublished && (
              <AssignmentDetailActions assignmentId={id} />
            )}
          </div>
        </CardHeader>
        {assignment.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Questions Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">题目列表</h3>
        {!assignment.isPublished && (
          <QuestionAddButton assignmentId={id} />
        )}
      </div>



      {assignment.questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
          暂无题目，点击上方按钮添加题目
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>题目名称</TableHead>
                <TableHead>分值</TableHead>
                <TableHead>评价方式</TableHead>
                <TableHead>提示词模板</TableHead>
                <TableHead>反馈给学生</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignment.questions.map((question, index) => (
                <TableRow key={question.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{question.name}</TableCell>
                  <TableCell>{question.score}</TableCell>
                  <TableCell className="max-w-48 truncate">
                    {question.evalMethod || "-"}
                  </TableCell>
                  <TableCell>
                    {question.promptTemplateId ? "已配置" : "-"}
                  </TableCell>
                  <TableCell>
                    {question.showFeedback ? "是" : "否"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!assignment.isPublished && (
                      <QuestionActions
                        questionId={question.id}
                        assignmentId={id}
                        question={question}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Link to grading for published assignments */}
      {assignment.isPublished && (
        <div className="mt-6">
          <Link href={`/teacher/assignments/${id}/grading`}>
            <Button variant="outline">查看批改结果</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
