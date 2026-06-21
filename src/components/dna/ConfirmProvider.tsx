"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { DnaConfirmDialog } from "./Dialog";

/**
 * Fournisseur impératif de dialogues du design system. Permet de remplacer les
 * natifs `window.confirm` / `window.alert` :
 *   const { confirm } = useConfirm();
 *   if (await confirm({ title, message, danger: true })) { ...action... }
 */
type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type AlertOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type DialogState = (ConfirmOptions & { mode: "confirm" | "alert" }) | null;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({ ...options, mode: "confirm" });
      }),
    [],
  );

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        resolver.current = () => resolve();
        setState({ ...options, mode: "alert" });
      }),
    [],
  );

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <DnaConfirmDialog
        open={state !== null}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        danger={state?.danger}
        showCancel={state?.mode === "confirm"}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé dans un <ConfirmProvider>.");
  return ctx;
}
