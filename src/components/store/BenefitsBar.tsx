import React from "react";
import { Truck, Clock, ShieldCheck } from "lucide-react";

export function BenefitsBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
      <div className="hidden sm:flex items-center gap-3 p-4 rounded-none border border-border bg-white shadow-2xs">
        <div className="size-10 rounded-none bg-primary text-accent flex items-center justify-center shrink-0">
          <Truck className="size-5" />
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-primary">Flexible Gebinde</h4>
          <p className="text-[11px] text-muted-foreground">Vom 6er-Träger bis zum 50l Fass</p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 p-4 rounded-none border border-border bg-white shadow-2xs">
        <div className="size-10 rounded-none bg-primary text-accent flex items-center justify-center shrink-0">
          <Clock className="size-5" />
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-primary">Werksverkauf</h4>
          <p className="text-[11px] text-accent font-bold">Freitags 14:00 – 19:00 Uhr</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-none border border-border bg-white shadow-2xs">
        <div className="size-10 rounded-none bg-primary text-accent flex items-center justify-center shrink-0">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-primary">Einfache Vorbestellung</h4>
          <p className="text-[11px] text-muted-foreground">Direkt online als Gast oder Stammkunde</p>
        </div>
      </div>
    </div>
  );
}
