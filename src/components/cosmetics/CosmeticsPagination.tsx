"use client";

import { useTranslations } from "next-intl";

function buildPaginationItems(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const items: Array<number | "..."> = [1];
  let left = Math.max(2, currentPage - 1);
  let right = Math.min(totalPages - 1, currentPage + 1);
  if (currentPage <= 3) {
    left = 2;
    right = 4;
  } else if (currentPage >= totalPages - 2) {
    left = totalPages - 3;
    right = totalPages - 1;
  }
  if (left > 2) items.push("...");
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push("...");
  items.push(totalPages);
  return items;
}

const BUTTON =
  "rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50";

/** Pagination des listes de cosmétiques (même rendu que les autres listes du site). */
export default function CosmeticsPagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizes,
  rangeLabel,
  onPage,
  onPageSize,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizes: readonly number[];
  rangeLabel: string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const tc = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-panel/50 p-3">
      <p className="text-sm text-parch/85">{rangeLabel}</p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onPage(1)} disabled={currentPage === 1} className={BUTTON} aria-label={tc("paginationFirst")}>
            {"<<"}
          </button>
          <button
            type="button"
            onClick={() => onPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={BUTTON}
            aria-label={tc("paginationPrevious")}
          >
            {"<"}
          </button>
          {buildPaginationItems(currentPage, totalPages).map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-2" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPage(page)}
                className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                  page === currentPage
                    ? "border-gold/70 bg-gold/25 text-gold"
                    : "border-white/10 text-parch hover:border-gold/40 hover:text-parch"
                }`}
                aria-label={tc("paginationGoTo", { page })}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={BUTTON}
            aria-label={tc("paginationNext")}
          >
            {">"}
          </button>
          <button
            type="button"
            onClick={() => onPage(totalPages)}
            disabled={currentPage === totalPages}
            className={BUTTON}
            aria-label={tc("paginationLast")}
          >
            {">>"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-muted">{tc("perPage")}</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            aria-label={tc("perPage")}
            className="rounded-sm border border-white/10 bg-panel px-2 py-1 text-xs text-parch"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
