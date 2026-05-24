import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { getStudentSubmissions } from "@/actions/submissions";
import { StudentDetailClient } from "./student-detail-client";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    notFound();
  }

  // Get student profile
  const student = await db
    .select({
      id: users.id,
      studentNo: studentProfiles.studentNo,
      name: studentProfiles.name,
      college: studentProfiles.college,
      major: studentProfiles.major,
      grade: studentProfiles.grade,
      className: studentProfiles.className,
    })
    .from(users)
    .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(eq(users.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!student) {
    notFound();
  }

  // Get all submissions for this student
  const submissions = await getStudentSubmissions(id);

  const studentInfo = {
    id: student.id,
    studentNo: student.studentNo,
    name: student.name,
    college: student.college,
    major: student.major,
    grade: student.grade,
    className: student.className,
  };

  return (
    <StudentDetailClient student={studentInfo} submissions={submissions} />
  );
}
