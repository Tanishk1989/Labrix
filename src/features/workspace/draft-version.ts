import type { AllowedLanguage } from "@prisma/client";

export interface DraftVersion {
  sourceCode: string;
  language: AllowedLanguage;
}

export function draftVersionChanged(
  persisted: DraftVersion,
  current: DraftVersion,
) {
  return (
    persisted.sourceCode !== current.sourceCode ||
    persisted.language !== current.language
  );
}
