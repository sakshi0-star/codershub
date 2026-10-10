"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { DemoSettings, Verification } from "@/lib/types";

interface Ctx {
  verification: Verification | undefined;
  settings: DemoSettings | undefined;
  /** Bumped when demo controls change so pages re-fetch */
  version: number;
  refresh: () => Promise<void>;
  setVerification: (v: Verification) => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [verification, setVerification] = useState<Verification>();
  const [settings, setSettings] = useState<DemoSettings>();
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const s = await api<{ settings: DemoSettings; verification: Verification }>("/api/demo/state");
      setSettings(s.settings);
      setVerification(s.verification);
    } catch {
      /* shell degrades gracefully: verification stays unknown */
    }
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ verification, settings, version, refresh, setVerification }), [verification, settings, version, refresh]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
