/**
 * Deprecated: the 4-agent stack was reduced to a 2-agent stack.
 * Use runExtractionAgent → validation/calculation → runExplanationAgent instead.
 */
export async function runCombinedAgent() {
  throw new Error("Combined agent removed; use Extraction + Explanation agents");
}
