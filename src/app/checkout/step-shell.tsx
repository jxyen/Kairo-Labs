"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "./checkout-icons";
import type { StepStatus } from "./checkout-types";

/**
 * One numbered step card in the checkout accordion. The parent decides what to
 * render as children (the open body when `status === "active"`, the collapsed
 * read-only summary when `"done"`). `onEdit` is shown only for completed steps.
 */
export function StepShell({
  index,
  title,
  status,
  onEdit,
  children,
}: {
  index: number;
  title: string;
  status: StepStatus;
  onEdit?: () => void;
  children?: ReactNode;
}) {
  const done = status === "done";
  const locked = status === "locked";

  return (
    <section className="co-step co-card" data-status={status}>
      <header className="co-step-head">
        <span className="co-badge" data-state={status}>
          {index}
        </span>
        <h2 className="co-step-title">{title}</h2>
        {done && (
          <span className="co-step-check" aria-label="completed">
            <CheckIcon size={13} />
          </span>
        )}
        {done && onEdit && (
          <button type="button" className="co-edit" onClick={onEdit}>
            Edit
          </button>
        )}
      </header>
      {!locked && children}
    </section>
  );
}
