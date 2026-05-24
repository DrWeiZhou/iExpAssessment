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
 * Returns 0-1, where 1 means identical
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
