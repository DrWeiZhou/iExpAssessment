"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCourse, updateCourse } from "@/actions/courses";

interface CourseData {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  studentCount: number | null;
  classComposition: string | null;
}

export function CourseForm({
  course,
  courseId,
  children,
}: {
  course?: CourseData;
  courseId?: string;
  children: React.ReactNode;
}) {
  const isEdit = !!course && !!courseId;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(course?.name ?? "");
  const [academicYear, setAcademicYear] = useState(course?.academicYear ?? "");
  const [semester, setSemester] = useState(course?.semester ?? "第一学期");
  const [studentCount, setStudentCount] = useState(
    course?.studentCount?.toString() ?? ""
  );
  const [classComposition, setClassComposition] = useState(
    course?.classComposition ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    if (!isEdit) {
      setName("");
      setAcademicYear("");
      setSemester("第一学期");
      setStudentCount("");
      setClassComposition("");
    }
    setError(null);
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    setOpen(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !academicYear.trim() || !semester) {
      setError("课程名称、学年、学期为必填项");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("academicYear", academicYear);
      formData.append("semester", semester);
      formData.append("studentCount", studentCount);
      formData.append("classComposition", classComposition);

      let result;
      if (isEdit) {
        result = await updateCourse(courseId!, formData);
      } else {
        result = await createCourse(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        resetForm();
      }
    } catch {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<div />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑课程" : "新建课程"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-name">课程名称</Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入课程名称"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-academicYear">学年</Label>
            <Input
              id="course-academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="如: 2025-2026"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>学期</Label>
            <Select value={semester} onValueChange={(v) => v && setSemester(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择学期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="第一学期">第一学期</SelectItem>
                <SelectItem value="第二学期">第二学期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-studentCount">人数</Label>
            <Input
              id="course-studentCount"
              type="number"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              placeholder="选填"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-classComposition">教学班组成</Label>
            <Textarea
              id="course-classComposition"
              value={classComposition}
              onChange={(e) => setClassComposition(e.target.value)}
              placeholder="选填"
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              取消
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
