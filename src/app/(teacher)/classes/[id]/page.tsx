import Link from "next/link";
import { getClass, removeStudentFromClass } from "@/actions/classes";
import { ExcelUpload } from "@/components/teacher/excel-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { RemoveStudentButton } from "./remove-student-button";

export const dynamic = 'force-dynamic';

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classData = await getClass(id);

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">班级不存在</p>
        <Link href="/teacher/courses" className="mt-4">
          <Button variant="outline">返回课程列表</Button>
        </Link>
      </div>
    );
  }

  const students = classData.classStudents.map((cs) => {
    const profile = cs.student.studentProfile;
    return {
      id: cs.student.id,
      studentNo: profile.studentNo,
      name: profile.name,
      gender: profile.gender,
      college: profile.college,
      major: profile.major,
      isRetake: profile.isRetake,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/teacher/courses/${classData.courseId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">{classData.name}</h2>
          <p className="text-sm text-muted-foreground">
            {classData.course.name}
          </p>
        </div>
      </div>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle>导入学生</CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelUpload classId={id} />
        </CardContent>
      </Card>

      {/* Student Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>学生列表 ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>暂无学生</p>
              <p className="text-sm mt-1">通过 Excel 导入学生名单</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium">学号</th>
                    <th className="pb-3 pr-4 font-medium">姓名</th>
                    <th className="pb-3 pr-4 font-medium">性别</th>
                    <th className="pb-3 pr-4 font-medium">学院</th>
                    <th className="pb-3 pr-4 font-medium">专业</th>
                    <th className="pb-3 pr-4 font-medium">是否重修</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{student.studentNo}</td>
                      <td className="py-3 pr-4">{student.name}</td>
                      <td className="py-3 pr-4">{student.gender || "-"}</td>
                      <td className="py-3 pr-4">{student.college || "-"}</td>
                      <td className="py-3 pr-4">{student.major || "-"}</td>
                      <td className="py-3 pr-4">
                        {student.isRetake ? "是" : "否"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/teacher/students/${student.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="size-4 mr-1" />
                              查看成绩
                            </Button>
                          </Link>
                          <RemoveStudentButton
                            classId={id}
                            studentId={student.id}
                            studentName={student.name}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
