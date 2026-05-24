# AI 实践作业批改助手 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 AI 辅助批改平台，支持教师管理课程/作业、学生提交答案、AI 自动评分。

**Architecture:** Next.js 15 App Router 混合架构 — Server Actions 处理 CRUD，API Route (Edge Runtime) 处理 AI 流式调用。自定义 JWT 认证 + Middleware 路由守卫。Drizzle ORM + Supabase PostgreSQL。

**Tech Stack:** Next.js 15, Shadcn UI, Tailwind CSS, Vercel AI SDK, Drizzle ORM, Supabase, bcryptjs, jose, xlsx

---

## Phase 1: 项目初始化与基础设施

### Task 1: 初始化 Next.js 项目并安装依赖

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.env.local`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd D:/iExpAssessment
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install drizzle-orm postgres jose bcryptjs xlsx ai @ai-sdk/openai
npm install -D drizzle-kit @types/bcryptjs
```

- [ ] **Step 3: 初始化 Shadcn UI**

```bash
npx shadcn@latest init -d
```

选择默认配置（New York style, Zinc color）。

- [ ] **Step 4: 安装所需的 Shadcn UI 组件**

```bash
npx shadcn@latest add button input label card dialog table form select textarea badge separator dropdown-menu sheet avatar tabs alert dialog sonner
```

- [ ] **Step 5: 创建环境变量文件**

创建 `.env.local`：
```
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your-random-secret-at-least-32-chars
```

- [ ] **Step 6: 验证项目可以启动**

```bash
npm run build
npm run dev
```

访问 http://localhost:3000 确认页面正常显示。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies and Shadcn UI"
```

---

### Task 2: 配置 Drizzle ORM 和数据库连接

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: 创建数据库连接配置**

创建 `src/lib/db/index.ts`：
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

- [ ] **Step 2: 创建 Drizzle Kit 配置**

创建 `drizzle.config.ts`：
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- [ ] **Step 3: 在 package.json 中添加数据库脚本**

在 `package.json` 的 `scripts` 中添加：
```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: configure Drizzle ORM with database connection"
```

---

### Task 3: 定义完整数据库 Schema

**Files:**
- Create: `src/lib/db/schema.ts`

- [ ] **Step 1: 编写完整的 Drizzle Schema**

创建 `src/lib/db/schema.ts`：
```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["teacher", "student"]);
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "submitted"]);

// ==================== 用户与档案 ====================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherProfiles = pgTable("teacher_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  name: varchar("name", { length: 100 }).notNull(),
  college: varchar("college", { length: 200 }),
  major: varchar("major", { length: 200 }),
});

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  studentNo: varchar("student_no", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  gender: varchar("gender", { length: 10 }),
  college: varchar("college", { length: 200 }),
  grade: varchar("grade", { length: 50 }),
  major: varchar("major", { length: 200 }),
  className: varchar("class_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isRetake: boolean("is_retake").default(false),
});

// ==================== LLM 模型 ====================

export const llmModels = pgTable("llm_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  modelName: varchar("model_name", { length: 200 }).notNull(),
  baseUrl: varchar("base_url", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== 课程与班级 ====================

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  studentCount: integer("student_count").default(0),
  classComposition: text("class_composition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseStudents = pgTable(
  "course_students",
  {
    courseId: uuid("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.studentId] })]
);

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classStudents = pgTable(
  "class_students",
  {
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.classId, table.studentId] })]
);

// ==================== 作业与题目 ====================

export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  deadline: timestamp("deadline").notNull(),
  description: text("description"),
  llmModelId: uuid("llm_model_id").references(() => llmModels.id),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignmentClasses = pgTable(
  "assignment_classes",
  {
    assignmentId: uuid("assignment_id")
      .references(() => assignments.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.assignmentId, table.classId] })]
);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id")
    .references(() => assignments.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  score: integer("score").notNull(),
  evalMethod: text("eval_method"),
  evalCriteria: text("eval_criteria"),
  referenceAnswer: text("reference_answer"),
  notes: text("notes"),
  showFeedback: boolean("show_feedback").default(false),
  promptTemplateId: uuid("prompt_template_id").references(() => promptTemplates.id),
  evalPrompt: text("eval_prompt"),
  sortOrder: integer("sort_order").default(0),
});

// ==================== 提交与评价 ====================

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  studentId: uuid("student_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  answer: text("answer").notNull(),
  notes: text("notes"),
  status: submissionStatusEnum("status").default("draft"),
  plagiarismRate: decimal("plagiarism_rate", { precision: 5, scale: 4 }),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  score: integer("score"),
  evaluation: text("evaluation"),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== 模板与设置 ====================

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
});
```

- [ ] **Step 2: 生成并推送 migration 到 Supabase**

```bash
npm run db:generate
npm run db:push
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: define complete database schema with Drizzle ORM"
```

---

## Phase 2: 认证系统

### Task 4: JWT 认证工具函数

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: 创建 JWT 认证工具**

创建 `src/lib/auth.ts`：
```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "auth_token";

export interface AuthPayload {
  userId: string;
  role: "teacher" | "student";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getAuthUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/auth.ts
git commit -m "feat: add JWT authentication utilities"
```

---

### Task 5: 认证 Middleware 和 Server Actions

**Files:**
- Create: `src/middleware.ts`
- Create: `src/actions/auth.ts`

- [ ] **Step 1: 创建 Middleware 路由守卫**

创建 `src/middleware.ts`：
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAME = "auth_token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // 公开路由
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(
          new URL(
            payload.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
            request.url
          )
        );
      }
    }
    return NextResponse.next();
  }

  // 需要认证的路由
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // 角色路由守卫
  if (pathname.startsWith("/teacher") && payload.role !== "teacher") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }
  if (pathname.startsWith("/student") && payload.role !== "student") {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: 创建认证 Server Actions**

创建 `src/actions/auth.ts`：
```typescript
"use server";

import { db } from "@/lib/db";
import { users, teacherProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";

export async function registerTeacher(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const college = formData.get("college") as string;
  const major = formData.get("major") as string;
  const phone = formData.get("phone") as string;

  if (!username || !password || !name) {
    return { error: "用户名、密码和姓名为必填项" };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existing) {
    return { error: "用户名已存在" };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      role: "teacher",
      phone,
    })
    .returning();

  await db.insert(teacherProfiles).values({
    userId: newUser.id,
    name,
    college,
    major,
  });

  const token = await createToken({ userId: newUser.id, role: "teacher" });
  await setAuthCookie(token);

  return { success: true };
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "请输入用户名和密码" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return { error: "用户名或密码错误" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "用户名或密码错误" };
  }

  const token = await createToken({ userId: user.id, role: user.role });
  await setAuthCookie(token);

  return { success: true, role: user.role };
}

export async function logout() {
  await clearAuthCookie();
  return { success: true };
}
```

- [ ] **Step 3: 提交**

```bash
git add src/middleware.ts src/actions/auth.ts
git commit -m "feat: add JWT auth middleware and server actions"
```

---

### Task 6: 登录和注册页面

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`

- [ ] **Step 1: 修改首页为重定向到登录页**

修改 `src/app/page.tsx`：
```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
```

- [ ] **Step 2: 创建登录表单组件**

创建 `src/components/auth/login-form.tsx`：
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        router.push(result.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>请输入您的账号信息</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
          <div className="text-center text-sm">
            <a href="/register" className="text-blue-600 hover:underline">
              教师注册
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 创建注册表单组件**

创建 `src/components/auth/register-form.tsx`：
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerTeacher } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      const result = await registerTeacher(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        router.push("/teacher/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>教师注册</CardTitle>
        <CardDescription>创建教师账号</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college">学院</Label>
              <Input id="college" name="college" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">专业</Label>
              <Input id="major" name="major" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">手机号码</Label>
            <Input id="phone" name="phone" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
          <div className="text-center text-sm">
            <a href="/login" className="text-blue-600 hover:underline">
              已有账号？去登录
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: 创建登录页面**

创建 `src/app/login/page.tsx`：
```typescript
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 5: 创建注册页面**

创建 `src/app/register/page.tsx`：
```typescript
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <RegisterForm />
    </div>
  );
}
```

- [ ] **Step 6: 验证登录注册流程**

```bash
npm run dev
```

访问 http://localhost:3000 确认重定向到登录页，测试注册和登录。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: add login and register pages with auth forms"
```

---

## Phase 3: 教师端基础功能

### Task 7: 教师布局组件

**Files:**
- Create: `src/app/(teacher)/layout.tsx`
- Create: `src/components/teacher/sidebar.tsx`

- [ ] **Step 1: 创建教师侧边栏组件**

创建 `src/components/teacher/sidebar.tsx`：
```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/teacher/dashboard", label: "仪表盘" },
  { href: "/teacher/models", label: "模型管理" },
  { href: "/teacher/courses", label: "课程管理" },
  { href: "/teacher/assignments", label: "作业管理" },
  { href: "/teacher/settings", label: "系统设置" },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={cn(
            "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-background">
        <div className="flex flex-col flex-1 p-4">
          <div className="mb-8">
            <h1 className="text-lg font-bold">AI 批改助手</h1>
            <p className="text-xs text-muted-foreground">教师端</p>
          </div>
          <NavLinks />
          <div className="mt-auto pt-4">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* 移动端顶部导航栏 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">AI 批改助手</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">菜单</Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="mt-8">
              <NavLinks />
            </div>
            <div className="mt-8">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                退出登录
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
```

注意：需要先 `npx shadcn@latest add sheet` 来安装 Sheet 组件（如果之前未安装）。

- [ ] **Step 2: 创建教师布局**

创建 `src/app/(teacher)/layout.tsx`：
```typescript
import { Sidebar } from "@/components/teacher/sidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add teacher layout with responsive sidebar"
```

---

### Task 8: LLM 模型管理 Server Actions 和页面

**Files:**
- Create: `src/actions/models.ts`
- Create: `src/app/(teacher)/models/page.tsx`
- Create: `src/components/teacher/model-form.tsx`

- [ ] **Step 1: 创建模型管理 Server Actions**

创建 `src/actions/models.ts`：
```typescript
"use server";

import { db } from "@/lib/db";
import { llmModels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getModels() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.llmModels.findMany({
    where: eq(llmModels.teacherId, user.userId),
    orderBy: (models, { desc }) => [desc(models.createdAt)],
  });
}

export async function createModel(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const displayName = formData.get("displayName") as string;
  const modelName = formData.get("modelName") as string;
  const baseUrl = formData.get("baseUrl") as string;
  const apiKey = formData.get("apiKey") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (!displayName || !modelName || !baseUrl || !apiKey) {
    return { error: "所有字段为必填项" };
  }

  if (isDefault) {
    await db
      .update(llmModels)
      .set({ isDefault: false })
      .where(and(eq(llmModels.teacherId, user.userId), eq(llmModels.isDefault, true)));
  }

  await db.insert(llmModels).values({
    teacherId: user.userId,
    displayName,
    modelName,
    baseUrl,
    apiKey,
    isDefault,
  });

  revalidatePath("/teacher/models");
  return { success: true };
}

export async function updateModel(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const displayName = formData.get("displayName") as string;
  const modelName = formData.get("modelName") as string;
  const baseUrl = formData.get("baseUrl") as string;
  const apiKey = formData.get("apiKey") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (isDefault) {
    await db
      .update(llmModels)
      .set({ isDefault: false })
      .where(and(eq(llmModels.teacherId, user.userId), eq(llmModels.isDefault, true)));
  }

  await db
    .update(llmModels)
    .set({ displayName, modelName, baseUrl, apiKey, isDefault })
    .where(and(eq(llmModels.id, id), eq(llmModels.teacherId, user.userId)));

  revalidatePath("/teacher/models");
  return { success: true };
}

export async function deleteModel(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .delete(llmModels)
    .where(and(eq(llmModels.id, id), eq(llmModels.teacherId, user.userId)));

  revalidatePath("/teacher/models");
  return { success: true };
}
```

- [ ] **Step 2: 创建模型表单组件**

创建 `src/components/teacher/model-form.tsx`：
```typescript
"use client";

import { useState } from "react";
import { createModel, updateModel } from "@/actions/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Model {
  id: string;
  displayName: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
}

export function ModelForm({ model, children }: { model?: Model; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!model;

  async function handleSubmit(formData: FormData) {
    if (isEdit) {
      await updateModel(model.id, formData);
    } else {
      await createModel(formData);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑模型" : "添加模型"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">显示名称</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={model?.displayName}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelName">模型名称</Label>
            <Input
              id="modelName"
              name="modelName"
              defaultValue={model?.modelName}
              placeholder="如: gpt-4, deepseek-chat"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              name="baseUrl"
              defaultValue={model?.baseUrl}
              placeholder="如: https://api.openai.com/v1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              defaultValue={model?.apiKey}
              type="password"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isDefault" name="isDefault" defaultChecked={model?.isDefault} />
            <Label htmlFor="isDefault">设为默认模型</Label>
          </div>
          <Button type="submit" className="w-full">
            {isEdit ? "保存" : "添加"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

注意：如果 Checkbox 组件未安装，运行 `npx shadcn@latest add checkbox`。

- [ ] **Step 3: 创建模型管理页面**

创建 `src/app/(teacher)/models/page.tsx`：
```typescript
import { getModels, deleteModel } from "@/actions/models";
import { ModelForm } from "@/components/teacher/model-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ModelsPage() {
  const models = await getModels();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">模型管理</h2>
        <ModelForm>
          <Button>添加模型</Button>
        </ModelForm>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无模型，请添加一个大语言模型
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>显示名称</TableHead>
                <TableHead>模型名称</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.displayName}</TableCell>
                  <TableCell>{model.modelName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{model.baseUrl}</TableCell>
                  <TableCell>
                    {model.isDefault && <Badge>默认</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ModelForm model={model}>
                      <Button variant="outline" size="sm">
                        编辑
                      </Button>
                    </ModelForm>
                    <form action={deleteModel.bind(null, model.id)}>
                      <Button variant="destructive" size="sm" type="submit">
                        删除
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 验证模型管理功能**

```bash
npm run dev
```

测试：登录教师账号 → 模型管理 → 添加/编辑/删除模型。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add LLM model management with CRUD operations"
```

---

### Task 9: 课程管理 Server Actions 和页面

**Files:**
- Create: `src/actions/courses.ts`
- Create: `src/app/(teacher)/courses/page.tsx`
- Create: `src/app/(teacher)/courses/[id]/page.tsx`
- Create: `src/components/teacher/course-form.tsx`

- [ ] **Step 1: 创建课程管理 Server Actions**

创建 `src/actions/courses.ts`：
```typescript
"use server";

import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.courses.findMany({
    where: eq(courses.teacherId, user.userId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getCourse(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return null;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.teacherId, user.userId)),
    with: { classes: true },
  });
  return course;
}

export async function createCourse(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const academicYear = formData.get("academicYear") as string;
  const semester = formData.get("semester") as string;
  const studentCount = parseInt(formData.get("studentCount") as string) || 0;
  const classComposition = formData.get("classComposition") as string;

  if (!name || !academicYear || !semester) {
    return { error: "课程名称、学年、学期为必填项" };
  }

  await db.insert(courses).values({
    teacherId: user.userId,
    name,
    academicYear,
    semester,
    studentCount,
    classComposition,
  });

  revalidatePath("/teacher/courses");
  return { success: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const academicYear = formData.get("academicYear") as string;
  const semester = formData.get("semester") as string;
  const studentCount = parseInt(formData.get("studentCount") as string) || 0;
  const classComposition = formData.get("classComposition") as string;

  await db
    .update(courses)
    .set({ name, academicYear, semester, studentCount, classComposition })
    .where(and(eq(courses.id, id), eq(courses.teacherId, user.userId)));

  revalidatePath("/teacher/courses");
  return { success: true };
}

export async function deleteCourse(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.teacherId, user.userId)));

  revalidatePath("/teacher/courses");
  return { success: true };
}
```

注意：文件顶部需要 `import { and } from "drizzle-orm";`，与 eq 一起导入。

- [ ] **Step 2: 创建课程表单组件**

创建 `src/components/teacher/course-form.tsx`，参考 Task 8 的 ModelForm 模式。表单字段：课程名称（必填）、学年（必填）、学期（必填）、人数、教学班组成。使用 Dialog 弹窗 + 表单。

- [ ] **Step 3: 创建课程列表页面**

创建 `src/app/(teacher)/courses/page.tsx`，参考 Task 8 的 ModelsPage 模式。展示课程表格，每行有编辑/删除按钮和"查看详情"链接。

- [ ] **Step 4: 创建课程详情页面**

创建 `src/app/(teacher)/courses/[id]/page.tsx`：
```typescript
import { getCourse } from "@/actions/courses";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="sm">← 返回课程列表</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{course.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">学年：</span>{course.academicYear}</div>
            <div><span className="text-muted-foreground">学期：</span>{course.semester}</div>
            <div><span className="text-muted-foreground">人数：</span>{course.studentCount}</div>
            <div><span className="text-muted-foreground">班组成：</span>{course.classComposition || "-"}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">班级列表</h3>
        <ClassForm courseId={course.id}>
          <Button>添加班级</Button>
        </ClassForm>
      </div>

      {course.classes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无班级</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {course.classes.map((cls) => (
            <Card key={cls.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cls.name}</span>
                  <Link href={`/teacher/classes/${cls.id}`}>
                    <Button variant="outline" size="sm">管理学生</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add course management with CRUD and detail page"
```

---

### Task 10: 班级管理 + Excel 导入

**Files:**
- Create: `src/lib/excel.ts`
- Create: `src/actions/classes.ts`
- Create: `src/app/(teacher)/classes/[id]/page.tsx`
- Create: `src/components/teacher/excel-upload.tsx`
- Create: `src/components/teacher/class-form.tsx`

- [ ] **Step 1: 创建 Excel 解析工具**

创建 `src/lib/excel.ts`：
```typescript
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
```

- [ ] **Step 2: 创建班级管理 Server Actions**

创建 `src/actions/classes.ts`：
```typescript
"use server";

import { db } from "@/lib/db";
import {
  classes,
  classStudents,
  courseStudents,
  users,
  studentProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { parseStudentExcel, type StudentRow } from "@/lib/excel";
import { revalidatePath } from "next/cache";

export async function createClass(courseId: string, name: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db.insert(classes).values({ courseId, name });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function getClass(classId: string) {
  const cls = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: {
      course: true,
      classStudents: {
        with: {
          student: {
            with: { studentProfile: true },
          },
        },
      },
    },
  });
  return cls;
}

export async function importStudents(classId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const file = formData.get("file") as File;
  if (!file) return { error: "请选择文件" };

  const buffer = await file.arrayBuffer();
  const { students, errors: parseErrors } = parseStudentExcel(buffer);

  if (students.length === 0) {
    return { error: "未解析到有效学生数据", parseErrors };
  }

  const cls = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
  });
  if (!cls) return { error: "班级不存在" };

  let imported = 0;
  let skipped = 0;

  for (const row of students) {
    // 查找或创建学生
    let profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.studentNo, row.studentNo),
    });

    if (!profile) {
      const passwordHash = await hashPassword(row.studentNo);
      const [newUser] = await db
        .insert(users)
        .values({
          username: row.studentNo,
          passwordHash,
          role: "student",
          phone: row.phone,
          email: row.email,
        })
        .returning();

      const [newProfile] = await db
        .insert(studentProfiles)
        .values({
          userId: newUser.id,
          studentNo: row.studentNo,
          name: row.name,
          gender: row.gender,
          college: row.college,
          grade: row.grade,
          major: row.major,
          className: row.className,
          phone: row.phone,
          email: row.email,
          isRetake: row.isRetake,
        })
        .returning();

      profile = newProfile;
    }

    // 检查是否已在班级中
    const existingClassStudent = await db.query.classStudents.findFirst({
      where: and(
        eq(classStudents.classId, classId),
        eq(classStudents.studentId, profile.userId)
      ),
    });

    if (existingClassStudent) {
      skipped++;
      continue;
    }

    // 添加到班级
    await db.insert(classStudents).values({
      classId,
      studentId: profile.userId,
    });

    // 添加到课程
    const existingCourseStudent = await db.query.courseStudents.findFirst({
      where: and(
        eq(courseStudents.courseId, cls.courseId),
        eq(courseStudents.studentId, profile.userId)
      ),
    });

    if (!existingCourseStudent) {
      await db.insert(courseStudents).values({
        courseId: cls.courseId,
        studentId: profile.userId,
      });
    }

    imported++;
  }

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true, imported, skipped, parseErrors };
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  await db
    .delete(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}
```

- [ ] **Step 3: 创建 Excel 上传组件**

创建 `src/components/teacher/excel-upload.tsx`：
```typescript
"use client";

import { useState, useRef } from "react";
import { importStudents } from "@/actions/classes";
import { Button } from "@/components/ui/button";

interface ExcelUploadProps {
  classId: string;
}

export function ExcelUpload({ classId }: ExcelUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported?: number;
    skipped?: number;
    error?: string;
  } | null>(null);

  async function handleUpload(formData: FormData) {
    setLoading(true);
    setResult(null);
    try {
      const res = await importStudents(classId, formData);
      setResult(res as typeof result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form action={handleUpload}>
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <Button type="submit" className="mt-3" disabled={loading}>
          {loading ? "导入中..." : "导入学生"}
        </Button>
      </form>
      {result && (
        <div className="text-sm">
          {result.error && <p className="text-red-600">{result.error}</p>}
          {result.imported !== undefined && (
            <p className="text-green-600">
              成功导入 {result.imported} 人，跳过 {result.skipped} 人
            </p>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Excel 模板列：学号、姓名、性别、学院、年级、专业、班级、手机号码、电子邮箱、是否重修
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 创建班级详情页面**

创建 `src/app/(teacher)/classes/[id]/page.tsx`：
```typescript
import { getClass } from "@/actions/classes";
import { removeStudentFromClass } from "@/actions/classes";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExcelUpload } from "@/components/teacher/excel-upload";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cls = await getClass(id);
  if (!cls) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href={`/teacher/courses/${cls.courseId}`}>
          <Button variant="ghost" size="sm">← 返回课程</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{cls.name} - 学生管理</CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelUpload classId={id} />
        </CardContent>
      </Card>

      {cls.classStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无学生</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>学院</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>是否重修</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cls.classStudents.map((cs) => {
                const p = cs.student.studentProfile;
                if (!p) return null;
                return (
                  <TableRow key={cs.student.id}>
                    <TableCell>{p.studentNo}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.gender || "-"}</TableCell>
                    <TableCell>{p.college || "-"}</TableCell>
                    <TableCell>{p.major || "-"}</TableCell>
                    <TableCell>{p.isRetake ? "是" : "否"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/teacher/students/${cs.student.id}`}>
                        <Button variant="outline" size="sm">查看成绩</Button>
                      </Link>
                      <form action={removeStudentFromClass.bind(null, id, cs.student.id)}>
                        <Button variant="destructive" size="sm" type="submit">
                          移除
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 验证班级管理和 Excel 导入**

```bash
npm run dev
```

测试：创建课程 → 添加班级 → 上传 Excel 文件 → 验证学生数据。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add class management with Excel student import"
```

---

## Phase 4: 作业与题目管理

### Task 11: 作业管理 Server Actions

**Files:**
- Create: `src/actions/assignments.ts`

- [ ] **Step 1: 创建作业管理 Server Actions**

创建 `src/actions/assignments.ts`，包含以下功能：
- `getAssignments()` - 获取当前教师的所有作业
- `getAssignment(id)` - 获取作业详情（含题目、关联班级）
- `createAssignment(formData)` - 创建作业
- `updateAssignment(id, formData)` - 更新作业
- `deleteAssignment(id)` - 删除作业（已发布的不可删除）
- `publishAssignment(id)` - 发布作业
- `createQuestion(assignmentId, formData)` - 创建题目
- `updateQuestion(id, formData)` - 更新题目
- `deleteQuestion(id)` - 删除题目

关键实现要点：
- 创建作业时 `isPublished` 默认为 `false`
- 删除时检查 `isPublished`，如果为 `true` 则拒绝
- 题目创建时根据表单数据自动生成 `evalPrompt`（替换模板占位符）
- 发布作业时将 `isPublished` 设为 `true`

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add assignment and question management server actions"
```

---

### Task 12: 作业管理页面

**Files:**
- Create: `src/app/(teacher)/assignments/page.tsx`
- Create: `src/app/(teacher)/assignments/[id]/page.tsx`
- Create: `src/components/teacher/assignment-form.tsx`
- Create: `src/components/teacher/question-form.tsx`

- [ ] **Step 1: 创建作业表单组件**

创建 `src/components/teacher/assignment-form.tsx`：Dialog 弹窗表单，字段包括作业名称、描述、截止时间、选择班级（多选）、选择 LLM 模型。

- [ ] **Step 2: 创建作业列表页面**

创建 `src/app/(teacher)/assignments/page.tsx`：展示作业列表，区分已发布/未发布，显示操作按钮（编辑/删除/发布/查看详情）。

- [ ] **Step 3: 创建题目表单组件**

创建 `src/components/teacher/question-form.tsx`：Dialog 弹窗表单，字段包括题目名称、分值、评价方式、评价标准、参考答案、备注、是否反馈、评价提示词模板选择。选择模板后自动填充 `evalPrompt`，修改任何字段都自动更新 `evalPrompt`。

关键：当用户修改任何字段时，使用模板替换占位符自动更新 `evalPrompt` 文本框内容。用户也可以手动修改 `evalPrompt`。

- [ ] **Step 4: 创建作业详情页面**

创建 `src/app/(teacher)/assignments/[id]/page.tsx`：展示作业信息 + 题目列表 + 发布按钮 + 批改查看链接。

- [ ] **Step 5: 验证作业管理功能**

测试：创建作业 → 添加题目 → 配置提示词 → 发布 → 验证状态。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add assignment management with question forms and publish"
```

---

## Phase 5: 查重与 AI 评价

### Task 13: 查重算法工具

**Files:**
- Create: `src/lib/plagiarism.ts`

- [ ] **Step 1: 实现查重算法**

创建 `src/lib/plagiarism.ts`：
```typescript
/**
 * 去除所有空白字符（空格、换行、制表符等）
 */
function normalize(text: string): string {
  return text.replace(/\s/g, "");
}

/**
 * 计算两个字符串的最长公共子序列长度
 */
function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算两个文本的相似度（LCS 比率）
 * 返回 0-1 之间的值，1 表示完全相同
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const a = normalize(textA);
  const b = normalize(textB);

  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const lcs = lcsLength(a, b);
  const maxLen = Math.max(a.length, b.length);

  return lcs / maxLen;
}

/**
 * 检查文本与已有答案列表的最大相似度
 */
export function findMaxSimilarity(
  newText: string,
  existingTexts: string[]
): number {
  if (existingTexts.length === 0) return 0;

  let maxSim = 0;
  for (const existing of existingTexts) {
    const sim = calculateSimilarity(newText, existing);
    if (sim > maxSim) maxSim = sim;
  }

  return maxSim;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/plagiarism.ts
git commit -m "feat: add plagiarism detection using LCS similarity"
```

---

### Task 14: 提交管理 Server Actions

**Files:**
- Create: `src/actions/submissions.ts`

- [ ] **Step 1: 创建提交管理 Server Actions**

创建 `src/actions/submissions.ts`，包含：
- `saveDraft(questionId, answer, notes)` - 暂存答案
- `submitAnswer(questionId, answer, notes)` - 提交答案（含查重）
- `getSubmission(questionId)` - 获取当前学生的提交
- `getSubmissionsForQuestion(questionId)` - 获取某题所有提交（教师用）
- `getStudentSubmissions(studentId)` - 获取某学生所有提交
- `updateEvaluationScore(evaluationId, score)` - 教师修改评分

关键：`submitAnswer` 的查重逻辑：
1. 获取同题目所有已提交答案
2. 使用 `findMaxSimilarity` 计算最大相似度
3. 获取系统设置的查重阈值
4. 如果超过阈值，返回错误
5. 通过查重后，保存提交并触发 AI 评价

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add submission management with plagiarism check"
```

---

### Task 15: AI 评价 API Route

**Files:**
- Create: `src/lib/ai.ts`
- Create: `src/app/api/evaluate/route.ts`

- [ ] **Step 1: 创建 AI 调用工具**

创建 `src/lib/ai.ts`：
```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

interface LLMConfig {
  modelName: string;
  baseUrl: string;
  apiKey: string;
}

export function createLLMClient(config: LLMConfig) {
  return createOpenAI({
    name: "custom",
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}

export async function evaluateAnswer(
  config: LLMConfig,
  prompt: string
): Promise<{ score: number; evaluation: string; suggestion: string }> {
  const client = createLLMClient(config);

  const { text } = await generateText({
    model: client(config.modelName),
    prompt,
  });

  // 尝试解析 JSON 结果
  try {
    // 提取 JSON 部分（可能被 markdown 代码块包裹）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0))),
        evaluation: parsed.evaluation || "",
        suggestion: parsed.suggestion || "",
      };
    }
  } catch {
    // JSON 解析失败
  }

  // 如果无法解析 JSON，返回原始文本
  return {
    score: 0,
    evaluation: text,
    suggestion: "",
  };
}

/**
 * 替换提示词模板中的占位符
 */
export function renderPromptTemplate(
  template: string,
  vars: {
    questionName: string;
    questionScore: number;
    evalMethod: string;
    referenceAnswer: string;
    studentAnswer: string;
    notes: string;
  }
): string {
  return template
    .replace(/\{题目名称\}/g, vars.questionName)
    .replace(/\{题目分值\}/g, String(vars.questionScore))
    .replace(/\{评价方式\}/g, vars.evalMethod || "未指定")
    .replace(/\{参考答案\}/g, vars.referenceAnswer || "无")
    .replace(/\{学生答案\}/g, vars.studentAnswer)
    .replace(/\{备注\}/g, vars.notes || "无");
}
```

- [ ] **Step 2: 创建 AI 评价 API Route**

创建 `src/app/api/evaluate/route.ts`：
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, questions, evaluations, llmModels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { evaluateAnswer, renderPromptTemplate } from "@/lib/ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json();

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "提交不存在" }, { status: 404 });
    }

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, submission.questionId),
    });

    if (!question || !question.evalPrompt) {
      return NextResponse.json({ error: "题目或评价提示词不存在" }, { status: 400 });
    }

    // 渲染提示词：替换学生答案占位符
    const prompt = question.evalPrompt.replace(
      /\{学生答案\}/g,
      submission.answer
    );

    let model = null;
    if (question) {
      const assignment = await db.query.assignments.findFirst({
        where: eq(require("@/lib/db/schema").assignments.id, question.assignmentId),
      });
      if (assignment?.llmModelId) {
        model = await db.query.llmModels.findFirst({
          where: eq(llmModels.id, assignment.llmModelId),
        });
      }
    }

    if (!model) {
      return NextResponse.json({ error: "未配置批改模型" }, { status: 400 });
    }

    const result = await evaluateAnswer(
      {
        modelName: model.modelName,
        baseUrl: model.baseUrl,
        apiKey: model.apiKey,
      },
      prompt
    );

    // 保存评价结果
    await db.insert(evaluations).values({
      submissionId: submission.id,
      score: result.score,
      evaluation: result.evaluation,
      suggestion: result.suggestion,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI evaluation error:", error);
    return NextResponse.json({ error: "AI 评价失败" }, { status: 500 });
  }
}
```

注意：Edge Runtime 下的数据库查询需要确认 Drizzle + postgres.js 的兼容性。如果 Edge Runtime 不支持 `postgres` 库，需要改用 `@neondatabase/serverless` 或将此 API Route 改为 Node Runtime，通过流式响应返回结果。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add AI evaluation API route and LLM utilities"
```

---

## Phase 6: 系统设置与模板

### Task 16: 系统设置和提示词模板管理

**Files:**
- Create: `src/actions/settings.ts`
- Create: `src/app/(teacher)/settings/page.tsx`
- Create: `src/components/teacher/prompt-template-form.tsx`

- [ ] **Step 1: 创建设置管理 Server Actions**

创建 `src/actions/settings.ts`：
```typescript
"use server";

import { db } from "@/lib/db";
import { systemSettings, promptTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value } });

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function getPromptTemplates() {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return [];

  return db.query.promptTemplates.findMany({
    where: (t, { or, eq, isNull }) =>
      or(eq(t.teacherId, user.userId), isNull(t.teacherId)),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function createPromptTemplate(formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;

  if (!name || !content) return { error: "名称和内容为必填项" };

  await db.insert(promptTemplates).values({
    teacherId: user.userId,
    name,
    content,
    isSystem: false,
  });

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function updatePromptTemplate(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;

  await db
    .update(promptTemplates)
    .set({ name, content })
    .where(eq(promptTemplates.id, id));

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function deletePromptTemplate(id: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") return { error: "未授权" };

  await db.delete(promptTemplates).where(eq(promptTemplates.id, id));

  revalidatePath("/teacher/settings");
  return { success: true };
}

/**
 * 初始化系统预置模板（首次启动时调用）
 */
export async function seedSystemTemplates() {
  const existing = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.isSystem, true),
  });

  if (!existing) {
    await db.insert(promptTemplates).values({
      teacherId: null,
      name: "默认评价模板",
      content: `本实践题目为{题目名称}，满分为{题目分值}

请以如下评价方式对学生答案进行评价。
评价方式为：{评价方式}

其中参考答案为：
{参考答案}

学生答案为：
{学生答案}

需要注意的是{备注}

你的回复以JSON格式输出，包括3部分：
- 评价分数（0-100整数）
- 学生作答的评价
- 下一步学习建议`,
      isSystem: true,
    });
  }

  const threshold = await getSetting("plagiarism_threshold");
  if (!threshold) {
    await setSetting("plagiarism_threshold", "0.99");
  }
}
```

- [ ] **Step 2: 创建设置页面**

创建 `src/app/(teacher)/settings/page.tsx`，包含：
- 查重阈值设置（数字输入框，保存到 `system_settings`）
- 提示词模板列表（含系统预置模板，可编辑/删除/新建）
- 模板内容使用 Textarea，显示占位符说明

- [ ] **Step 3: 创建模板表单组件**

创建 `src/components/teacher/prompt-template-form.tsx`：Dialog 弹窗表单，名称 + 模板内容 Textarea，下方显示可用占位符列表。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add system settings and prompt template management"
```

---

## Phase 7: 学生端

### Task 17: 学生布局和仪表盘

**Files:**
- Create: `src/app/(student)/layout.tsx`
- Create: `src/app/(student)/dashboard/page.tsx`

- [ ] **Step 1: 创建学生布局**

创建 `src/app/(student)/layout.tsx`：
```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center space-x-6">
            <Link href="/student/dashboard" className="font-bold">
              AI 批改助手
            </Link>
            <nav className="hidden sm:flex space-x-4">
              <Link
                href="/student/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                仪表盘
              </Link>
              <Link
                href="/student/assignments"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                我的作业
              </Link>
            </nav>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            退出
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 创建学生仪表盘**

创建 `src/app/(student)/dashboard/page.tsx`：展示当前学生可用的作业列表和完成状态。通过 Server Component 获取数据。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add student layout and dashboard"
```

---

### Task 18: 学生作业列表和答题页面

**Files:**
- Create: `src/app/(student)/assignments/page.tsx`
- Create: `src/app/(student)/assignments/[id]/page.tsx`
- Create: `src/app/(student)/questions/[id]/page.tsx`
- Create: `src/components/student/answer-form.tsx`

- [ ] **Step 1: 创建学生作业列表页面**

创建 `src/app/(student)/assignments/page.tsx`：展示所有已发布且分配到该学生所在班级的作业，显示作业名称、截止时间、完成进度。

- [ ] **Step 2: 创建作业题目列表页面**

创建 `src/app/(student)/assignments/[id]/page.tsx`：展示某个作业的所有题目，显示每道题的完成状态（未答/暂存/已提交），已提交的显示分数（如果已过截止时间且允许反馈）。

- [ ] **Step 3: 创建答题表单组件**

创建 `src/components/student/answer-form.tsx`：
```typescript
"use client";

import { useState } from "react";
import { saveDraft, submitAnswer } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AnswerFormProps {
  questionId: string;
  initialAnswer?: string;
  initialNotes?: string;
  status?: "draft" | "submitted";
  questionName: string;
  questionScore: number;
}

export function AnswerForm({
  questionId,
  initialAnswer = "",
  initialNotes = "",
  status = "draft",
  questionName,
  questionScore,
}: AnswerFormProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const isSubmitted = status === "submitted";

  async function handleSaveDraft() {
    setSaving(true);
    const result = await saveDraft(questionId, answer, notes);
    if (result?.error) {
      setMessage(result.error);
    } else {
      setMessage("已暂存");
    }
    setSaving(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setConfirmOpen(false);
    const result = await submitAnswer(questionId, answer, notes);
    if (result?.error) {
      setMessage(result.error);
    } else {
      setMessage("提交成功，正在等待 AI 评价...");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">题目名称：</span>
          {questionName}
        </div>
        <div>
          <span className="text-muted-foreground">题目分值：</span>
          {questionScore} 分
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">学生答案</Label>
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isSubmitted}
          maxLength={10000}
          rows={12}
          className="resize-y"
          placeholder="请输入你的答案（最多 10000 字）"
        />
        <p className="text-xs text-muted-foreground text-right">
          {answer.length} / 10000
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注说明</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitted}
          maxLength={1000}
          rows={3}
          placeholder="可选备注（最多 1000 字）"
        />
      </div>

      {message && (
        <div
          className={`p-3 text-sm rounded-md ${
            message.includes("失败") || message.includes("过高")
              ? "text-red-600 bg-red-50"
              : "text-green-600 bg-green-50"
          }`}
        >
          {message}
        </div>
      )}

      {!isSubmitted && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
          >
            {saving ? "保存中..." : "暂存"}
          </Button>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button disabled={submitting || !answer.trim()}>
                提交
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认提交</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                提交后无法修改，是否确认提交？
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "提交中..." : "确认提交"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isSubmitted && (
        <div className="p-3 text-sm bg-blue-50 text-blue-700 rounded-md">
          已提交，等待评价结果
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建答题页面**

创建 `src/app/(student)/questions/[id]/page.tsx`：Server Component，获取题目信息和当前学生的提交，传入 AnswerForm 组件。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add student assignment pages with answer form"
```

---

## Phase 8: 教师批改查看

### Task 19: 批改查看和学生详情页面

**Files:**
- Create: `src/app/(teacher)/assignments/[id]/grading/page.tsx`
- Create: `src/app/(teacher)/students/[id]/page.tsx`
- Create: `src/components/teacher/score-editor.tsx`

- [ ] **Step 1: 创建分数编辑组件**

创建 `src/components/teacher/score-editor.tsx`：
```typescript
"use client";

import { useState } from "react";
import { updateEvaluationScore } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ScoreEditor({
  evaluationId,
  initialScore,
}: {
  evaluationId: string;
  initialScore: number;
}) {
  const [score, setScore] = useState(initialScore);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateEvaluationScore(evaluationId, score);
    setEditing(false);
    setSaving(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-medium text-blue-600 hover:underline cursor-pointer"
      >
        {score} 分
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={100}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        className="w-20"
      />
      <Button size="sm" onClick={handleSave} disabled={saving}>
        保存
      </Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
        取消
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 创建批改查看页面**

创建 `src/app/(teacher)/assignments/[id]/grading/page.tsx`：Server Component，获取作业下所有题目的所有学生提交和评价，按题目分组展示。每个学生的分数使用 ScoreEditor 可编辑。

- [ ] **Step 3: 创建学生详情页面**

创建 `src/app/(teacher)/students/[id]/page.tsx`：Server Component，通过搜索学号或姓名查找学生，展示该生所有作业中每道题的提交和评价分数，分数可编辑。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add grading view and student detail with score editing"
```

---

## Phase 9: 教师仪表盘

### Task 20: 教师仪表盘页面

**Files:**
- Create: `src/app/(teacher)/dashboard/page.tsx`

- [ ] **Step 1: 创建教师仪表盘**

创建 `src/app/(teacher)/dashboard/page.tsx`：
```typescript
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, assignments, llmModels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function TeacherDashboard() {
  const user = await getAuthUser();
  if (!user) return null;

  const courseCount = await db.query.courses.findMany({
    where: eq(courses.teacherId, user.userId),
  }).then((r) => r.length);

  const assignmentCount = await db.query.assignments.findMany({
    where: eq(assignments.isPublished, true),
  }).then((r) => r.length);

  const modelCount = await db.query.llmModels.findMany({
    where: eq(llmModels.teacherId, user.userId),
  }).then((r) => r.length);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">教师仪表盘</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              课程数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已发布作业
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已配置模型
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/teacher/courses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">管理课程</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                创建课程、管理班级、导入学生
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">管理作业</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                创建实践作业、配置题目、查看批改
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
```

注意：实际实现中，`assignmentCount` 应该过滤只属于当前教师课程的作业，需要在 assignments 查询中 join courses。简化起见这里展示核心结构。

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add teacher dashboard with stats overview"
```

---

## Phase 10: 收尾与集成

### Task 21: 数据库种子数据与初始化

**Files:**
- Create: `src/lib/seed.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 创建种子数据脚本**

创建 `src/lib/seed.ts`：调用 `seedSystemTemplates()` 初始化系统预置模板和默认查重阈值。

- [ ] **Step 2: 在应用启动时自动初始化**

在根布局或首次访问时调用种子数据初始化（可以使用环境变量控制是否执行）。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add database seed and system initialization"
```

---

### Task 22: 全局样式和响应式优化

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 优化全局样式**

修改 `src/app/globals.css`，确保：
- 移动端容器宽度 100%
- 桌面端限制最大宽度
- 按钮最小高度 `min-h-12`（移动端）
- 文本框可滚动

- [ ] **Step 2: 优化根布局**

修改 `src/app/layout.tsx`，添加中文字体支持、metadata 等。

- [ ] **Step 3: 全页面验证**

测试所有页面在桌面端和移动端的表现，确认响应式设计正确。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: optimize global styles and responsive design"
```

---

### Task 23: 构建验证与最终提交

- [ ] **Step 1: 完整构建测试**

```bash
npm run build
```

确保无 TypeScript 错误和构建错误。

- [ ] **Step 2: 全流程测试**

1. 教师注册 → 登录
2. 配置 LLM 模型
3. 创建课程 → 创建班级
4. 上传 Excel 导入学生
5. 创建作业 → 添加题目 → 配置提示词 → 发布
6. 学生登录（学号/学号）
7. 查看作业 → 作答 → 暂存 → 提交
8. 验证查重（提交相同内容应被拒绝）
9. AI 评价结果查看
10. 教师修改评分

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: complete AI practice assignment grading assistant"
```
