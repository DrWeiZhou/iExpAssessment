import Link from "next/link";
import { getAssignments } from "@/actions/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";
import { AssignmentListActions } from "./assignment-list-actions";

export default async function AssignmentsPage() {
  const assignments = await getAssignments();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">作业管理</h2>
        <Link href="/teacher/assignments/new">
          <Button>
            <PlusIcon className="size-4 mr-1" />
            新建作业
          </Button>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无作业，点击上方按钮创建第一个作业
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>作业名称</TableHead>
                <TableHead>所属课程</TableHead>
                <TableHead>截止时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/teacher/assignments/${assignment.id}`}
                      className="hover:underline"
                    >
                      {assignment.name}
                    </Link>
                  </TableCell>
                  <TableCell>{assignment.courseName}</TableCell>
                  <TableCell>
                    {new Date(assignment.deadline).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    {assignment.isPublished ? (
                      <Badge variant="default">已发布</Badge>
                    ) : (
                      <Badge variant="secondary">未发布</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AssignmentListActions
                      assignmentId={assignment.id}
                      isPublished={assignment.isPublished}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
