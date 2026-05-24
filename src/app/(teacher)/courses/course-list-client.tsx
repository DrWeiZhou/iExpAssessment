"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CourseForm } from "@/components/teacher/course-form";
import { deleteCourse } from "@/actions/courses";
import { Pencil, Trash2, Eye } from "lucide-react";

interface Course {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  studentCount: number | null;
  classComposition: string | null;
  createdAt: Date;
}

export function CourseListClient({ courses }: { courses: Course[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定要删除该课程吗？")) return;
    await deleteCourse(id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">课程管理</h2>
        <CourseForm>
          <Button>新建课程</Button>
        </CourseForm>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
          <p className="text-lg">暂无课程</p>
          <p className="text-sm mt-1">点击「新建课程」按钮添加第一门课程</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>课程名称</TableHead>
              <TableHead>学年</TableHead>
              <TableHead>学期</TableHead>
              <TableHead>人数</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.name}</TableCell>
                <TableCell>{course.academicYear}</TableCell>
                <TableCell>{course.semester}</TableCell>
                <TableCell>{course.studentCount ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <a href={`/teacher/courses/${course.id}`}>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="size-4" />
                      </Button>
                    </a>
                    <CourseForm
                      course={course}
                      courseId={course.id}
                    >
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                      </Button>
                    </CourseForm>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
