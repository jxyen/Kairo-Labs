// Batch Test Ledger — the single source of truth for Kairo Labs' published
// third-party lab results. ONE entry per production lot, each backed by a real
// Certificate of Analysis (COA) from an accredited independent lab.
//
// TRUST RULE (read before editing): only ever add an entry here when a REAL COA
// exists for that lot. Never publish a purity figure, lab name, verify link, or
// report number that isn't backed by an actual analytical report — a fabricated
// result is worse than an empty ledger and is a compliance risk. Drop the COA
// PDF in public/coa/<lot>.pdf and, where the lab offers public verification
// (e.g. Janoshik), include verifyUrl + reportNumber so a researcher can confirm
// the document independently. Report the purity string VERBATIM from the COA.

export interface BatchTest {
  /** Lot / batch number printed on the vial label. The lookup key. */
  lot: string;
  /** Product this lot belongs to (display name). */
  productName: string;
  /** Compound assayed, e.g. "BPC-157". */
  compound: string;
  /** Optional product page slug for a cross-link. */
  productSlug?: string;
  /** Independent testing lab, e.g. "Janoshik Analytical". */
  lab: string;
  /** Analytical method(s), e.g. "HPLC-MS (purity + identity)". */
  method: string;
  /** Measured purity exactly as reported on the COA, e.g. "99.1%". Verbatim. */
  assayPurity: string;
  /** ISO date the report was issued (YYYY-MM-DD). */
  testDate: string;
  /** Path/URL to the COA document, e.g. "/coa/KL-BPC-2408.pdf". */
  coaUrl: string;
  /** The lab's own public verification URL, if the lab offers one. */
  verifyUrl?: string;
  /** The lab's report / reference number. */
  reportNumber?: string;
}

// Populate as real COAs come in. Empty is honest for a young program — the page
// renders a "testing rolling out" state until the first lot is published.
//
// Example shape (do NOT uncomment until a real COA backs it):
// {
//   lot: "KL-BPC-2408",
//   productName: "BPC-157 10mg",
//   compound: "BPC-157",
//   productSlug: "bpc-157",
//   lab: "Janoshik Analytical",
//   method: "HPLC-MS (purity + identity)",
//   assayPurity: "99.1%",
//   testDate: "2026-08-01",
//   coaUrl: "/coa/KL-BPC-2408.pdf",
//   verifyUrl: "https://janoshik.com/verify/XXXXX",
//   reportNumber: "XXXXX",
// },
export const BATCH_TESTS: BatchTest[] = [];

/** Look up a published batch by its lot number or lab report number. */
export function findBatch(query: string): BatchTest | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return BATCH_TESTS.find(
    (b) => b.lot.toLowerCase() === q || b.reportNumber?.toLowerCase() === q,
  );
}

/** Newest-first, for the ledger table. */
export function ledgerRows(): BatchTest[] {
  return [...BATCH_TESTS].sort((a, b) => b.testDate.localeCompare(a.testDate));
}

export const LEDGER_LAB = "Janoshik Analytical";
