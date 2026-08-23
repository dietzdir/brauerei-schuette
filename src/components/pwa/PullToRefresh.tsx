"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";

const PULL_THRESHOLD = 65; // pixels required to trigger refresh
const MAX_PULL = 110;      // maximum pull distance

export function PullToRefresh({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);

    // Provide subtle haptic feedback on supported devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }

    try {
      // Refresh server components and revalidate cache
      router.refresh();

      // Wait a moment for smooth animation experience
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    // Only run on touch devices / clients
    if (typeof window === "undefined") return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh if scroll is at top
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop <= 2 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        currentYRef.current = e.touches[0].clientY;
        setCanPull(true);
      } else {
        setCanPull(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      if (scrollTop <= 2 && startYRef.current > 0) {
        currentYRef.current = e.touches[0].clientY;
        const rawDy = currentYRef.current - startYRef.current;

        if (rawDy > 0) {
          // User is dragging downwards from the top of the page
          isPullingRef.current = true;
          // Apply rubber-band damping resistance
          const dampedDistance = Math.min(MAX_PULL, rawDy * 0.45);
          setPullDistance(dampedDistance);

          // Prevent default only when actively pulling down to stop unwanted viewport jank
          if (rawDy > 10 && e.cancelable) {
            e.preventDefault();
          }
        } else {
          setPullDistance(0);
          isPullingRef.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPullingRef.current && !isRefreshing) {
        if (pullDistance >= PULL_THRESHOLD) {
          triggerRefresh();
        } else {
          // Snap back smoothly
          setPullDistance(0);
          isPullingRef.current = false;
        }
      }
      startYRef.current = 0;
      setCanPull(false);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, triggerRefresh]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const isPastThreshold = pullDistance >= PULL_THRESHOLD;

  return (
    <>
      {/* Pull-to-Refresh Indicator Banner */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 48)}px)`,
          transition: isPullingRef.current ? "none" : "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        aria-hidden={pullDistance === 0 && !isRefreshing}
      >
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-none border shadow-md backdrop-blur-md transition-all duration-200 ${
            isPastThreshold || isRefreshing
              ? "bg-[#0f4851] text-white border-[#00A8BC]"
              : "bg-white/95 text-[#0f4851] border-[#c8d3d5]"
          }`}
        >
          <div className="size-4 flex items-center justify-center">
            {isRefreshing ? (
              <RotateCw className="size-3.5 animate-spin text-[#00A8BC]" aria-hidden="true" />
            ) : (
              <RotateCw
                className="size-3.5 transition-transform duration-100"
                style={{
                  transform: `rotate(${progress * 270}deg)`,
                  color: isPastThreshold ? "#00A8BC" : "#505c5f",
                }}
                aria-hidden="true"
              />
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider tabular-nums select-none">
            {isRefreshing
              ? "Wird aktualisiert…"
              : isPastThreshold
              ? "Loslassen zum Aktualisieren"
              : "Ziehen zum Aktualisieren"}
          </span>
        </div>
      </div>

      {children}
    </>
  );
}
