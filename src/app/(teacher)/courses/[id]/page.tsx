import Link from "next/link";
import { getCourse } from "@/actions/courses";
import { CourseDetailClient } from "./course-detail-client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">课程不存在</p>
        <Link href="/teacher/courses" className="mt-4">
          <Button variant="outline">返回课程列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-semibold">{course.name}</h2>
      </div>

      <CourseDetailClient course={course} />
    </div>
  );
}
