"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/actions";
import type { PublishState } from "@/lib/admin/queries";

/**
 * État d'une modification, affiché en permanence à l'administrateur :
 *  dirty       → modifié dans la page, rien n'est encore enregistré
 *  saving      → enregistrement du brouillon en cours
 *  draft       → brouillon enregistré en base, PAS encore en ligne
 *  publishing  → mise en ligne en cours
 *  published   → en ligne (le public voit cette version)
 *  error       → l'opération a échoué (message)
 */
export type EditorStatus =
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "draft"; at: string | null }
  | { kind: "publishing" }
  | { kind: "published"; at: string | null }
  | { kind: "error"; message: string };

type SaveResult = ActionResult<{ savedAt: string }>;

export function useDraftEditor<T>({
  initial,
  initialState,
  draftSavedAt,
  publishedAt,
  save,
  publish,
  discard,
}: {
  initial: T;
  initialState: PublishState;
  draftSavedAt: string | null;
  publishedAt: string | null;
  save: (value: T) => Promise<SaveResult>;
  publish: () => Promise<ActionResult<{ publishedAt: string }>>;
  discard?: () => Promise<ActionResult>;
}) {
  const [value, setValue] = useState<T>(initial);
  const [saved, setSaved] = useState<string>(() => JSON.stringify(initial));
  const [hasDraft, setHasDraft] = useState(initialState !== "published");
  const [lastStatus, setLastStatus] = useState<EditorStatus>(() =>
    initialState === "published" ? { kind: "published", at: publishedAt } : { kind: "draft", at: draftSavedAt },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"saving" | "publishing" | null>(null);

  const dirty = JSON.stringify(value) !== saved;
  const status: EditorStatus = busy ? { kind: busy } : dirty && lastStatus.kind !== "error" ? { kind: "dirty" } : lastStatus;

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const doSave = useCallback(async (): Promise<boolean> => {
    const snapshot = valueRef.current;
    setBusy("saving");
    const result = await save(snapshot);
    setBusy(null);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      setLastStatus({ kind: "error", message: result.error });
      return false;
    }
    setErrors({});
    setSaved(JSON.stringify(snapshot));
    setHasDraft(true);
    setLastStatus({ kind: "draft", at: result.savedAt });
    return true;
  }, [save]);

  const onSave = useCallback(() => startTransition(async () => void (await doSave())), [doSave]);

  const onPublish = useCallback(
    () =>
      startTransition(async () => {
        if (JSON.stringify(valueRef.current) !== saved && !(await doSave())) return;
        setBusy("publishing");
        const result = await publish();
        setBusy(null);
        if (!result.ok) {
          setLastStatus({ kind: "error", message: result.error });
          return;
        }
        setHasDraft(false);
        setLastStatus({ kind: "published", at: result.publishedAt });
      }),
    [doSave, publish, saved],
  );

  const onDiscard = useCallback(
    (restore: T) =>
      startTransition(async () => {
        if (!discard) return;
        const result = await discard();
        if (!result.ok) {
          setLastStatus({ kind: "error", message: result.error });
          return;
        }
        setValue(restore);
        setSaved(JSON.stringify(restore));
        setHasDraft(false);
        setErrors({});
        setLastStatus({ kind: "published", at: publishedAt });
      }),
    [discard, publishedAt],
  );

  // Ne jamais perdre une saisie : avertissement à la fermeture de l'onglet.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Ctrl/Cmd + S : enregistrer le brouillon.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave]);

  return {
    value,
    setValue,
    status,
    errors,
    dirty,
    hasDraft,
    pending: pending || busy !== null,
    canPublish: dirty || hasDraft,
    onSave,
    onPublish,
    onDiscard,
    doSave,
  };
}
