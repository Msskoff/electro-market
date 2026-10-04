"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { EditorStatus } from "./useDraftEditor";

const time = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(iso)) : "";

/** Pastille d'état toujours visible (lue par les lecteurs d'écran à chaque changement). */
export function SaveStatus({ status }: { status: EditorStatus }) {
  const view = {
    dirty: { dot: "bg-warning", text: "Modifications non enregistrées", tone: "text-warning" },
    saving: { dot: "bg-accent animate-pulse", text: "Enregistrement du brouillon…", tone: "text-fg" },
    draft: {
      dot: "bg-accent",
      text: `Brouillon enregistré${status.kind === "draft" && status.at ? ` (${time(status.at)})` : ""} — pas encore en ligne`,
      tone: "text-accent",
    },
    publishing: { dot: "bg-signal animate-pulse", text: "Mise en ligne…", tone: "text-fg" },
    published: {
      dot: "bg-signal",
      text: `En ligne${status.kind === "published" && status.at ? ` — publié le ${time(status.at)}` : ""}`,
      tone: "text-signal",
    },
    error: { dot: "bg-danger", text: status.kind === "error" ? status.message : "", tone: "text-danger" },
  }[status.kind];

  return (
    <p role="status" aria-live="polite" className={cn("flex min-w-0 items-center gap-2 text-sm font-semibold", view.tone)}>
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", view.dot)} />
      <span className="min-w-0">{view.text}</span>
    </p>
  );
}

/**
 * Barre d'actions collante en bas de l'éditeur :
 * « Enregistrer le brouillon » (local, invisible du public) puis « Publier » (en ligne).
 */
export function SaveBar({
  status,
  pending,
  canPublish,
  hasDraft,
  dirty,
  onSave,
  onPublish,
  onDiscard,
  discardLabel = "Annuler les modifications",
  viewHref,
  extra,
}: {
  status: EditorStatus;
  pending: boolean;
  canPublish: boolean;
  hasDraft: boolean;
  dirty: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDiscard?: () => void;
  discardLabel?: string;
  viewHref?: string | null;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-20 z-30 mt-6 lg:bottom-4">
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-2.5 shadow-lg ring-1 ring-border sm:gap-3 sm:p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <SaveStatus status={status} />
        <div className="flex items-center gap-1.5 sm:flex-wrap sm:gap-2">
          {extra}
          {viewHref && (
            <Link
              href={viewHref}
              target="_blank"
              aria-label="Voir en ligne (nouvel onglet)"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg sm:px-4"
            >
              <Icon name="eye" size={18} />
              <span className="hidden sm:inline">Voir en ligne</span>
            </Link>
          )}
          {onDiscard && (hasDraft || dirty) && (
            <button
              type="button"
              disabled={pending}
              onClick={onDiscard}
              className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50 sm:px-4"
            >
              <span className="sm:hidden">Annuler</span>
              <span className="hidden sm:inline">{discardLabel}</span>
            </button>
          )}
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={onSave}
            aria-keyshortcuts="Control+S"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border-strong px-4 text-sm font-semibold transition-colors hover:border-fg disabled:opacity-50 sm:flex-none sm:px-5"
          >
            <Icon name="check" size={18} />
            <span className="sm:hidden">Brouillon</span>
            <span className="hidden sm:inline">Enregistrer le brouillon</span>
          </button>
          <button
            type="button"
            disabled={pending || !canPublish}
            onClick={onPublish}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50 sm:flex-none sm:px-5"
          >
            <Icon name="upload" size={18} />
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}
