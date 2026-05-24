"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreEditor } from "@/components/teacher/score-editor";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

type Evaluation = {
  id: string;
  score: number | null;
  evaluation: string | null;
  suggestion: string | null;
};

type Submission = {
  id: string;
  answer: string | null;
  plagiarismRate: string | null;
  question: {
    id: string;
    name: string;
    score: number;
    assignment: {
      id: string;
      name: string;
    };
  };
  evaluations: Evaluation[];
};

type StudentInfo = {
  id: string;
  studentNo: string;
  name: string;
  college: string | null;
  major: string | null;
  grade: string | null;
  className: string | null;
};

export function StudentDetailClient({
  student,
  submissions,
}: {
  student: StudentInfo;
  submissions: Submission[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Group submissions by assignment
  const groupedByAssignment = submissions.reduce<
    Record<string, { name: string; submissions: Submission[] }>
  >((acc, sub) => {
    const assignmentId = sub.question.assignment.id;
    if (!acc[assignmentId]) {
      acc[assignmentId] = {
        name: sub.question.assignment.name,
        submissions: [],
      };
    }
    acc[assignmentId].submissions.push(sub);
    return acc;
  }, {});

  const assignmentGroups = Object.entries(groupedByAssignment);

  // Filter assignments by search term
  const filteredGroups = searchTerm
    ? assignmentGroups.filter(
        ([, group]) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.submissions.some(
            (s) =>
              s.question.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : assignmentGroups;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="javascript:history.back()"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4 inline mr-1" />
          返回
        </Link>
      </div>

      {/* Student Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>学生信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">姓名</span>
              <p className="font-medium">{student.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学号</span>
              <p className="font-medium font-mono">{student.studentNo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学院</span>
              <p className="font-medium">{student.college || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">专业</span>
              <p className="font-medium">{student.major || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">年级</span>
              <p className="font-medium">{student.grade || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">班级</span>
              <p className="font-medium">{student.className || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">提交记录</h3>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索作业或题目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      </div>

      {/* Submissions grouped by assignment */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
          暂无提交记录
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(([assignmentId, group]) => (
            <Card key={assignmentId}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link
                    href={`/teacher/assignments/${assignmentId}/grading`}
                    className="text-blue-600 hover:underline"
                  >
                    {group.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>题目</TableHead>
                        <TableHead>分值</TableHead>
                        <TableHead className="max-w-48">答案</TableHead>
                        <TableHead>查重率</TableHead>
                        <TableHead>评价分数</TableHead>
                        <TableHead className="max-w-64">评价</TableHead>
                        <TableHead className="max-w-64">学习建议</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.submissions.map((submission) => {
                        const evaluation = submission.evaluations[0];
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.question.name}
                            </TableCell>
                            <TableCell>{submission.question.score}</TableCell>
                            <TableCell className="max-w-48">
                              {submission.answer ? (
                                <span className="text-sm line-clamp-2">
                                  {submission.answer.length > 80
                                    ? submission.answer.slice(0, 80) + "..."
                                    : submission.answer}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">无答案</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.plagiarismRate
                                ? `${(parseFloat(submission.plagiarismRate) * 100).toFixed(1)}%`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {evaluation ? (
                                <ScoreEditor
                                  evaluationId={evaluation.id}
                                  initialScore={evaluation.score ?? 0}
                                />
                              ) : (
                                <span className="text-muted-foreground">等待评价</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-64">
                              {evaluation?.evaluation ? (
                                <span className="text-sm line-clamp-3">
                                  {evaluation.evaluation}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-64">
                              {evaluation?.suggestion ? (
                                <span className="text-sm line-clamp-3">
                                  {evaluation.suggestion}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
