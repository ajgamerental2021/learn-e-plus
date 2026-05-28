// Simple SM-2-inspired spaced repetition
// correctCount/incorrectCount → compute nextReviewAt

export function computeNextReview(
  correctCount: number,
  incorrectCount: number,
  wasCorrect: boolean
): { nextReviewAt: Date; status: "NEW" | "LEARNING" | "MASTERED" } {
  const total = correctCount + incorrectCount + 1;
  const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
  const newIncorrect = wasCorrect ? incorrectCount : incorrectCount + 1;
  const accuracy = total > 0 ? newCorrect / total : 0;

  const now = new Date();
  let intervalHours: number;
  let status: "NEW" | "LEARNING" | "MASTERED";

  if (!wasCorrect) {
    // Reset: review again in 10 minutes
    intervalHours = 1 / 6;
    status = "LEARNING";
  } else if (newCorrect === 1) {
    intervalHours = 1;         // 1 hour
    status = "LEARNING";
  } else if (newCorrect === 2) {
    intervalHours = 8;         // 8 hours
    status = "LEARNING";
  } else if (accuracy >= 0.8 && newCorrect >= 3) {
    intervalHours = 24 * 3;    // 3 days
    status = "MASTERED";
  } else if (accuracy >= 0.6) {
    intervalHours = 24;        // 1 day
    status = "LEARNING";
  } else {
    intervalHours = 4;
    status = "LEARNING";
  }

  const nextReviewAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
  return { nextReviewAt, status };
}
