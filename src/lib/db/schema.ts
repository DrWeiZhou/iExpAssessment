import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// Enums
// ============================================================

export const roleEnum = pgEnum("role", ["teacher", "student"]);
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "submitted"]);

// ============================================================
// Tables
// ============================================================

// --- Users ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Teacher Profiles ---
export const teacherProfiles = pgTable("teacher_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  college: varchar("college"),
  major: varchar("major"),
});

// --- Student Profiles ---
export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studentNo: varchar("student_no").notNull().unique(),
  name: varchar("name").notNull(),
  gender: varchar("gender"),
  college: varchar("college"),
  grade: varchar("grade"),
  major: varchar("major"),
  className: varchar("class_name"),
  phone: varchar("phone"),
  email: varchar("email"),
  isRetake: boolean("is_retake").default(false).notNull(),
});

// --- LLM Models ---
export const llmModels = pgTable("llm_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name").notNull(),
  modelName: varchar("model_name").notNull(),
  baseUrl: varchar("base_url").notNull(),
  apiKey: varchar("api_key").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Courses ---
export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  academicYear: varchar("academic_year").notNull(),
  semester: varchar("semester").notNull(),
  name: varchar("name").notNull(),
  studentCount: integer("student_count").default(0),
  classComposition: text("class_composition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Course-Student Association ---
export const courseStudents = pgTable(
  "course_students",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.studentId] })]
);

// --- Classes ---
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Class-Student Association ---
export const classStudents = pgTable(
  "class_students",
  {
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.classId, t.studentId] })]
);

// --- Assignments ---
export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  deadline: timestamp("deadline").notNull(),
  description: text("description"),
  llmModelId: uuid("llm_model_id").references(() => llmModels.id, {
    onDelete: "set null",
  }),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Assignment-Class Association ---
export const assignmentClasses = pgTable(
  "assignment_classes",
  {
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.assignmentId, t.classId] })]
);

// --- Questions ---
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  score: integer("score").notNull(),
  evalMethod: text("eval_method"),
  evalCriteria: text("eval_criteria"),
  referenceAnswer: text("reference_answer"),
  notes: text("notes"),
  showFeedback: boolean("show_feedback").default(true).notNull(),
  promptTemplateId: uuid("prompt_template_id").references(() => promptTemplates.id, {
    onDelete: "set null",
  }),
  evalPrompt: text("eval_prompt"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// --- Submissions ---
export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  answer: text("answer"),
  notes: text("notes"),
  status: submissionStatusEnum("status").default("draft").notNull(),
  plagiarismRate: decimal("plagiarism_rate", { precision: 5, scale: 4 }),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Evaluations ---
export const evaluations = pgTable("evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  score: integer("score"),
  evaluation: text("evaluation"),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Prompt Templates ---
export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  content: text("content").notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- System Settings ---
export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
});

// ============================================================
// Relations
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [users.id],
    references: [teacherProfiles.userId],
  }),
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  llmModels: many(llmModels),
  courses: many(courses),
  promptTemplates: many(promptTemplates),
}));

export const teacherProfilesRelations = relations(teacherProfiles, ({ one }) => ({
  user: one(users, {
    fields: [teacherProfiles.userId],
    references: [users.id],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
}));

export const llmModelsRelations = relations(llmModels, ({ one, many }) => ({
  teacher: one(users, {
    fields: [llmModels.teacherId],
    references: [users.id],
  }),
  assignments: many(assignments),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  courseStudents: many(courseStudents),
  classes: many(classes),
  assignments: many(assignments),
}));

export const courseStudentsRelations = relations(courseStudents, ({ one }) => ({
  course: one(courses, {
    fields: [courseStudents.courseId],
    references: [courses.id],
  }),
  student: one(users, {
    fields: [courseStudents.studentId],
    references: [users.id],
  }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  course: one(courses, {
    fields: [classes.courseId],
    references: [courses.id],
  }),
  classStudents: many(classStudents),
  assignmentClasses: many(assignmentClasses),
}));

export const classStudentsRelations = relations(classStudents, ({ one }) => ({
  class: one(classes, {
    fields: [classStudents.classId],
    references: [classes.id],
  }),
  student: one(users, {
    fields: [classStudents.studentId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  llmModel: one(llmModels, {
    fields: [assignments.llmModelId],
    references: [llmModels.id],
  }),
  assignmentClasses: many(assignmentClasses),
  questions: many(questions),
}));

export const assignmentClassesRelations = relations(assignmentClasses, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentClasses.assignmentId],
    references: [assignments.id],
  }),
  class: one(classes, {
    fields: [assignmentClasses.classId],
    references: [classes.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [questions.assignmentId],
    references: [assignments.id],
  }),
  promptTemplate: one(promptTemplates, {
    fields: [questions.promptTemplateId],
    references: [promptTemplates.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  question: one(questions, {
    fields: [submissions.questionId],
    references: [questions.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  submission: one(submissions, {
    fields: [evaluations.submissionId],
    references: [submissions.id],
  }),
}));

export const promptTemplatesRelations = relations(promptTemplates, ({ one, many }) => ({
  teacher: one(users, {
    fields: [promptTemplates.teacherId],
    references: [users.id],
  }),
  questions: many(questions),
}));
