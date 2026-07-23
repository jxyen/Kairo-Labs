"use client";

import { useState } from "react";
import Link from "next/link";
import { findBatch, type BatchTest } from "@/lib/batches";

// The COA verify component: a researcher types the lot number printed on their
// vial and gets that lot's published Certificate of Analysis — or an honest
// "not published yet" state. All lookup is client-side against the static
// ledger; no network call, no data collected.
export function BatchLookup() {
  const [query, setQuery] = useState("");
  // undefined = not searched yet; null = searched, no match; object = found.
  const [result, setResult] = useState<BatchTest | null | undefined>(undefined);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(findBatch(query) ?? null);
  }

  return (
    <div className="bt-verify">
      <form className="bt-verify-form" onSubmit={submit}>
        <label className="bt-verify-label" htmlFor="bt-lot">
          Verify a lot number
        </label>
        <div className="bt-verify-row">
          <input
            id="bt-lot"
            className="bt-verify-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="e.g. KL-BPC-2408"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby="bt-verify-hint"
          />
          <button type="submit" className="btn btn-emerald bt-verify-btn">
            Verify
          </button>
        </div>
        <p id="bt-verify-hint" className="bt-verify-hint">
          Enter the lot number printed on your vial to pull its Certificate of Analysis.
        </p>
      </form>

      {result === null && (
        <div className="bt-result bt-result-empty" role="status">
          <strong>No published COA for that lot yet.</strong>
          <p>
            Double-check the lot number against your vial. If it&apos;s correct and still not
            listed, the report may be in progress —{" "}
            <Link href="/research/verification/certificate-of-analysis">
              here&apos;s how COAs and lot testing work
            </Link>
            . Every published lot appears in the ledger below.
          </p>
        </div>
      )}

      {result && (
        <div className="bt-result bt-result-found" role="status">
          <div className="bt-result-head">
            <span className="pill pill-emerald">Verified lot</span>
            <span className="bt-result-lot">{result.lot}</span>
          </div>
          <dl className="bt-result-grid">
            <div>
              <dt>Product</dt>
              <dd>
                {result.productSlug ? (
                  <Link href={`/product/${result.productSlug}`}>{result.productName}</Link>
                ) : (
                  result.productName
                )}
              </dd>
            </div>
            <div>
              <dt>Assay purity</dt>
              <dd className="bt-result-purity">{result.assayPurity}</dd>
            </div>
            <div>
              <dt>Lab</dt>
              <dd>{result.lab}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{result.method}</dd>
            </div>
            <div>
              <dt>Report date</dt>
              <dd>{result.testDate}</dd>
            </div>
            {result.reportNumber && (
              <div>
                <dt>Report #</dt>
                <dd>{result.reportNumber}</dd>
              </div>
            )}
          </dl>
          <div className="bt-result-links">
            <a href={result.coaUrl} className="btn btn-dark bt-result-coa" target="_blank" rel="noopener noreferrer">
              View COA (PDF)
            </a>
            {result.verifyUrl && (
              <a href={result.verifyUrl} className="bt-result-verify" target="_blank" rel="noopener noreferrer">
                Confirm at {result.lab} &rarr;
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
