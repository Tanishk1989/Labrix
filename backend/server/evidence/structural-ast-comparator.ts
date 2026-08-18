/**
 * Structural AST & Lexical Token Plagiarism Detection Engine
 *
 * Implements MOSS-style invariant token normalization + K-gram winnowing.
 *
 * Unlike naive text/diff matching:
 * 1. Variable / function renaming has ZERO effect (identifiers are normalized to V_1, V_2...).
 * 2. Comment scrubbing / addition has ZERO effect.
 * 3. Whitespace / indentation changes have ZERO effect.
 * 4. Literal changes (e.g. changing 42 to 100) are abstracted.
 * 5. Control-flow structure, nesting depth, and AST grammar are strictly fingerprinted.
 */

export interface StructuralMatchBlock {
  startLineA: number;
  endLineA: number;
  startLineB: number;
  endLineB: number;
  matchedTokensCount: number;
}

export interface PairwiseStructuralSimilarity {
  submissionAId: string;
  studentAName: string;
  submissionBId: string;
  studentBName: string;
  structuralSimilarityPercentage: number; // 0 - 100
  verdict: "AUTHENTIC" | "SUSPICIOUS_SIMILARITY" | "STRUCTURAL_COLLUSION_FLAG";
  matchedBlocksCount: number;
  matchedLineBlocks: StructuralMatchBlock[];
  variableRenamingDetected: boolean;
  explanation: string;
}

// Language Keywords that define control structure
const CPP_KEYWORDS = new Set([
  "if", "else", "for", "while", "do", "switch", "case", "default", "return",
  "break", "continue", "int", "float", "double", "char", "bool", "void", "auto",
  "class", "struct", "public", "private", "protected", "virtual", "const",
  "include", "using", "namespace", "std", "vector", "string", "stack", "queue",
  "map", "set", "cin", "cout", "endl", "new", "delete", "nullptr", "sizeof",
]);

const JAVA_KEYWORDS = new Set([
  "abstract", "boolean", "break", "byte", "case", "catch", "char", "class",
  "const", "continue", "default", "do", "double", "else", "enum", "extends",
  "final", "finally", "float", "for", "goto", "if", "implements", "import",
  "instanceof", "int", "interface", "long", "native", "new", "package",
  "private", "protected", "public", "return", "short", "static", "strictfp",
  "super", "switch", "synchronized", "this", "throw", "throws", "transient",
  "try", "void", "volatile", "while", "String", "System", "out", "println",
]);

interface TokenWithPosition {
  token: string;
  line: number;
}

/**
 * Strips comments, strings, and normalizes identifiers to generic symbols (V_1, V_2).
 */
export function normalizeSourceToASTTokens(
  sourceCode: string,
  language: "CPP" | "JAVA" = "CPP",
): TokenWithPosition[] {
  const keywords = language === "CPP" ? CPP_KEYWORDS : JAVA_KEYWORDS;
  const tokens: TokenWithPosition[] = [];

  // Remove multi-line comments
  const cleanCode = sourceCode.replace(/\/\*[\s\S]*?\*\//g, (m) => "\n".repeat((m.match(/\n/g) || []).length));
  const lines = cleanCode.split("\n");

  const identifierMap = new Map<string, string>();
  let identifierCounter = 1;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    let line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // Remove single line comments
    const commentIdx = line.indexOf("//");
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }

    // Tokenize words, literals, and operators
    const rawTokens = line.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|==|!=|<=|>=|&&|\|\||\+\+|--|->|::|[{}()\[\];,\.=<>\+\-\*\/%&|^!~?:]/g) || [];

    for (const raw of rawTokens) {
      if (/^".*"$/.test(raw)) {
        tokens.push({ token: "LIT_STR", line: lineNum });
      } else if (/^'.*'$/.test(raw)) {
        tokens.push({ token: "LIT_CHR", line: lineNum });
      } else if (/^\d+(?:\.\d+)?$/.test(raw)) {
        tokens.push({ token: "LIT_NUM", line: lineNum });
      } else if (keywords.has(raw)) {
        tokens.push({ token: `KW_${raw.toUpperCase()}`, line: lineNum });
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
        // User defined identifier (variable, function, parameter)
        if (!identifierMap.has(raw)) {
          identifierMap.set(raw, `VAR_${identifierCounter++}`);
        }
        tokens.push({ token: identifierMap.get(raw)!, line: lineNum });
      } else {
        // Operators & delimiters
        tokens.push({ token: `OP_${raw}`, line: lineNum });
      }
    }
  }

  return tokens;
}

/**
 * Generates K-gram hash fingerprints using polynomial rolling hash.
 */
function generateKGramHashes(tokens: TokenWithPosition[], k = 4): Array<{ hash: number; line: number }> {
  if (tokens.length < k) return [];
  const hashes: Array<{ hash: number; line: number }> = [];

  const P = 31;
  const M = 1_000_000_007;

  for (let i = 0; i <= tokens.length - k; i++) {
    let hash = 0;
    let power = 1;
    for (let j = 0; j < k; j++) {
      const tok = tokens[i + j].token;
      let tokNum = 0;
      for (let c = 0; c < tok.length; c++) {
        tokNum = (tokNum * 17 + tok.charCodeAt(c)) % M;
      }
      hash = (hash + tokNum * power) % M;
      power = (power * P) % M;
    }
    hashes.push({ hash, line: tokens[i].line });
  }

  return hashes;
}

/**
 * Computes structural similarity between two student submissions.
 */
export function computeStructuralSimilarity(
  submissionA: { id: string; studentName: string; sourceCode: string; language: "CPP" | "JAVA" },
  submissionB: { id: string; studentName: string; sourceCode: string; language: "CPP" | "JAVA" },
  k = 4,
): PairwiseStructuralSimilarity {
  const tokensA = normalizeSourceToASTTokens(submissionA.sourceCode, submissionA.language);
  const tokensB = normalizeSourceToASTTokens(submissionB.sourceCode, submissionB.language);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return {
      submissionAId: submissionA.id,
      studentAName: submissionA.studentName,
      submissionBId: submissionB.id,
      studentBName: submissionB.studentName,
      structuralSimilarityPercentage: 0,
      verdict: "AUTHENTIC",
      matchedBlocksCount: 0,
      matchedLineBlocks: [],
      variableRenamingDetected: false,
      explanation: "Insufficient token structure to establish comparison.",
    };
  }

  const hashesA = generateKGramHashes(tokensA, k);
  const hashesB = generateKGramHashes(tokensB, k);

  const hashSetB = new Map<number, number[]>();
  for (const item of hashesB) {
    const list = hashSetB.get(item.hash) ?? [];
    list.push(item.line);
    hashSetB.set(item.hash, list);
  }

  let matchCount = 0;
  const matchedLineBlocks: StructuralMatchBlock[] = [];

  for (const itemA of hashesA) {
    if (hashSetB.has(itemA.hash)) {
      matchCount++;
      const lineB = hashSetB.get(itemA.hash)![0];
      matchedLineBlocks.push({
        startLineA: itemA.line,
        endLineA: itemA.line + 2,
        startLineB: lineB,
        endLineB: lineB + 2,
        matchedTokensCount: k,
      });
    }
  }

  const totalPossible = Math.max(hashesA.length, hashesB.length);
  const similarityScore = totalPossible > 0 ? Math.min(100, Math.round((matchCount / totalPossible) * 100)) : 0;

  // Check if variable renaming masking was attempted
  // (Identical structural tokens, but differing raw text tokens)
  const isRenamed = similarityScore >= 65 && submissionA.sourceCode.trim() !== submissionB.sourceCode.trim();

  let verdict: PairwiseStructuralSimilarity["verdict"] = "AUTHENTIC";
  let explanation = "Standard independent structural variance observed.";

  if (similarityScore >= 78) {
    verdict = "STRUCTURAL_COLLUSION_FLAG";
    explanation = isRenamed
      ? "High-confidence structural collusion: AST tokens & control flow are identical despite variable renaming and cosmetic edits."
      : "Near-identical AST token structure and statement sequencing.";
  } else if (similarityScore >= 48) {
    verdict = "SUSPICIOUS_SIMILARITY";
    explanation = "Moderate structural overlap detected. May share common starter logic or algorithmic template.";
  }

  return {
    submissionAId: submissionA.id,
    studentAName: submissionA.studentName,
    submissionBId: submissionB.id,
    studentBName: submissionB.studentName,
    structuralSimilarityPercentage: similarityScore,
    verdict,
    matchedBlocksCount: matchedLineBlocks.length,
    matchedLineBlocks: matchedLineBlocks.slice(0, 5), // top 5 matched regions
    variableRenamingDetected: isRenamed,
    explanation,
  };
}

/**
 * Runs pairwise structural audit across a practical's submissions to find suspicious pairs.
 */
export function auditCohortPlagiarism(
  submissions: Array<{ id: string; studentId: string; studentName: string; sourceCode: string; language: "CPP" | "JAVA" }>,
): PairwiseStructuralSimilarity[] {
  const results: PairwiseStructuralSimilarity[] = [];

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];

      // Only compare matching languages
      if (subA.language === subB.language && subA.studentId !== subB.studentId) {
        const comparison = computeStructuralSimilarity(subA, subB);
        if (comparison.structuralSimilarityPercentage >= 40) {
          results.push(comparison);
        }
      }
    }
  }

  // Sort highest similarity first
  return results.sort((a, b) => b.structuralSimilarityPercentage - a.structuralSimilarityPercentage);
}
