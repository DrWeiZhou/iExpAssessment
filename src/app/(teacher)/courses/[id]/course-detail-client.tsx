"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassForm } from "@/components/teacher/class-form";
import { Pencil, Users } from "lucide-react";
import { CourseForm } from "@/components/teacher/course-form";
import Link from "next/link";

interface ClassItem {
  id: string;
  name: string;
  createdAt: Date;
}

interface Course {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  studentCount: number | null;
  classComposition: string | null;
  classes: ClassItem[];
}

export function CourseDetailClient({ course }: { course: Course }) {
  return (
    <>
      {/* Course Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>课程信息</CardTitle>
            <CourseForm course={course} courseId={course.id}>
              <Button variant="outline" size="sm">
                <Pencil className="size-4 mr-1" />
                编辑
              </Button>
            </CourseForm>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">课程名称</p>
              <p className="font-medium">{course.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">学年</p>
              <p className="font-medium">{course.academicYear}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">学期</p>
              <p className="font-medium">{course.semester}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">人数</p>
              <p className="font-medium">{course.studentCount ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">教学班组成</p>
              <p className="font-medium">{course.classComposition || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>班级列表</CardTitle>
            <ClassForm courseId={course.id}>
              <Button size="sm">添加班级</Button>
            </ClassForm>
          </div>
        </CardHeader>
        <CardContent>
          {course.classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>暂无班级</p>
              <p className="text-sm mt-1">点击「添加班级」按钮创建班级</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {course.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="font-medium">{cls.name}</span>
                  <Link href={`/teacher/classes/${cls.id}`}>
                    <Button variant="ghost" size="sm">
                      <Users className="size-4 mr-1" />
                      管理学生
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
