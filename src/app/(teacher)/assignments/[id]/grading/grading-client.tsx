"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  student: {
    id: string;
    studentProfile: {
      studentNo: string;
      name: string;
    } | null;
  };
  evaluations: Evaluation[];
};

type Question = {
  id: string;
  name: string;
  score: number;
};

export function GradingClient({
  assignmentId,
  assignmentName,
  questions,
  questionSubmissions,
}: {
  assignmentId: string;
  assignmentName: string;
  questions: Question[];
  questionSubmissions: Record<string, Submission[]>;
}) {
  const [activeTab, setActiveTab] = useState(questions[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");

  const activeQuestion = questions.find((q) => q.id === activeTab);
  const activeSubmissions = questionSubmissions[activeTab] || [];

  const filteredSubmissions = searchTerm
    ? activeSubmissions.filter(
        (s) =>
          s.student.studentProfile?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          s.student.studentProfile?.studentNo
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : activeSubmissions;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/teacher/assignments/${assignmentId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4 inline mr-1" />
          返回作业详情
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-1">批改查看</h2>
      <p className="text-muted-foreground mb-6">{assignmentName}</p>

      {/* Question Tabs */}
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
          暂无题目
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {questions.map((q) => (
              <Button
                key={q.id}
                variant={activeTab === q.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(q.id)}
              >
                {q.name} ({q.score}分)
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索学号或姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              共 {filteredSubmissions.length} 条提交
            </span>
          </div>

          {/* Submissions Table */}
          {activeQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {activeQuestion.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    满分 {activeQuestion.score} 分
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无提交
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>学号</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead className="max-w-48">答案</TableHead>
                          <TableHead>查重率</TableHead>
                          <TableHead>评价分数</TableHead>
                          <TableHead className="max-w-64">评价</TableHead>
                          <TableHead className="max-w-64">学习建议</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((submission) => {
                          const evaluation = submission.evaluations[0];
                          return (
                            <TableRow key={submission.id}>
                              <TableCell className="font-mono text-sm">
                                {submission.student.studentProfile?.studentNo || "-"}
                              </TableCell>
                              <TableCell className="font-medium">
                                <Link
                                  href={`/teacher/students/${submission.student.id}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {submission.student.studentProfile?.name || "-"}
                                </Link>
                              </TableCell>
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
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
