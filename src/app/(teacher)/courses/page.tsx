import { getCourses } from "@/actions/courses";
import { CourseListClient } from "./course-list-client";

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CourseListClient courses={courses} />;
}
