/**
 * Deprecated: QA/Adjudicator was removed in the 2-agent architecture.
 * Downstream code should rely on deterministic validation + derived confidence.
 */
export async function runQaAgent() {
  throw new Error("QA agent removed; derive confidence from parseConfidence + validation cleanliness");
}
