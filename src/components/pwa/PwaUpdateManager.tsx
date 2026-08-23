"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCw, X } from "lucide-react";

export function PwaUpdateManager() {
  const [initialBuildId, setInitialBuildId] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isCheckingRef = useRef(false);

  // Check version against /api/version
  const checkForUpdates = useCallback(async (currentId: string | null) => {
    if (isCheckingRef.current || !navigator.onLine) return;
    isCheckingRef.current = true;

    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.buildId) {
          if (!currentId) {
            setInitialBuildId(data.buildId);
          } else if (data.buildId !== currentId) {
            setHasUpdate(true);
          }
        }
      }
    } catch (err) {
      // Silently ignore network errors during background check
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkForUpdates(null);
  }, [checkForUpdates]);

  // Setup standby, visibility change, and periodic listeners
  useEffect(() => {
    if (!initialBuildId) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates(initialBuildId);
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      // iOS bfcache (back-forward cache) restoration
      if (e.persisted) {
        checkForUpdates(initialBuildId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("pageshow", handlePageShow);

    // Periodic check every 4 minutes
    const interval = setInterval(() => {
      checkForUpdates(initialBuildId);
    }, 4 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handlePageShow);
      clearInterval(interval);
    };
  }, [initialBuildId, checkForUpdates]);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    // Hard reload to bypass webview cache
    window.location.reload();
  };

  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="App-Aktualisierung verfügbar"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="bg-[#0f4851] text-white border border-[#00A8BC]/40 shadow-2xl p-3.5 sm:p-4 rounded-none flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-none bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="size-4 text-[#00A8BC] animate-pulse" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white truncate">
              Neue Version verfügbar
            </p>
            <p className="text-[11px] text-white/80 leading-tight">
              Tippen zum Laden der neuesten Änderungen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="bg-[#00A8BC] hover:bg-[#0092a4] text-white text-xs font-bold uppercase tracking-wider h-8 px-3 rounded-none shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className={`size-3.5 ${isUpdating ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isUpdating ? "Lädt…" : "Laden"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="size-8 text-white/70 hover:text-white hover:bg-white/10 rounded-none cursor-pointer"
            aria-label="Hinweis schließen"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
