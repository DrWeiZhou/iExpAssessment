"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAssignment,
  updateAssignment,
  getTeacherCourses,
  getCourseClasses,
} from "@/actions/assignments";
import { getModels } from "@/actions/models";
import type { getAssignments, getAssignment } from "@/actions/assignments";

type AssignmentListItem = Awaited<ReturnType<typeof getAssignments>>[number];
type AssignmentDetail = Awaited<ReturnType<typeof getAssignment>>;

interface AssignmentFormProps {
  assignment?: AssignmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CourseOption {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface ModelOption {
  id: string;
  displayName: string;
}

export function AssignmentForm({
  assignment,
  open,
  onOpenChange,
}: AssignmentFormProps) {
  const isEdit = !!assignment;

  const [name, setName] = useState(assignment?.name ?? "");
  const [courseId, setCourseId] = useState(assignment?.courseId ?? "");
  const [description, setDescription] = useState(assignment?.description ?? "");
  const [deadline, setDeadline] = useState("");
  const [llmModelId, setLlmModelId] = useState(
    assignment?.llmModelId ?? ""
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseClasses, setCourseClasses] = useState<ClassOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);

  // Format deadline for datetime-local input
  useEffect(() => {
    if (assignment?.deadline) {
      const d = new Date(assignment.deadline);
      // Format as YYYY-MM-DDTHH:MM
      const pad = (n: number) => String(n).padStart(2, "0");
      setDeadline(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }
  }, [assignment]);

  // Fetch courses and models on mount
  useEffect(() => {
    async function loadOptions() {
      const [coursesData, modelsData] = await Promise.all([
        getTeacherCourses(),
        getModels(),
      ]);
      setCourses(coursesData as CourseOption[]);
      setModels(
        (modelsData as ModelOption[]).map((m: ModelOption) => ({
          id: m.id,
          displayName: m.displayName,
        }))
      );
    }
    loadOptions();
  }, []);

  // Fetch classes when course changes
  const loadClasses = useCallback(async (cId: string) => {
    if (!cId) {
      setCourseClasses([]);
      return;
    }
    const data = await getCourseClasses(cId);
    setCourseClasses(data as ClassOption[]);
  }, []);

  useEffect(() => {
    if (courseId) {
      loadClasses(courseId);
    }
  }, [courseId, loadClasses]);

  // Set initial class IDs when editing
  useEffect(() => {
    if (assignment?.classes) {
      setSelectedClassIds(assignment.classes.map((c) => c.id));
    }
  }, [assignment]);

  function toggleClassId(classId: string) {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("作业名称为必填项");
      return;
    }
    if (!courseId) {
      setError("请选择所属课程");
      return;
    }
    if (!deadline) {
      setError("请设置截止时间");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("courseId", courseId);
      formData.append("description", description);
      formData.append("deadline", deadline);
      formData.append("llmModelId", llmModelId);
      formData.append("classIds", selectedClassIds.join(","));

      let result;
      if (isEdit && assignment) {
        result = await updateAssignment(assignment.id, formData);
      } else {
        result = await createAssignment(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        resetForm();
      }
    } catch {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    if (!isEdit) {
      setName("");
      setCourseId("");
      setDescription("");
      setDeadline("");
      setLlmModelId("");
      setSelectedClassIds([]);
    }
    setError(null);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      resetForm();
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑作业" : "新建作业"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-name">作业名称</Label>
            <Input
              id="assignment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入作业名称"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>所属课程</Label>
            <Select
              value={courseId}
              onValueChange={(val: string | null) => {
                setCourseId(val ?? "");
                setSelectedClassIds([]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择课程" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.academicYear} {course.semester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-description">作业描述</Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入作业描述"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-deadline">截止时间</Label>
            <Input
              id="assignment-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          {courseClasses.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>选择班级</Label>
              <div className="flex flex-wrap gap-3 rounded-lg border p-3">
                {courseClasses.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedClassIds.includes(cls.id)}
                      onCheckedChange={() => toggleClassId(cls.id)}
                    />
                    <span className="text-sm">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>批改模型</Label>
            <Select
              value={llmModelId}
              onValueChange={(val: string | null) => setLlmModelId(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择批改模型" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
