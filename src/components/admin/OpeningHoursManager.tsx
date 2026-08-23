"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StoreSettings, OpeningHourException, OpeningHourExceptionType } from "@/types";
import {
  DEFAULT_STORE_SETTINGS,
  subscribeStoreSettings,
  saveStoreSettings,
  calculatePickupSlots,
} from "@/lib/openingHours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  CalendarDays,
  Sparkles,
  Info,
} from "lucide-react";

const WEEKDAY_OPTIONS = [
  { value: "1", label: "Montag" },
  { value: "2", label: "Dienstag" },
  { value: "3", label: "Mittwoch" },
  { value: "4", label: "Donnerstag" },
  { value: "5", label: "Freitag" },
  { value: "6", label: "Samstag" },
  { value: "0", label: "Sonntag" },
];

export function OpeningHoursManager() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State for regular hours & banner
  const [regularDayOfWeek, setRegularDayOfWeek] = useState<number>(5);
  const [regularOpenTime, setRegularOpenTime] = useState("14:00");
  const [regularCloseTime, setRegularCloseTime] = useState("19:00");
  const [bannerLookaheadDays, setBannerLookaheadDays] = useState<number>(14);

  // Sheet State for Exception Create/Edit
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExceptionId, setEditingExceptionId] = useState<string | null>(null);
  const [exDate, setExDate] = useState("");
  const [exType, setExType] = useState<OpeningHourExceptionType>("closed");
  const [exOpenTime, setExOpenTime] = useState("14:00");
  const [exCloseTime, setExCloseTime] = useState("19:00");
  const [exNote, setExNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeStoreSettings((data) => {
      setSettings(data);
      setRegularDayOfWeek(data.regularDayOfWeek ?? 5);
      setRegularOpenTime(data.regularOpenTime || "14:00");
      setRegularCloseTime(data.regularCloseTime || "19:00");
      setBannerLookaheadDays(data.bannerLookaheadDays ?? 14);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isRegularDay = useMemo(() => {
    if (!exDate) return true;
    const [y, m, d] = exDate.split("-");
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.getDay() === regularDayOfWeek;
  }, [exDate, regularDayOfWeek]);

  useEffect(() => {
    if (sheetOpen) {
      if (isRegularDay && exType === "special_open") {
        setExType("closed");
      } else if (!isRegularDay && exType !== "special_open") {
        setExType("special_open");
      }
    }
  }, [isRegularDay, sheetOpen]);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: StoreSettings = {
        ...settings,
        regularDayOfWeek,
        regularOpenTime,
        regularCloseTime,
        bannerLookaheadDays,
      };
      await saveStoreSettings(updated);
      toast.success("Reguläre Öffnungszeiten erfolgreich gespeichert!");
    } catch (err: any) {
      console.error(err);
      toast.error("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openNewExceptionSheet = () => {
    setEditingExceptionId(null);
    // Suggest next Friday or today as date
    const today = new Date().toISOString().split("T")[0];
    setExDate(today);
    setExType("closed");
    setExOpenTime(regularOpenTime || "14:00");
    setExCloseTime(regularCloseTime || "19:00");
    setExNote("");
    setFormError(null);
    setSheetOpen(true);
  };

  const openEditExceptionSheet = (ex: OpeningHourException) => {
    setEditingExceptionId(ex.id);
    setExDate(ex.date);
    setExType(ex.type);
    setExOpenTime(ex.openTime || regularOpenTime || "14:00");
    setExCloseTime(ex.closeTime || regularCloseTime || "19:00");
    setExNote(ex.note || "");
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exDate) {
      setFormError("Bitte wählen Sie ein Datum aus.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const newException: OpeningHourException = {
        id: editingExceptionId || "ex_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        date: exDate,
        type: exType,
      };

      if (exType !== "closed") {
        newException.openTime = exOpenTime;
        newException.closeTime = exCloseTime;
      }
      
      if (exNote.trim()) {
        newException.note = exNote.trim();
      }

      const existingExceptions = settings.exceptions || [];
      let updatedExceptions: OpeningHourException[];

      if (editingExceptionId) {
        updatedExceptions = existingExceptions.map((item) =>
          item.id === editingExceptionId ? newException : item
        );
      } else {
        // Remove if duplicate date exists, then add
        updatedExceptions = [
          ...existingExceptions.filter((item) => item.date !== exDate),
          newException,
        ];
      }

      // Sort exceptions by date
      updatedExceptions.sort((a, b) => a.date.localeCompare(b.date));

      const updatedSettings: StoreSettings = {
        ...settings,
        exceptions: updatedExceptions,
      };

      await saveStoreSettings(updatedSettings);
      setSheetOpen(false);
      toast.success(
        editingExceptionId
          ? "Ausnahmetermin aktualisiert."
          : "Neuer Ausnahmetermin hinzugefügt."
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Fehler beim Speichern: " + err.message);
      setFormError("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const updatedExceptions = (settings.exceptions || []).filter((item) => item.id !== id);
      await saveStoreSettings({
        ...settings,
        exceptions: updatedExceptions,
      });
      toast.success("Ausnahmetermin entfernt.");
    } catch (err: any) {
      console.error(err);
      toast.error("Fehler beim Löschen: " + err.message);
    }
  };

  // Preview upcoming calculated slots
  const previewSlots = calculatePickupSlots(settings, 5);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Lade Öffnungszeiten-Einstellungen...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Notice & Regular Hours */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Regular Hours Settings */}
        <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#0f4851] font-bold text-lg border-b border-[#c8d3d5] pb-3">
            <Clock className="size-5 text-[#00A8BC]" />
            <h3 className="font-bold uppercase tracking-wider text-sm text-[#0f4851]">Reguläre Werksverkauf-Zeiten</h3>
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-day" className="text-xs text-[#505c5f] font-bold uppercase tracking-wider">Standard-Verkaufstag</Label>
              <Select
                value={String(regularDayOfWeek)}
                onValueChange={(val) => {
                  if (val) setRegularDayOfWeek(Number(val));
                }}
              >
                <SelectTrigger id="reg-day" className="w-full bg-white rounded-none border-[#c8d3d5] text-xs font-semibold">
                  <SelectValue placeholder="Wochentag wählen">
                    {WEEKDAY_OPTIONS.find((opt) => opt.value === String(regularDayOfWeek))?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#c8d3d5]">
                  {WEEKDAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded-none text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-open" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Öffnet um</Label>
                <Input
                  id="reg-open"
                  type="time"
                  value={regularOpenTime}
                  onChange={(e) => setRegularOpenTime(e.target.value)}
                  required
                  className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-close" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Schließt um</Label>
                <Input
                  id="reg-close"
                  type="time"
                  value={regularCloseTime}
                  onChange={(e) => setRegularCloseTime(e.target.value)}
                  required
                  className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-9 shadow-xs">
              {saving ? "Wird gespeichert..." : "Reguläre Zeiten speichern"}
            </Button>
          </form>
        </div>

        {/* Live Preview: Next Available Pickups */}
        <div className="rounded-none border border-[#c8d3d5] bg-[#f9f9f9] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#0f4851] font-bold text-lg border-b border-[#c8d3d5] pb-3">
            <CalendarDays className="size-5 text-[#00A8BC]" />
            <h3 className="font-bold uppercase tracking-wider text-sm text-[#0f4851]">Live-Vorschau der nächsten Abholtage</h3>
          </div>

          <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">
            So sehen die nächsten berechneten Termine für den Kunden im Checkout aus:
          </p>

          <div className="space-y-2">
            {previewSlots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-none border flex items-center justify-between text-xs transition-colors ${
                  slot.isSpecial
                    ? "bg-[#00A8BC]/10 border-[#00A8BC] text-[#0f4851] font-medium"
                    : "bg-white border-[#c8d3d5] text-[#1a1c1c]"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold uppercase tracking-wide text-xs text-[#0f4851]">{slot.formattedDate}</div>
                  <div className="text-[#505c5f] flex items-center gap-2 font-medium">
                    <span>{slot.timeRange}</span>
                    {slot.note && (
                      <span className="text-[#00A8BC] font-bold">
                        • {slot.note}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {slot.type === "special_open" && (
                    <Badge className="bg-[#00A8BC] text-white text-[10px] rounded-none font-bold uppercase tracking-wider">Sonderöffnung</Badge>
                  )}
                  {slot.type === "altered_hours" && (
                    <Badge className="bg-[#0f4851] text-white text-[10px] rounded-none font-bold uppercase tracking-wider">Geänderte Zeit</Badge>
                  )}
                  {slot.type === "regular" && (
                    <Badge variant="outline" className="text-[#505c5f] border-[#c8d3d5] bg-[#eeeeee] text-[10px] rounded-none font-bold uppercase tracking-wider">Regulär</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exception Management Table */}
      <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#c8d3d5] pb-4">
          <div>
            <h3 className="font-bold text-base uppercase tracking-wider text-[#0f4851]">
              Sonder- & Ausnahmetage verwalten
            </h3>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">
              Urlaub, Feiertage, Ausweichtermine oder Sonderverkäufe eintragen.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 border border-[#c8d3d5] p-1 bg-[#f9f9f9] rounded-none shadow-xs">
              <Label htmlFor="lookahead" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#505c5f] whitespace-nowrap pl-2">
                Banner-Anzeige ab:
              </Label>
              <Input
                id="lookahead"
                type="number"
                min="1"
                max="90"
                value={bannerLookaheadDays}
                onChange={(e) => setBannerLookaheadDays(Number(e.target.value))}
                onBlur={async () => {
                   if (bannerLookaheadDays !== (settings.bannerLookaheadDays ?? 14)) {
                     try {
                       await saveStoreSettings({ ...settings, bannerLookaheadDays });
                       toast.success("Anzeigezeitraum gespeichert!");
                     } catch (err: any) {
                       toast.error("Fehler beim Speichern des Zeitraums.");
                     }
                   }
                }}
                className="w-14 h-7 text-xs rounded-none border-[#c8d3d5] bg-white text-center font-bold px-1"
              />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#505c5f] pr-2">Tagen vorher</span>
            </div>
            <Button onClick={openNewExceptionSheet} className="gap-2 shrink-0 bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-9 shadow-xs">
              <Plus className="size-4" />
              <span>Ausnahme hinzufügen</span>
            </Button>
          </div>
        </div>

        {(!settings.exceptions || settings.exceptions.length === 0) ? (
          <div className="rounded-none border border-dashed border-[#c8d3d5] p-8 text-center text-[#505c5f] space-y-2 bg-[#f9f9f9]">
            <Calendar className="size-10 mx-auto text-[#505c5f]/40" />
            <p className="font-bold text-xs uppercase tracking-wider text-[#0f4851]">Keine Ausnahmetage eingetragen</p>
            <p className="text-xs">
              Der Werksverkauf findet standardmäßig jeden Freitag von {regularOpenTime} bis {regularCloseTime} Uhr statt.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#c8d3d5] border border-[#c8d3d5] rounded-none overflow-hidden">
            {settings.exceptions.map((ex) => {
              const dateObj = new Date(ex.date + "T00:00:00");
              const dateFormatted = dateObj.toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              const isPast = ex.date < new Date().toISOString().split("T")[0];

              return (
                <div
                  key={ex.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isPast ? "bg-[#f9f9f9] opacity-60" : "bg-white hover:bg-[#f9f9f9]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#0f4851]">
                        {dateFormatted}
                      </span>
                      {ex.type === "closed" && (
                        <Badge variant="destructive" className="text-[10px] rounded-none uppercase font-bold tracking-wider">
                          Geschlossen (Ausfall)
                        </Badge>
                      )}
                      {ex.type === "special_open" && (
                        <Badge className="bg-[#00A8BC] text-white text-[10px] rounded-none uppercase font-bold tracking-wider">
                          Sonderöffnung / Ersatztag
                        </Badge>
                      )}
                      {ex.type === "altered_hours" && (
                        <Badge className="bg-[#0f4851] text-white text-[10px] rounded-none uppercase font-bold tracking-wider">
                          Geänderte Zeiten
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="outline" className="text-slate-400 text-[10px]">
                          Vergangen
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      {ex.type !== "closed" && (
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          {ex.openTime || regularOpenTime} – {ex.closeTime || regularCloseTime} Uhr
                        </span>
                      )}
                      {ex.note && (
                        <span className="text-slate-500 italic">
                          Grund: „{ex.note}“
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditExceptionSheet(ex)}
                      className="h-8 gap-1 text-xs rounded-none border-[#c8d3d5] bg-white text-[#0f4851] font-bold uppercase tracking-wider hover:bg-[#eeeeee]"
                    >
                      <Pencil className="size-3 text-[#00A8BC]" />
                      <span>Bearbeiten</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:bg-destructive/10 text-xs rounded-none"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                      />
                      <AlertDialogContent className="rounded-none border-[#c8d3d5]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-lg uppercase tracking-wider text-[#0f4851]">Möchten Sie diesen Ausnahmetermin wirklich löschen?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-[#505c5f]">
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-none border-[#c8d3d5] font-bold uppercase tracking-wider text-xs">Abbrechen</AlertDialogCancel>
                          <AlertDialogAction className="rounded-none bg-destructive font-bold uppercase tracking-wider text-xs" onClick={() => handleDeleteException(ex.id)}>
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exception Edit / Add Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-[#f9f9f9] p-6 border-l border-[#c8d3d5]">
          <SheetHeader className="pb-4 border-b border-[#c8d3d5]">
            <SheetTitle className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">
              {editingExceptionId ? "Ausnahmetermin bearbeiten" : "Neuen Ausnahmetermin anlegen"}
            </SheetTitle>
            <SheetDescription className="text-xs text-[#505c5f]">
              Legen Sie fest, ob an diesem Tag geschlossen ist, Sonderzeiten gelten oder ein Ersatztag stattfindet.
            </SheetDescription>
          </SheetHeader>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-none flex items-center gap-2 text-xs text-destructive mt-3">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveException} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Date Input */}
            <div className="space-y-1.5">
              <Label htmlFor="ex-date" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                Datum der Ausnahme *
              </Label>
              <Input
                id="ex-date"
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                required
                className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
              />
            </div>

            {/* Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Art der Abweichung *</Label>
              <Select
                value={exType}
                onValueChange={(val) => {
                  if (val) setExType(val as OpeningHourExceptionType);
                }}
              >
                <SelectTrigger className="bg-white rounded-none border-[#c8d3d5] text-xs">
                  <SelectValue placeholder="Wählen...">
                    {exType === "closed" && "❌ Geschlossen (z.B. Feiertag / Urlaub / Ausfall)"}
                    {exType === "special_open" && "🔄 Sonderöffnung / Ersatztag (z.B. Donnerstag oder Samstag)"}
                    {exType === "altered_hours" && "⏱️ Geänderte Uhrzeit (z.B. nur 14:00 - 17:00 Uhr)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#c8d3d5]">
                  {isRegularDay ? (
                    <>
                      <SelectItem value="closed" className="rounded-none text-xs">
                        ❌ Geschlossen (z.B. Feiertag / Urlaub / Ausfall)
                      </SelectItem>
                      <SelectItem value="altered_hours" className="rounded-none text-xs">
                        ⏱️ Geänderte Uhrzeit (z.B. nur 14:00 - 17:00 Uhr)
                      </SelectItem>
                    </>
                  ) : (
                    <SelectItem value="special_open" className="rounded-none text-xs">
                      🔄 Sonderöffnung / Ersatztag (z.B. Donnerstag oder Samstag)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Times (if not closed) */}
            {exType !== "closed" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-none border border-[#c8d3d5]">
                <div className="space-y-1.5">
                  <Label htmlFor="ex-open" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Öffnet um</Label>
                  <Input
                    id="ex-open"
                    type="time"
                    value={exOpenTime}
                    onChange={(e) => setExOpenTime(e.target.value)}
                    required
                    className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ex-close" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Schließt um</Label>
                  <Input
                    id="ex-close"
                    type="time"
                    value={exCloseTime}
                    onChange={(e) => setExCloseTime(e.target.value)}
                    required
                    className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
                  />
                </div>
              </div>
            )}

            {/* Note / Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="ex-note" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                Grund / Hinweis (für Kunden sichtbar)
              </Label>
              <Input
                id="ex-note"
                placeholder={
                  exType === "closed"
                    ? "z. B. Betriebsurlaub oder Karfreitag"
                    : exType === "special_open"
                    ? "z. B. Gründonnerstag (Ersatzverkauf) oder Hoffest"
                    : "z. B. Früherer Feierabend"
                }
                value={exNote}
                onChange={(e) => setExNote(e.target.value)}
                className="bg-white rounded-none border-[#c8d3d5] text-xs h-9"
              />
              <p className="text-[11px] text-[#505c5f]">
                Dieser Text wird den Kunden auf der Startseite und im Checkout angezeigt.
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="flex-1 rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#505c5f] hover:bg-[#eeeeee]"
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs shadow-xs">
                {saving ? "Speichern..." : "Übernehmen"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
