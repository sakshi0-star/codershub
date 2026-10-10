"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "@/lib/format";

type Kind = "success" | "error" | "info";
interface T {
  id: number;
  kind: Kind;
  text: string;
}
const ToastCtx = createContext<(kind: Kind, text: string) => void>(() => {});
export const useToast = () => {
  const push = useContext(ToastCtx);
  return { success: (t: string) => push("success", t), error: (t: string) => push("error", t), info: (t: string) => push("info", t) };
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3" aria-live="polite" role="status">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex max-w-md animate-rise items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
              t.kind === "success" && "bg-ok text-white",
              t.kind === "error" && "bg-danger text-white",
              t.kind === "info" && "bg-ink text-white"
            )}
          >
            <span>{t.text}</span>
            <button className="-mr-1 ml-2 rounded px-1 opacity-80 hover:opacity-100" aria-label="Dismiss" onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
