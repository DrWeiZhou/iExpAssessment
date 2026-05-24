"use client";

import { useState } from "react";
import { importStudents } from "@/actions/classes";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ExcelUploadProps {
  classId: string;
}

export function ExcelUpload({ classId }: ExcelUploadProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    parseErrors: string[];
    error?: string;
  } | null>(null);

  async function handleImport(formData: FormData) {
    setIsImporting(true);
    setResult(null);
    try {
      const res = await importStudents(classId, formData);
      setResult(res);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form action={handleImport} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="excel-file"
            className="block text-sm font-medium mb-1"
          >
            导入学生名单
          </label>
          <input
            id="excel-file"
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Excel 模板列：学号、姓名、性别、学院、年级、专业、班级、手机号码、电子邮箱、是否重修
          </p>
        </div>
        <Button type="submit" disabled={isImporting}>
          <Upload className="size-4 mr-1" />
          {isImporting ? "导入中..." : "导入学生"}
        </Button>
      </form>

      {result && (
        <div className="space-y-2">
          {result.error ? (
            <p className="text-sm text-destructive">{result.error}</p>
          ) : (
            <div className="text-sm space-y-1">
              <p className="text-green-600">
                成功导入 {result.imported} 名学生
              </p>
              {result.skipped > 0 && (
                <p className="text-yellow-600">
                  跳过 {result.skipped} 名已存在的学生
                </p>
              )}
            </div>
          )}
          {result.parseErrors.length > 0 && (
            <div className="text-sm text-destructive">
              <p className="font-medium">解析错误：</p>
              <ul className="list-disc list-inside">
                {result.parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
