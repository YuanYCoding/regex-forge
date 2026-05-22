import type { TestResult, TestStats } from './types';

/**
 * Parse a comma-separated regex string into individual patterns.
 * Splits on top-level `,` that separates complete regex patterns.
 * A top-level `,` is one not inside (...), (?:...), [...], or escaped.
 * Example: "^pattern1$ , ^pattern2$ , ^pattern3$" → ["^pattern1$", "^pattern2$", "^pattern3$"]
 */
export function parseCommaSeparatedRegex(text: string): string[] {
  const patterns: string[] = [];
  let depth = 0;
  let current = '';
  let inCharClass = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '\\') {
      current += ch + (text[i + 1] || '');
      i += 2;
      continue;
    }

    if (ch === '[' && !inCharClass) {
      inCharClass = true;
      current += ch;
      i++;
      continue;
    }
    if (ch === ']' && inCharClass) {
      inCharClass = false;
      current += ch;
      i++;
      continue;
    }

    if (!inCharClass) {
      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
      }
    }

    if (ch === ',' && depth === 0 && !inCharClass) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        patterns.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    patterns.push(trimmed);
  }

  return patterns.filter((p) => p.length > 0);
}

/**
 * Parse a merged regex string (Format 1) into individual patterns.
 * Splits on top-level `|` that separates complete regex patterns.
 * A top-level `|` is one not inside (...), (?:...), [...], or escaped.
 */
export function parseMergedRegex(merged: string): string[] {
  const patterns: string[] = [];
  let depth = 0;
  let current = '';
  let inCharClass = false;
  let i = 0;

  while (i < merged.length) {
    const ch = merged[i];

    if (ch === '\\') {
      current += ch + (merged[i + 1] || '');
      i += 2;
      continue;
    }

    if (ch === '[' && !inCharClass) {
      inCharClass = true;
      current += ch;
      i++;
      continue;
    }
    if (ch === ']' && inCharClass) {
      inCharClass = false;
      current += ch;
      i++;
      continue;
    }

    if (!inCharClass) {
      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
      }
    }

    if (ch === '|' && depth === 0 && !inCharClass) {
      patterns.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  if (current.trim()) {
    patterns.push(current.trim());
  }

  return patterns.filter((p) => p.length > 0);
}

/**
 * Run regex test against a list of phrases.
 * @param patterns - Array of regex pattern strings
 * @param phrases - Array of test phrases
 * @returns TestResult for each phrase
 */
export function runRegexTest(patterns: string[], phrases: string[]): TestResult[] {
  return phrases.map((phrase) => {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.trim(), 'i');
        if (regex.test(phrase)) {
          return {
            phrase,
            passed: true,
            matchedPattern: pattern,
          };
        }
      } catch {
        return {
          phrase,
          passed: false,
          failureReason: `正则语法错误: "${pattern.slice(0, 40)}..."`,
        };
      }
    }

    return {
      phrase,
      passed: false,
      failureReason: analyzeFailureReason(phrase, patterns),
    };
  });
}

/**
 * Heuristic analysis for why a phrase didn't match any regex.
 */
function analyzeFailureReason(phrase: string, patterns: string[]): string {
  const reasons: string[] = [];

  // Check for partial keyword matches in the overall regex
  const allPatternsStr = patterns.join('|');
  const keywords = extractKeywords(allPatternsStr);

  if (keywords.length > 0) {
    const matchedKeywords = keywords.filter((kw) => phrase.includes(kw));
    const unmatchedKeywords = keywords.filter((kw) => !phrase.includes(kw));

    if (matchedKeywords.length > 0 && unmatchedKeywords.length > 0) {
      reasons.push(`缺少关键词: ${unmatchedKeywords.slice(0, 3).join(', ')}`);
    } else if (matchedKeywords.length === 0) {
      reasons.push(`话术中未包含任何正则关键词`);
    }
  }

  // Check punctuation differences
  const punctuation = /[。.?!，,；;：:、\s]$/;
  const hasEndPunct = punctuation.test(phrase);
  const regexHasEndPunct = punctuation.test(allPatternsStr);
  if (hasEndPunct !== regexHasEndPunct) {
    reasons.push(hasEndPunct ? '话术含结尾标点但正则未覆盖' : '正则期望结尾标点但话术无');
  }

  // Check whitespace
  if (/\s/.test(phrase) && !/\s/.test(allPatternsStr)) {
    reasons.push('话术含空格但正则未处理空白字符');
  }

  if (reasons.length === 0) {
    reasons.push('未被任何正则分支覆盖，建议添加新的正则规则');
  }

  return reasons.join('；');
}

/**
 * Extract meaningful keywords from regex patterns.
 */
function extractKeywords(regexStr: string): string[] {
  // Remove regex metacharacters to get literal text
  const cleaned = regexStr
    .replace(/\^|\$|\.\*|\.\+|\.\?|\\d|\\w|\\s|\\b|\\B/g, ' ')
    .replace(/[\[\]\(\)\{\}\|\?\+\*\.\!\^\$\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract Chinese keywords (2+ chars)
  const chineseWords = cleaned.match(/[一-鿿]{2,}/g) || [];
  return [...new Set(chineseWords)];
}

/**
 * Test a single merged regex pattern against phrases.
 */
export function runMergedRegexTest(mergedPattern: string, phrases: string[]): TestResult[] {
  try {
    const regex = new RegExp(mergedPattern, 'i');
    return phrases.map((phrase) => {
      if (regex.test(phrase)) {
        return { phrase, passed: true, matchedPattern: mergedPattern };
      }
      return {
        phrase,
        passed: false,
        failureReason: analyzeFailureReason(phrase, [mergedPattern]),
      };
    });
  } catch {
    return phrases.map((phrase) => ({
      phrase,
      passed: false,
      failureReason: '合并正则有语法错误',
    }));
  }
}

/**
 * Compute test statistics.
 */
export function computeStats(results: TestResult[]): TestStats {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  return {
    total,
    passed,
    failed: total - passed,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}
