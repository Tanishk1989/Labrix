import type {
  AIReviewBriefContentV1,
  AIReviewBriefInputV1,
  AIReviewBriefProvider,
} from "./review-brief-provider";

function sourceStructure(source: string) {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ");
  const loopCount = (code.match(/\b(for|while)\s*\(/g) ?? []).length;
  return {
    usesMap: /\b(HashMap|Map\s*<|unordered_map\s*<)/.test(code),
    usesSet: /\b(HashSet|Set\s*<|unordered_set\s*<)/.test(code),
    usesSort: /\b(sort|Arrays\.sort|Collections\.sort)\s*\(/.test(code),
    loopCount,
  };
}

function availableSummary(
  fact: AIReviewBriefInputV1["resultSummary"]["overall"],
) {
  return fact.availability === "AVAILABLE"
    ? `${fact.value.passed}/${fact.value.total} passed`
    : "unavailable";
}

export class FakeAIReviewBriefProvider implements AIReviewBriefProvider {
  readonly descriptor = {
    provider: "fake",
    model: "deterministic-review-brief-v1",
  } as const;

  async generateBrief(
    input: AIReviewBriefInputV1,
  ): Promise<AIReviewBriefContentV1> {
    const structure = sourceStructure(input.submittedSource);
    const languageLabel = input.language === "CPP" ? "C++" : "Java";
    const primaryTechnique = structure.usesMap
      ? "a key-to-value lookup structure"
      : structure.usesSet
        ? "a set for membership tracking"
        : structure.usesSort
          ? "sorting before the main decision logic"
          : structure.loopCount > 1
            ? "multiple iterative passes"
            : structure.loopCount === 1
              ? "a single iterative pass"
              : "direct control flow";

    const likelyBugsOrEdgeCases = [
      structure.usesMap
        ? "Check how duplicate keys and a missing lookup result are handled before returning an answer."
        : structure.usesSet
          ? "Check whether duplicate values and repeated membership checks preserve the intended result."
          : "Check empty, minimum-size, and maximum-size inputs against each return path.",
      structure.loopCount > 1
        ? "Review loop bounds and whether nested or repeated iteration can revisit or skip an element."
        : "Review boundary conditions around the main decision branch and final fallback return.",
    ];

    if (
      input.resultSummary.hidden.availability === "AVAILABLE" &&
      input.resultSummary.hidden.value.passed <
        input.resultSummary.hidden.value.total
    ) {
      likelyBugsOrEdgeCases.push(
        `Use a teacher-chosen edge case to investigate the hidden aggregate of ${availableSummary(input.resultSummary.hidden)}; hidden inputs and outputs are not included in this brief.`,
      );
    }

    const evidenceExplanation = input.integritySignal.reasons.length
      ? input.integritySignal.reasons.map(
          (item) =>
            `Deterministic review reason: ${item.text} This is a prompt for teacher review, not a conclusion about intent.`,
        )
      : [
          "No configured integrity-review reason was derived from the available deterministic facts. This does not replace teacher review.",
        ];
    evidenceExplanation.push(
      `Stored result summary: overall ${availableSummary(input.resultSummary.overall)}, visible ${availableSummary(input.resultSummary.visible)}, and hidden ${availableSummary(input.resultSummary.hidden)}.`,
    );

    const techniqueQuestion = structure.usesMap
      ? "Why did you choose a lookup map here, and what value is stored for each key?"
      : structure.usesSet
        ? "Why did you choose a set here, and what invariant does membership represent?"
        : structure.usesSort
          ? "Why is sorting useful to this implementation, and what ordering invariant does the later logic rely on?"
          : "Walk through the main control-flow path using one representative input.";

    return {
      schemaVersion: 1,
      approachSummary: `For "${input.practical.title}", the ${languageLabel} submission appears to organize its solution around ${primaryTechnique}. This is a structural draft for teacher verification against the submitted source, not a claim about correctness or authorship.`,
      likelyBugsOrEdgeCases,
      evidenceExplanation,
      vivaQuestions: [
        {
          question: techniqueQuestion,
          expectedAnswerBullets: [
            `Identify the role of ${primaryTechnique} in the submitted implementation.`,
            "Trace how an input value moves through that structure or control-flow path.",
          ],
        },
        {
          question:
            "What are the time and space costs of this exact implementation, and which operation dominates?",
          expectedAnswerBullets: [
            structure.loopCount > 1
              ? "Account for each loop and explain whether iterations are nested or sequential."
              : "Account for the main pass and any lookup, insertion, or sorting operation.",
            "State the auxiliary space used by the submitted data structures.",
          ],
        },
        {
          question:
            "Which boundary or duplicate-value case is most likely to expose a defect here, and how would you test it?",
          expectedAnswerBullets: [
            "Name one concrete input and its expected output.",
            "Connect the case to a specific branch, lookup, or loop boundary in the submission.",
          ],
        },
      ],
      modificationTask: structure.usesMap || structure.usesSet
        ? "Ask the student to adapt the solution so it reports when no valid answer exists, while preserving the current lookup-based approach and explaining the changed invariant."
        : "Ask the student to add an explicit no-solution path and one boundary-case test, then explain which control-flow branch changed.",
      feedbackDraft: `The submission presents a recognizable ${languageLabel} approach using ${primaryTechnique}. Before final feedback, verify the boundary cases and ask the student to explain the dominant complexity in their own words. The deterministic evidence and test summaries should guide questions only; marks and published feedback remain the teacher's decision.`,
    };
  }
}
