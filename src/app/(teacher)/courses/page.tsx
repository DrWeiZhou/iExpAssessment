import { getCourses } from "@/actions/courses";
import { CourseListClient } from "./course-list-client";

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CourseListClient courses={courses} />;
}
