# AI 实践作业批改助手 - 设计文档

## 概述

一个面向高校教师的 AI 辅助批改平台，支持教师创建实践作业、管理课程班级、配置 LLM 模型，学生在线提交答案后由 AI 自动评分并给出学习建议。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 15 (App Router) | Server Components + Client Components |
| UI 组件 | Shadcn UI + Tailwind CSS | 响应式设计，PC + 移动端 |
| 流式适配 | Vercel AI SDK (`useChat`) | AI 评价流式展示 |
| 数据库 | Supabase (PostgreSQL) | Drizzle ORM 操作 |
| AI 调用 | OpenAI 兼容接口 | 通过 Vercel AI SDK 统一调用 |
| 认证 | 自定义 JWT + HttpOnly Cookie | 中间件路由守卫 |
| 部署 | Vercel + Supabase 云服务 | Edge Runtime 处理 AI 调用 |

## 架构

### 混合架构

- **Server Actions**: 处理所有 CRUD 操作（教师信息、模型、课程、班级、作业、提交、设置）
- **API Routes (Edge Runtime)**: 处理 AI 流式调用（`/api/evaluate`）
- **Middleware**: JWT 认证 + 角色路由守卫（教师/学生）

### 数据流

```
教师创建作业 → 配置题目+评价提示词 → 发布作业
                                    ↓
学生查看作业 → 作答 → 暂存/提交 → 查重检测 → AI 评价(流式)
                                                    ↓
                                          返回评分+评价+建议
                                                    ↓
                              截止时间后 → 学生查看反馈 | 教师修改分数
```

## 数据库模型

### `users` - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| username | varchar | 用户名（教师自定义，学生为学号） |
| password_hash | varchar | bcrypt 哈希 |
| role | enum(teacher, student) | 角色 |
| phone | varchar | 手机号码 |
| email | varchar | 电子邮箱 |
| created_at | timestamp | 创建时间 |

### `teacher_profiles` - 教师档案

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| user_id | uuid (FK → users) | 关联用户 |
| name | varchar | 教师姓名 |
| college | varchar | 学院 |
| major | varchar | 专业 |

### `student_profiles` - 学生档案

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| user_id | uuid (FK → users) | 关联用户 |
| student_no | varchar (unique) | 学号 |
| name | varchar | 姓名 |
| gender | varchar | 性别 |
| college | varchar | 学院 |
| grade | varchar | 年级 |
| major | varchar | 专业 |
| class_name | varchar | 班级 |
| phone | varchar | 手机号码 |
| email | varchar | 电子邮箱 |
| is_retake | boolean | 是否重修 |

### `llm_models` - 大语言模型配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| teacher_id | uuid (FK → users) | 所属教师 |
| display_name | varchar | 模型显示名 |
| model_name | varchar | 模型名（如 gpt-4） |
| base_url | varchar | API 基础 URL |
| api_key | varchar | API Key（加密存储） |
| is_default | boolean | 是否为默认模型 |
| created_at | timestamp | 创建时间 |

### `courses` - 课程

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| teacher_id | uuid (FK → users) | 创建教师 |
| academic_year | varchar | 学年 |
| semester | varchar | 学期 |
| name | varchar | 课程名称 |
| student_count | integer | 人数 |
| class_composition | text | 教学班组成 |
| created_at | timestamp | 创建时间 |

### `course_students` - 课程-学生关联

| 字段 | 类型 | 说明 |
|------|------|------|
| course_id | uuid (FK → courses) | 课程 |
| student_id | uuid (FK → users) | 学生 |
| (course_id, student_id) | PK | 联合主键 |

### `classes` - 班级

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| course_id | uuid (FK → courses) | 所属课程 |
| name | varchar | 班级名称 |
| created_at | timestamp | 创建时间 |

### `class_students` - 班级-学生关联

| 字段 | 类型 | 说明 |
|------|------|------|
| class_id | uuid (FK → classes) | 班级 |
| student_id | uuid (FK → users) | 学生 |
| (class_id, student_id) | PK | 联合主键 |

### `assignments` - 实践作业

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| course_id | uuid (FK → courses) | 所属课程 |
| name | varchar | 作业名称 |
| date | timestamp | 作业日期（默认当前时间） |
| deadline | timestamp | 截止时间（默认14天后） |
| description | text | 作业描述 |
| llm_model_id | uuid (FK → llm_models) | 批改用模型 |
| is_published | boolean | 是否已发布 |
| created_at | timestamp | 创建时间 |

### `assignment_classes` - 作业-班级关联

| 字段 | 类型 | 说明 |
|------|------|------|
| assignment_id | uuid (FK → assignments) | 作业 |
| class_id | uuid (FK → classes) | 班级 |
| (assignment_id, class_id) | PK | 联合主键 |

### `questions` - 实践题目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| assignment_id | uuid (FK → assignments) | 所属作业 |
| name | varchar | 题目名称 |
| score | integer (1-100) | 题目分值 |
| eval_method | text | 评价方式 |
| eval_criteria | text | 评价标准 |
| reference_answer | text | 参考答案 |
| notes | text | 备注 |
| show_feedback | boolean | 评价结果是否反馈给学生 |
| prompt_template_id | uuid (FK → prompt_templates) | 评价提示词模板 |
| eval_prompt | text | 实际评价提示词 |
| sort_order | integer | 排序 |

### `submissions` - 学生提交

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| question_id | uuid (FK → questions) | 题目 |
| student_id | uuid (FK → users) | 学生 |
| answer | text | 学生答案（原始，含空格空行） |
| notes | text | 备注说明 |
| status | enum(draft, submitted) | 状态 |
| plagiarism_rate | decimal | 查重率 |
| submitted_at | timestamp | 提交时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### `evaluations` - AI 评价结果

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| submission_id | uuid (FK → submissions) | 关联提交 |
| score | integer (0-100) | 评价分数 |
| evaluation | text | 学生作答评价 |
| suggestion | text | 下一步学习建议 |
| created_at | timestamp | 创建时间 |

### `prompt_templates` - 评价提示词模板

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| teacher_id | uuid (FK → users) | 所属教师（NULL 为系统预置） |
| name | varchar | 模板名称 |
| content | text | 模板内容（含占位符） |
| is_system | boolean | 是否系统预置 |
| created_at | timestamp | 创建时间 |

### `system_settings` - 系统设置

| 字段 | 类型 | 说明 |
|------|------|------|
| key | varchar (PK) | 设置键 |
| value | text | 设置值 |

预置设置：
- `plagiarism_threshold`: 查重阈值（默认 0.99）

## 页面路由

### 公共页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 重定向到 `/login` |
| `/login` | 登录页 | 教师/学生统一登录 |
| `/register` | 教师注册 | 注册教师账号 |

### 教师页面 (`/teacher/*`)

| 路由 | 页面 | 说明 |
|------|------|------|
| `/teacher/dashboard` | 仪表盘 | 课程数、作业数、待批改概览 |
| `/teacher/models` | 模型管理 | CRUD LLM 模型配置 |
| `/teacher/courses` | 课程管理 | 课程列表 + 增删改查 |
| `/teacher/courses/[id]` | 课程详情 | 课程信息 + 班级列表 |
| `/teacher/classes/[id]` | 班级详情 | 学生列表 + Excel 导入 |
| `/teacher/assignments` | 作业管理 | 作业列表（区分已发布/未发布） |
| `/teacher/assignments/[id]` | 作业详情 | 题目管理 + 发布 |
| `/teacher/assignments/[id]/grading` | 批改查看 | 按题目查看所有学生评分 |
| `/teacher/students/[id]` | 学生详情 | 该生所有作业评分 |
| `/teacher/settings` | 系统设置 | 查重阈值 + 模板管理 |

### 学生页面 (`/student/*`)

| 路由 | 页面 | 说明 |
|------|------|------|
| `/student/dashboard` | 仪表盘 | 可用作业 + 完成状态 |
| `/student/assignments` | 作业列表 | 已发布的作业 |
| `/student/assignments/[id]` | 作业详情 | 题目列表 + 完成状态 |
| `/student/questions/[id]` | 答题页面 | 作答 + 暂存/提交 |

### API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/evaluate` | POST | AI 评价（Edge Runtime，流式响应） |

## 认证设计

### JWT 认证流程

1. 教师注册：填写信息 → bcrypt 哈希密码 → 存入 `users` + `teacher_profiles`
2. 学生账号：教师导入班级时自动创建，用户名=学号，初始密码=学号
3. 登录：验证用户名+密码 → 生成 JWT（含 id, role）→ 存入 HttpOnly Cookie
4. Middleware：每个请求检查 Cookie 中的 JWT，根据 role 限制路由访问

### 角色权限

- `teacher`：可访问 `/teacher/*`，管理自己创建的课程/作业
- `student`：可访问 `/student/*`，查看和提交分配给自己的作业

## AI 批改流程

### 提交流程

```
1. 学生点击"提交" → 确认对话框
2. 服务端获取学生原始答案
3. 去除空格空行后，与同题目所有已提交答案逐一比对
4. 计算最大相似度 → 如果 ≥ 阈值(默认99%) → 拒绝提交
5. 通过查重 → 保存提交（原始答案，含空格空行）
6. 触发 AI 评价：
   a. 替换提示词模板中的占位符生成实际提示词
   b. 通过 Vercel AI SDK 调用 OpenAI 兼容接口
   c. 流式返回评价结果
   d. 解析 JSON 结果：{ score, evaluation, suggestion }
   e. 保存到 evaluations 表
7. 截止时间后 + show_feedback=true → 学生可查看评价
```

### 查重算法

- 去除所有空格和换行符
- 与同题目所有已提交答案计算相似度
- 使用最长公共子序列(LCS)比率作为相似度指标
- 相似度 ≥ 阈值 → 拒绝提交

### 提示词模板系统

预置模板内容：
```
本实践题目为{题目名称}，满分为{题目分值}

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
- 下一步学习建议
```

占位符自动替换规则：
- `{题目名称}` → question.name
- `{题目分值}` → question.score
- `{评价方式}` → question.eval_method
- `{参考答案}` → question.reference_answer
- `{学生答案}` → submission.answer
- `{备注}` → question.notes

## Excel 导入

### 固定模板列

| 列名 | 必填 | 说明 |
|------|------|------|
| 学号 | 是 | 作为学生唯一标识 |
| 姓名 | 是 | |
| 性别 | 否 | |
| 学院 | 否 | |
| 年级 | 否 | |
| 专业 | 否 | |
| 班级 | 否 | |
| 手机号码 | 否 | |
| 电子邮箱 | 否 | |
| 是否重修 | 否 | 是/否 |

### 导入逻辑

1. 解析 Excel，按行读取
2. 对每行学号：
   - 查询 `student_profiles` → 不存在 → 创建 `users`(username=学号, password=学号) + `student_profiles`
   - 查询 `class_students` → 不在该班级 → 添加到 `class_students` + `course_students`
   - 已在班级 → 跳过
3. 返回导入结果：成功数、跳过数、失败数

## 前端 UI 规范

### 响应式设计

- 移动端（`sm`）：容器宽度 100%，全屏布局
- 桌面端（`lg`）：`max-w-7xl mx-auto`，侧边栏导航
- 教师布局：桌面端左侧固定侧边栏 + 右侧内容区
- 学生布局：顶部导航栏 + 内容区

### 移动端优化

- 按钮最小尺寸 `min-h-12`，方便手指点击
- 文本框可滚动，支持自动换行
- AI 反馈文本在小屏幕上自动换行且可滚动

### 组件规划

- **仪表盘卡片**: 统计数据展示（课程数、作业数、待批改数）
- **数据表格**: 带 CRUD 操作的表格组件
- **表单对话框**: 新建/编辑的弹窗表单
- **Excel 上传组件**: 拖拽上传 + 解析进度
- **答题编辑器**: 多行文本框 + 基础排版工具栏
- **AI 反馈展示**: 流式输出 + 评分高亮

## 项目目录结构

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── (teacher)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── models/page.tsx
│   │   ├── courses/page.tsx
│   │   ├── courses/[id]/page.tsx
│   │   ├── classes/[id]/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── assignments/[id]/page.tsx
│   │   ├── assignments/[id]/grading/page.tsx
│   │   ├── students/[id]/page.tsx
│   │   └── settings/page.tsx
│   ├── (student)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── assignments/[id]/page.tsx
│   │   └── questions/[id]/page.tsx
│   └── api/
│       └── evaluate/route.ts
├── components/
│   ├── ui/
│   ├── auth/
│   ├── teacher/
│   └── student/
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── auth.ts
│   ├── ai.ts
│   ├── plagiarism.ts
│   └── excel.ts
├── actions/
│   ├── auth.ts
│   ├── models.ts
│   ├── courses.ts
│   ├── classes.ts
│   ├── assignments.ts
│   ├── submissions.ts
│   └── settings.ts
└── middleware.ts
```
