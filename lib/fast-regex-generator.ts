/**
 * Fast pattern-based regex generator.
 * Each expression variant gets its own regex pattern, comma-separated.
 */

export interface GeneratedRegex {
  list: string[];
  coverage: number;
}

export function fastGenerateRegex(intent: string, expressions: string[]): GeneratedRegex {
  const allTexts = [intent, ...expressions];
  const patterns: string[] = [];

  // Step 1: Extract common substrings shared across all texts
  const commonWords = findCommonSubstrings(allTexts);

  // Step 2: Group expressions by shared structure, merge within groups
  const groups = groupByStructure(allTexts);

  // Step 3: For each group, generate a regex covering its variants
  for (const group of groups) {
    if (group.length === 1) {
      // Single expression: generate a flexible regex for it
      patterns.push(textToRegex(group[0]));
    } else {
      // Multiple similar expressions: merge into one regex with alternation
      const merged = mergeExpressions(group, commonWords);
      if (merged) patterns.push(merged);
    }
  }

  // Step 4: Also generate individual regexes for each original text
  // This ensures every text can be matched individually
  for (const text of allTexts.slice(0, 10)) {
    const direct = textToRegex(text);
    if (!patterns.includes(direct)) {
      patterns.push(direct);
    }
  }

  // Deduplicate, sort, compute coverage
  const unique = [...new Set(patterns)]
    .filter((p) => p.length > 3)
    .sort((a, b) => b.length - a.length);

  const coverage = computeCoverage(unique, allTexts);

  return { list: unique, coverage };
}

/** Convert a single text expression to a regex pattern */
function textToRegex(text: string): string {
  const cleaned = text.trim();
  // Escape regex special chars
  const escaped = escapeRegex(cleaned);
  // Add .* flexibility around the text and optional punctuation at end
  return `^.*${escaped}.*[。.?!]?$`;
}

/** Find common Chinese substrings (2-3 chars) shared by most texts */
function findCommonSubstrings(texts: string[]): string[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    const seen = new Set<string>();
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= text.length - len; i++) {
        const sub = text.slice(i, i + len);
        if (/^[一-鿿]+$/.test(sub) && !seen.has(sub)) {
          seen.add(sub);
          freq.set(sub, (freq.get(sub) || 0) + 1);
        }
      }
    }
  }
  const threshold = Math.max(2, texts.length * 0.4);
  return [...freq.entries()]
    .filter(([, c]) => c >= threshold)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([w]) => w);
}

/** Group texts by structural similarity */
function groupByStructure(texts: string[]): string[][] {
  const groups: string[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < texts.length; i++) {
    if (used.has(i)) continue;
    const group: string[] = [texts[i]];
    used.add(i);
    for (let j = i + 1; j < texts.length; j++) {
      if (used.has(j)) continue;
      if (textSimilarity(texts[i], texts[j]) >= 0.6) {
        group.push(texts[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }

  return groups;
}

/** Simple text similarity based on character overlap */
function textSimilarity(a: string, b: string): number {
  const sa = new Set(a);
  const sb = new Set(b);
  const intersect = [...sa].filter((c) => sb.has(c)).length;
  return intersect / Math.max(sa.size, sb.size);
}

/** Merge multiple similar expressions into one regex */
function mergeExpressions(texts: string[], commonWords: string[]): string | null {
  if (texts.length < 2) return null;

  // Find the longest common prefix
  let prefix = texts[0];
  for (const t of texts.slice(1)) {
    while (prefix.length > 0 && !t.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  // Find the longest common suffix
  let suffix = texts[0];
  for (const t of texts.slice(1)) {
    while (suffix.length > 0 && !t.endsWith(suffix)) {
      suffix = suffix.slice(1);
    }
  }

  // Extract the variable middle parts
  const middles = texts.map((t) => t.slice(prefix.length, t.length - suffix.length));
  const uniqueMiddles = [...new Set(middles.filter((m) => m.length > 0))];

  if (uniqueMiddles.length >= 2) {
    const alt = uniqueMiddles.map(escapeRegex).join('|');
    return `^.*${escapeRegex(prefix)}(?:${alt})${escapeRegex(suffix)}.*[。.?!]?$`;
  }

  // Fall back to individual patterns joined
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function computeCoverage(patterns: string[], texts: string[]): number {
  if (texts.length === 0) return 100;
  let matched = 0;
  for (const text of texts) {
    for (const pattern of patterns) {
      try {
        if (new RegExp(pattern, 'i').test(text)) {
          matched++;
          break;
        }
      } catch { /* skip */ }
    }
  }
  return Math.round((matched / texts.length) * 100);
}
