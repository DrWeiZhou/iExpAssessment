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

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(
          100,
          Math.max(0, Math.round(Number(parsed.score) || 0))
        ),
        evaluation: parsed.evaluation || "",
        suggestion: parsed.suggestion || "",
      };
    }
  } catch {
    // JSON parse failed
  }

  return { score: 0, evaluation: text, suggestion: "" };
}

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
