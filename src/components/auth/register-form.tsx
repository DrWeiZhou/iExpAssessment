"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerTeacher } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerTeacher(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.success) {
      router.push("/teacher/dashboard");
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">注册教师账号</h1>
        <p className="text-sm text-muted-foreground mt-1">
          创建账号以开始使用AI作业批改助手
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="username">用户名 *</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="请输入用户名（至少3个字符）"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码 *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="请输入密码（至少6个字符）"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">姓名 *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="请输入真实姓名"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="college">学院</Label>
          <Input
            id="college"
            name="college"
            type="text"
            placeholder="请输入所在学院"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">专业</Label>
          <Input
            id="major"
            name="major"
            type="text"
            placeholder="请输入所学专业"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">手机号</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="请输入手机号"
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "注册中..." : "注册"}
        </Button>
      </form>

      <div className="text-center text-sm">
        已有账号？{" "}
        <Link href="/login" className="text-primary underline">
          返回登录
        </Link>
      </div>
    </div>
  );
}
