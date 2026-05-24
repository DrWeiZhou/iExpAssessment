import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, assignments, llmModels } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const user = await getAuthUser();

  if (!user || user.role !== "teacher") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  // Step 1: Get teacher's courses (need their IDs for assignment queries)
  const teacherCourses = await db.query.courses.findMany({
    where: eq(courses.teacherId, user.userId),
    columns: { id: true },
  });
  const courseIds = teacherCourses.map((c) => c.id);

  // Step 2: Fetch all stats in parallel
  const [courseCount, publishedAssignments, teacherModels, recentAssignments] =
    await Promise.all([
      // Course count
      Promise.resolve(teacherCourses.length),

      // Published assignment count (only if teacher has courses)
      courseIds.length > 0
        ? db.query.assignments.findMany({
            where: and(
              eq(assignments.isPublished, true),
              inArray(assignments.courseId, courseIds)
            ),
            columns: { id: true },
          })
        : Promise.resolve([]),

      // LLM model count
      db.query.llmModels.findMany({
        where: eq(llmModels.teacherId, user.userId),
        columns: { id: true },
      }),

      // Recent assignments with course info
      courseIds.length > 0
        ? db.query.assignments.findMany({
            where: inArray(assignments.courseId, courseIds),
            orderBy: desc(assignments.createdAt),
            limit: 5,
            with: {
              course: {
                columns: {
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

  const publishedCount = publishedAssignments.length;
  const modelCount = teacherModels.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">教师仪表盘</h1>
        <p className="text-muted-foreground mt-1">
          欢迎回来，以下是您的教学数据概览
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              课程数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courseCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已发布作业
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              LLM 模型
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{modelCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/courses" className="group">
            <Card className="transition-shadow hover:shadow-md h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-lg font-semibold">
                    C
                  </span>
                  课程管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  创建和管理课程，分配班级和学生
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/assignments" className="group">
            <Card className="transition-shadow hover:shadow-md h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 text-lg font-semibold">
                    A
                  </span>
                  作业管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  创建作业、设置题目、发布和批改
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings" className="group">
            <Card className="transition-shadow hover:shadow-md h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 text-lg font-semibold">
                    S
                  </span>
                  系统设置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  管理 LLM 模型、评价模板和系统参数
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-4">最近作业</h2>
        {recentAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              暂无作业，点击上方&quot;作业管理&quot;创建新作业
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium">作业名称</th>
                      <th className="text-left py-3 px-4 font-medium">所属课程</th>
                      <th className="text-left py-3 px-4 font-medium">截止时间</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAssignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <Link
                            href={`/assignments/${assignment.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {assignment.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {assignment.course.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(assignment.deadline).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3 px-4">
                          {assignment.isPublished ? (
                            <Badge variant="default">已发布</Badge>
                          ) : (
                            <Badge variant="secondary">草稿</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
