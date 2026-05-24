import * as XLSX from "xlsx";

export interface StudentRow {
  studentNo: string;
  name: string;
  gender?: string;
  college?: string;
  grade?: string;
  major?: string;
  className?: string;
  phone?: string;
  email?: string;
  isRetake?: boolean;
}

export function parseStudentExcel(buffer: ArrayBuffer): {
  students: StudentRow[];
  errors: string[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  const students: StudentRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const studentNo = row["学号"]?.trim();
    const name = row["姓名"]?.trim();

    if (!studentNo || !name) {
      errors.push(`第 ${i + 2} 行：学号和姓名为必填项`);
      continue;
    }

    students.push({
      studentNo,
      name,
      gender: row["性别"]?.trim(),
      college: row["学院"]?.trim(),
      grade: row["年级"]?.trim(),
      major: row["专业"]?.trim(),
      className: row["班级"]?.trim(),
      phone: row["手机号码"]?.trim(),
      email: row["电子邮箱"]?.trim(),
      isRetake: row["是否重修"]?.trim() === "是",
    });
  }

  return { students, errors };
}
