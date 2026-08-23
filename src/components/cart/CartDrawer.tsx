"use client";

import React, { useState, useEffect, ViewTransition } from "react";
import { Order } from "@/types";
import { useCart } from "@/lib/cart/CartContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { createOrderAction } from "@/app/actions/checkout";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  UserCheck,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  User as UserIcon,
  Hop,
  Lock,
  Clock,
  ChevronLeft,
  ArrowLeft,
  MapPinCheckInside,
  Wrench,
} from "lucide-react";
import { formatContainerType, formatPrice } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  subscribeStoreSettings,
  calculatePickupSlots,
  DEFAULT_STORE_SETTINGS,
  PickupSlot,
} from "@/lib/openingHours";

interface CartDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenOrders: () => void;
}

type CheckoutStep = "cart" | "account-choice" | "guest-form";

export function CartDrawer({ open, onOpenChange, onOpenOrders }: CartDrawerProps) {
  const {
    items,
    rentalItems,
    removeItem,
    updateQuantity,
    removeRentalItem,
    updateRentalQuantity,
    clearCart,
    itemsTotalCents,
    depositTotalCents,
    grandTotalCents,
    totalCount,
    isOpen: contextIsOpen,
    setIsOpen: contextSetIsOpen,
    lastAddedItemId,
  } = useCart();


  const { user, profile, linkWithEmailPassword, updateProfileData } = useAuth();

  const isDrawerOpen = open !== undefined ? open : contextIsOpen;
  const handleOpenChange = onOpenChange !== undefined ? onOpenChange : contextSetIsOpen;

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Store Settings & Pickup Slots
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [pickupSlots, setPickupSlots] = useState<PickupSlot[]>([]);
  const [selectedPickupSlotDate, setSelectedPickupSlotDate] = useState<string>("");
  const [confirmedPickupInfo, setConfirmedPickupInfo] = useState<string>("");

  useEffect(() => {
    const unsub = subscribeStoreSettings((settings) => {
      setStoreSettings(settings);
      const slots = calculatePickupSlots(settings, 6);
      setPickupSlots(slots);
      if (slots.length > 0 && !selectedPickupSlotDate) {
        setSelectedPickupSlotDate(slots[0].dateStr);
      }
    });
    return () => unsub();
  }, []);

  // Form Fields
  const [customerName, setCustomerName] = useState(
    profile?.displayName && profile.displayName !== "Gast" ? profile.displayName : ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    user?.email || profile?.email || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    profile?.phoneNumber || ""
  );
  const [customerType, setCustomerType] = useState<"private" | "business">(
    profile?.customerType || "private"
  );
  const [companyName, setCompanyName] = useState(
    profile?.companyName || ""
  );
  const [street, setStreet] = useState(profile?.street || "");
  const [houseNumber, setHouseNumber] = useState(profile?.houseNumber || "");
  const [zipCode, setZipCode] = useState(profile?.zipCode || "");
  const [city, setCity] = useState(profile?.city || "");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Post-Checkout Account Linking
  const [postPass, setPostPass] = useState("");
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const isAnonymous = user?.isAnonymous ?? true;

  // Sync profile & user info
  React.useEffect(() => {
    const effectiveName = (profile?.displayName && profile.displayName !== "Gast") ? profile.displayName : (user?.displayName && user.displayName !== "Gast" ? user.displayName : "");
    if (effectiveName && !customerName) {
      setCustomerName(effectiveName);
    }
    
    const effectiveEmail = profile?.email || user?.email || "";
    if (effectiveEmail && !customerEmail) {
      setCustomerEmail(effectiveEmail);
    }
    
    if (profile?.phoneNumber && !customerPhone) {
      setCustomerPhone(profile.phoneNumber);
    }
    if (profile?.customerType) {
      setCustomerType(profile.customerType);
    }
    if (profile?.companyName) {
      setCompanyName(profile.companyName);
    }
    if (profile?.street && !street) setStreet(profile.street);
    if (profile?.houseNumber && !houseNumber) setHouseNumber(profile.houseNumber);
    if (profile?.zipCode && !zipCode) setZipCode(profile.zipCode);
    if (profile?.city && !city) setCity(profile.city);
  }, [profile, user, open]);

  const handleProceedToCheckout = () => {
    setError(null);
    if (items.length === 0 && rentalItems.length === 0) {
      setError("Ihr Warenkorb ist leer.");
      return;
    }

    if (!isAnonymous && user?.email) {
      // User is already logged in with permanent account
      setStep("guest-form");
    } else {
      // Unauthenticated / anonymous visitor: show account choice
      setStep("account-choice");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setError("Bitte geben Sie Ihren vollständigen Namen an.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse für die Bestellbestätigung an.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setError("Bitte geben Sie eine Telefonnummer für eventuelle Rückfragen an.");
      return;
    }

    if (items.length === 0 && rentalItems.length === 0) {
      setError("Ihr Warenkorb ist leer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const userId = user?.uid || "guest-" + Date.now();
    const chosenSlot = pickupSlots.find((s) => s.dateStr === selectedPickupSlotDate) || pickupSlots[0];
    const pickupDate = chosenSlot ? chosenSlot.formattedDate : undefined;
    const pickupTime = chosenSlot ? chosenSlot.timeRange : undefined;
    const pickupDisplay = chosenSlot ? `${chosenSlot.formattedDate} (${chosenSlot.timeRange})` : "";

    try {
      const result = await createOrderAction({
        userId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        customerType,
        companyName: customerType === "business" ? companyName.trim() : undefined,
        street: street.trim() || undefined,
        houseNumber: houseNumber.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        city: city.trim() || undefined,
        pickupDate,
        pickupTime,
        items: items.map((i) => ({
          productId: i.productId,
          variantType: i.variantType,
          quantity: i.quantity,
        })),
        rentalItems: rentalItems.map((r) => ({
          rentalId: r.rentalId,
          quantity: r.quantity,
        })),
      });

      if (result.success && result.orderId) {
        setDatePickerOpen(false);
        setOrderSuccessId(result.orderId);
        setSubmittedEmail(customerEmail.trim().toLowerCase());
        setConfirmedPickupInfo(pickupDisplay);

        // Write directly to Firestore using authenticated client SDK
        try {
          if (user?.uid) {
            const orderDocRef = doc(db, "orders", result.orderId);
            await setDoc(orderDocRef, {
              id: result.orderId,
              userId: user.uid,
              customerName: customerName.trim(),
              customerEmail: customerEmail.trim().toLowerCase(),
              customerPhone: customerPhone.trim(),
              customerType,
              companyName: customerType === "business" ? companyName.trim() : null,
              street: street.trim() || null,
              houseNumber: houseNumber.trim() || null,
              zipCode: zipCode.trim() || null,
              city: city.trim() || null,
              pickupDate: pickupDate || null,
              pickupTime: pickupTime || null,
              status: "pending",
              createdAt: serverTimestamp(),
              items: items.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                variantType: i.variantType,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                depositPrice: i.depositPrice || 0,
              })),
              rentalItems: rentalItems.map((r) => ({
                rentalId: r.rentalId,
                rentalName: r.rentalName,
                rentalPriceCents: r.rentalPriceCents,
                depositCents: r.depositCents || 0,
                quantity: r.quantity,
              })),
              itemsTotalCents,
              depositTotalCents,
              grandTotalCents,
            });

            await updateProfileData({
              displayName: customerName.trim(),
              email: customerEmail.trim().toLowerCase(),
              phoneNumber: customerPhone.trim(),
              customerType,
              companyName: customerType === "business" ? companyName.trim() || undefined : undefined,
              street: customerType === "business" ? street.trim() || undefined : undefined,
              houseNumber: customerType === "business" ? houseNumber.trim() || undefined : undefined,
              zipCode: customerType === "business" ? zipCode.trim() || undefined : undefined,
              city: customerType === "business" ? city.trim() || undefined : undefined,
            });
          }
        } catch (fsErr) {
          console.warn("Client Firestore write fallback:", fsErr);
        }

        // Optimistically cache order locally
        try {
          const localOrder: Order = {
            id: result.orderId,
            userId,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: customerPhone.trim(),
            street: street.trim() || undefined,
            houseNumber: houseNumber.trim() || undefined,
            zipCode: zipCode.trim() || undefined,
            city: city.trim() || undefined,
            customerType,
            companyName: customerType === "business" ? companyName.trim() : undefined,
            pickupDate,
            pickupTime,
            status: "pending",
            createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, millis: Date.now() } as any,
            items: items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              variantType: i.variantType,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              depositPrice: i.depositPrice,
            })),
            rentalItems: rentalItems.length > 0
              ? rentalItems.map((r) => ({
                  rentalId: r.rentalId,
                  rentalName: r.rentalName,
                  rentalPriceCents: r.rentalPriceCents,
                  depositCents: r.depositCents || 0,
                  quantity: r.quantity,
                }))
              : undefined,
            itemsTotalCents,
            depositTotalCents,
            grandTotalCents,
          };
          const existing = JSON.parse(localStorage.getItem("schuette_user_orders") || "[]");
          localStorage.setItem(
            "schuette_user_orders",
            JSON.stringify([localOrder, ...existing.filter((o: any) => o.id !== result.orderId)])
          );
        } catch (storageErr) {
          console.warn("Could not cache local order:", storageErr);
        }

        clearCart();
      } else {
        setError(result.error || "Es gab ein Problem bei der Auftragsübermittlung.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Netzwerkfehler beim Absenden der Reservierung.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostCheckoutAccountUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postPass || postPass.length < 6) {
      setLinkError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setIsLinkingAccount(true);
    setLinkError(null);

    try {
      await linkWithEmailPassword(submittedEmail, postPass);
      setLinkSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setLinkError("Diese E-Mail-Adresse existiert bereits. Bitte melden Sie sich an.");
      } else {
        setLinkError(err.message || "Fehler beim Aktivieren des Kundenkontos.");
      }
    } finally {
      setIsLinkingAccount(false);
    }
  };

  const handleCloseAndReset = () => {
    setOrderSuccessId(null);
    setDatePickerOpen(false);
    setConfirmedPickupInfo("");
    setSubmittedEmail("");
    setStep("cart");
    setLinkSuccess(false);
    setLinkError(null);
    setPostPass("");
    setError(null);
    handleOpenChange(false);
  };

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-[#f9f9f9] p-6 rounded-none border-l border-[#c8d3d5]">
          <SheetHeader className="pb-4 border-b border-[#c8d3d5] pr-8">
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingCart className="size-5 text-[#00A8BC] shrink-0" />
              <SheetTitle className="font-heading text-xl sm:text-2xl uppercase tracking-wider whitespace-nowrap text-[#0f4851]">
                {step === "cart"
                  ? "Warenkorb"
                  : step === "account-choice"
                  ? "Optionen"
                  : "Ihre Angaben"}
              </SheetTitle>
              {totalCount > 0 && !orderSuccessId && (
                <Badge variant="secondary" className="ml-auto font-mono shrink-0 text-xs rounded-none bg-[#0f4851] text-white border-0">
                  {totalCount} {totalCount === 1 ? "Artikel" : "Artikel"}
                </Badge>
              )}
            </div>
            <SheetDescription className="text-xs text-[#505c5f]">
              {step === "cart"
                ? "Prüfen Sie Ihre Auswahl vor der Vorbestellung."
                : step === "account-choice"
                ? "Wählen Sie, wie Sie vorbestellen möchten."
                : "Geben Sie Ihre Kontaktdaten für die Abhol-Reservierung ein."}
            </SheetDescription>
          </SheetHeader>

          {/* Success Screen */}
          {orderSuccessId ? (
            <div className="flex-1 overflow-y-auto py-6 space-y-5 pr-1">
              <div className="text-center space-y-2">
                <div className="size-16 rounded-none bg-[#00A8BC]/20 flex items-center justify-center text-[#00A8BC] mx-auto border border-[#00A8BC]">
                  <CheckCircle2 className="size-10" />
                </div>
                <h3 className="font-heading text-2xl tracking-wide uppercase text-[#0f4851]">Reservierung erfolgreich!</h3>
                <p className="text-sm text-[#505c5f]">
                  Ihre Reservierungsnummer lautet:
                </p>
                <div className="p-3 bg-white border border-[#c8d3d5] rounded-none font-mono text-base font-bold tracking-wider inline-block text-[#0f4851]">
                  #{orderSuccessId.slice(0, 8).toUpperCase()}
                </div>
              </div>

              {/* Pickup Date Confirmation Notice */}
              {confirmedPickupInfo && (
                <div className="p-3.5 bg-white border border-[#c8d3d5] rounded-none flex items-start gap-2.5 text-xs text-[#1a1c1c]">
                  <CalendarIcon className="size-4 shrink-0 mt-0.5 text-[#00A8BC]" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[#505c5f]">Gewählter Abholtermin:</span>
                    <div className="font-bold text-sm text-[#0f4851] mt-0.5">{confirmedPickupInfo}</div>
                  </div>
                </div>
              )}

              {/* Email Confirmation Notice */}
              <div className="p-3.5 bg-white border border-[#c8d3d5] rounded-none flex items-start gap-2.5 text-xs text-[#1a1c1c]">
                <Mail className="size-4 shrink-0 mt-0.5 text-[#00A8BC]" />
                <div>
                  <strong className="text-[#0f4851]">Bestätigungs-E-Mail gesendet:</strong> Eine detaillierte Aufstellung Ihres Auftrags wurde an <span className="font-bold underline text-[#00A8BC]">{submittedEmail}</span> geschickt.
                </div>
              </div>

              {/* 1-Click Post-Checkout Account Upgrade for Guests */}
              {isAnonymous && !linkSuccess && (
                <div className="p-4 bg-white border border-[#c8d3d5] rounded-none space-y-3">
                  <div className="flex items-center gap-2 text-[#0f4851] font-heading uppercase text-sm tracking-wider">
                    <Hop className="size-4 text-[#00A8BC]" />
                    <span>Bestellung in Kundenkonto sichern</span>
                  </div>
                  <p className="text-xs text-[#505c5f] leading-relaxed">
                    Aktivieren Sie jetzt mit nur einem Passwort Ihr Kundenkonto, um diese Bestellung dauerhaft zu speichern und den Status jederzeit einzusehen.
                  </p>

                  {linkError && (
                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-none border border-destructive/30">
                      {linkError}
                    </div>
                  )}

                  <form onSubmit={handlePostCheckoutAccountUpgrade} className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="post-pass" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                        Passwort wählen (mind. 6 Zeichen)
                      </Label>
                      <div className="relative">
                        <Lock className="size-3.5 absolute left-3 top-3 text-[#505c5f]" />
                        <Input
                          id="post-pass"
                          type="password"
                          placeholder="Passwort eingeben"
                          value={postPass}
                          onChange={(e) => setPostPass(e.target.value)}
                          required
                          minLength={6}
                          className="pl-9 h-9 text-xs bg-white rounded-none border-[#c8d3d5]"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-[#00a8bc] hover:bg-[#0092a4] text-white font-bold uppercase tracking-wider text-xs h-9 rounded-none"
                      disabled={isLinkingAccount}
                    >
                      {isLinkingAccount ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                          Konto wird aktiviert...
                        </>
                      ) : (
                        "Konto jetzt aktivieren"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {linkSuccess && (
                <div className="p-3.5 bg-white border border-[#00A8BC] rounded-none flex items-center gap-2 text-xs font-bold text-[#0f4851]">
                  <UserCheck className="size-4 text-[#00A8BC] shrink-0" />
                  <span>Kundenkonto erfolgreich aktiviert! Ihre Daten sind sicher hinterlegt.</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => {
                    handleCloseAndReset();
                    onOpenOrders();
                  }}
                  className="w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-none bg-[#0f4851] hover:bg-[#174e56] text-white shadow-xs transition-colors duration-150 cursor-pointer"
                >
                  <span>Zur Bestellhistorie</span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseAndReset}
                  className="w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-none border-[#c8d3d5] bg-white text-[#0f4851] hover:bg-[#eeeeee] transition-colors duration-150 cursor-pointer"
                >
                  <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                  <span>Weiter einkaufen</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Cart Items */}
              {step === "cart" && (
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1.5">
                    {items.length === 0 && rentalItems.length === 0 ? (
                      <div className="text-center py-12 text-[#505c5f] space-y-3">
                        <ShoppingBag className="size-12 mx-auto text-[#c8d3d5]" aria-hidden="true" />
                        <p className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">Ihr Warenkorb ist leer</p>
                        <p className="text-xs">
                          Fügen Sie Getränke oder Mietartikel aus unserem Sortiment hinzu.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleOpenChange(false)}
                          className="mt-2 text-xs font-bold uppercase tracking-wider rounded-none border-[#c8d3d5] text-[#0f4851] hover:bg-[#eeeeee] transition-colors duration-150"
                        >
                          Sortiment durchstöbern
                        </Button>
                      </div>
                    ) : (
                      <>
                        {items.map((item) => {
                          const isHighlighted = item.id === lastAddedItemId;
                          return (
                            <ViewTransition key={item.id}>
                              <div className={isHighlighted ? "rotating-glow-wrapper my-1" : ""}>
                                <div
                                  className="p-3.5 rounded-none border border-[#c8d3d5] bg-white shadow-2xs space-y-2.5 relative"
                                >
                                  {/* Row 1: Full Product Title + Delete Button */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-heading text-base tracking-wide uppercase text-[#0f4851] leading-snug">
                                        {item.productName}
                                      </h4>
                                      <p className="text-xs text-[#505c5f] font-medium mt-0.5">
                                        {formatContainerType(item.variantType)}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 shrink-0 text-[#505c5f] hover:text-destructive hover:bg-destructive/10 rounded-none -mr-1 -mt-1 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                                      onClick={() => removeItem(item.id)}
                                      aria-label={`Artikel ${item.productName} aus Warenkorb entfernen`}
                                      title="Artikel entfernen"
                                    >
                                      <Trash2 className="size-3.5" aria-hidden="true" />
                                    </Button>
                                  </div>

                                  {/* Row 2: Price & Deposit (Left) + Quantity Stepper (Right) */}
                                  <div className="flex items-end justify-between pt-2 border-t border-[#f0f2f3]">
                                    <div className="flex flex-col">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-sm text-[#1a1c1c] tabular-nums">
                                          {formatPrice(item.unitPrice * item.quantity)}
                                        </span>
                                        {item.quantity > 1 && (
                                          <span className="text-[11px] text-[#505c5f] tabular-nums">
                                            ({formatPrice(item.unitPrice)} / Stk.)
                                          </span>
                                        )}
                                      </div>
                                      {item.depositPrice ? (
                                        <span className="text-[11px] text-[#00A8BC] font-medium tabular-nums">
                                          + {formatPrice(item.depositPrice * item.quantity)} Pfand
                                        </span>
                                      ) : null}
                                    </div>

                                    {/* Quantity controls */}
                                    <div className="flex items-center border border-[#c8d3d5] rounded-none bg-white focus-within:ring-2 focus-within:ring-[#00A8BC]">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 rounded-none text-[#505c5f] hover:bg-[#eeeeee] focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        aria-label={`Menge für ${item.productName} verringern (aktuell: ${item.quantity})`}
                                        title="Menge verringern"
                                      >
                                        <Minus className="size-3" aria-hidden="true" />
                                      </Button>
                                      <span 
                                        className="w-7 text-center text-xs font-bold text-[#0f4851] tabular-nums select-none"
                                        aria-label={`Aktuelle Menge: ${item.quantity} Stück`}
                                      >
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 rounded-none text-[#505c5f] hover:bg-[#eeeeee] focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        aria-label={`Menge für ${item.productName} erhöhen (aktuell: ${item.quantity})`}
                                        title="Menge erhöhen"
                                      >
                                        <Plus className="size-3" aria-hidden="true" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </ViewTransition>
                          );
                        })}

                        {/* Rental Items in Cart */}
                        {rentalItems.map((rental) => (
                          <ViewTransition key={`cart-rental-${rental.rentalId}`}>
                            <div className={lastAddedItemId === `rental_${rental.rentalId}` ? "rotating-glow-wrapper my-1" : ""}>
                              <div className="p-3.5 rounded-none border border-[#00A8BC] bg-[#f0f7f8] shadow-2xs space-y-2.5 relative">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Badge variant="secondary" className="bg-[#0f4851] text-white text-[9px] font-bold uppercase rounded-none px-1.5 py-0.5">
                                        <Wrench className="size-2.5 mr-1 inline" aria-hidden="true" />
                                        Mietartikel
                                      </Badge>
                                    </div>
                                    <h4 className="font-heading text-base tracking-wide uppercase text-[#0f4851] leading-snug">
                                      {rental.rentalName}
                                    </h4>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0 text-[#505c5f] hover:text-destructive hover:bg-destructive/10 rounded-none -mr-1 -mt-1 cursor-pointer"
                                    onClick={() => removeRentalItem(rental.rentalId)}
                                    aria-label={`Mietartikel ${rental.rentalName} aus Warenkorb entfernen`}
                                    title="Mietartikel entfernen"
                                  >
                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                  </Button>
                                </div>

                                <div className="flex items-end justify-between pt-2 border-t border-[#c8d3d5]/70 gap-2">
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-sm text-[#1a1c1c] tabular-nums">
                                      {formatPrice(rental.rentalPriceCents * rental.quantity)}
                                    </span>
                                    {rental.quantity > 1 && (
                                      <span className="text-[10px] text-[#505c5f] tabular-nums">
                                        ({formatPrice(rental.rentalPriceCents)} / Stück)
                                      </span>
                                    )}
                                    {rental.depositCents > 0 && (
                                      <span className="text-[11px] text-[#505c5f] font-medium tabular-nums mt-0.5">
                                        + zzgl. {formatPrice(rental.depositCents * rental.quantity)} Kaution bei Abholung
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center border border-[#c8d3d5] bg-white rounded-none h-8 shadow-2xs shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 rounded-none text-[#0f4851] hover:bg-[#eeeeee] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none cursor-pointer"
                                      onClick={() => updateRentalQuantity(rental.rentalId, rental.quantity - 1)}
                                      disabled={rental.quantity <= 1}
                                      aria-label={`Menge für ${rental.rentalName} verringern`}
                                    >
                                      <Minus className="size-3" aria-hidden="true" />
                                    </Button>
                                    <span
                                      className="w-7 text-center text-xs font-bold text-[#0f4851] tabular-nums select-none"
                                      aria-live="polite"
                                      aria-label={`Aktuelle Menge für ${rental.rentalName}: ${rental.quantity}`}
                                    >
                                      {rental.quantity}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 rounded-none text-[#0f4851] hover:bg-[#eeeeee] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none cursor-pointer"
                                      onClick={() => updateRentalQuantity(rental.rentalId, rental.quantity + 1)}
                                      disabled={rental.quantity >= (rental.totalStock || 99)}
                                      aria-label={`Menge für ${rental.rentalName} erhöhen`}
                                    >
                                      <Plus className="size-3" aria-hidden="true" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ViewTransition>
                        ))}
                      </>
                    )}
                  </div>

                  {(items.length > 0 || rentalItems.length > 0) && (
                    <div className="border-t border-[#c8d3d5] pt-4 space-y-4">
                      {/* Summary Breakdown */}
                      <div className="space-y-1.5 text-xs text-[#505c5f]">
                        {items.length > 0 && (
                          <div className="flex justify-between">
                            <span>Zwischensumme Getränke:</span>
                            <span className="font-bold text-[#1a1c1c] tabular-nums">
                              {formatPrice(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))}
                            </span>
                          </div>
                        )}
                        {rentalItems.map((r) => (
                          <div key={`breakdown-rent-${r.rentalId}`} className="flex justify-between text-[#0f4851] font-medium">
                            <span>Miete {r.quantity > 1 ? `${r.quantity}x ` : ""}{r.rentalName}:</span>
                            <span className="font-bold tabular-nums">{formatPrice(r.rentalPriceCents * r.quantity)}</span>
                          </div>
                        ))}
                        {depositTotalCents > 0 && (
                          <div className="flex justify-between text-[#00A8BC]">
                            <span>Pfand (Flaschen / Gebinde):</span>
                            <span className="font-bold tabular-nums">+ {formatPrice(depositTotalCents)}</span>
                          </div>
                        )}
                        {rentalItems.filter((r) => r.depositCents > 0).map((r) => (
                          <div key={`breakdown-dep-${r.rentalId}`} className="flex justify-between text-[#505c5f] text-[11px]">
                            <span>Kaution {r.quantity > 1 ? `${r.quantity}x ` : ""}{r.rentalName} (vor Ort):</span>
                            <span className="font-medium tabular-nums">{formatPrice(r.depositCents * r.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-baseline font-bold pt-2 border-t border-[#c8d3d5] gap-2">
                        <span className="text-xs uppercase tracking-wider text-[#505c5f] min-w-0">Gesamtbetrag (inkl. Pfand):</span>
                        <span className="font-heading text-2xl text-[#0f4851] shrink-0 text-right tabular-nums">
                          {formatPrice(grandTotalCents)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleProceedToCheckout}
                          className="w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none shadow-xs transition-colors duration-150 cursor-pointer"
                        >
                          <span>Zur Reservierung</span>
                          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOpenChange(false)}
                          className="w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-none border-[#c8d3d5] bg-white text-[#0f4851] hover:bg-[#eeeeee] transition-colors duration-150 cursor-pointer"
                        >
                          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                          <span>Weiter einkaufen</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}


              {/* Step 2: Account Prioritization Choice */}
              {step === "account-choice" && (
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {/* Preferred: Create Account / Login */}
                  <div className="p-4 rounded-none border border-[#0f4851] bg-white space-y-3 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-none bg-[#0f4851] text-white">
                          <Hop className="size-4 text-[#00A8BC]" aria-hidden="true" />
                        </div>
                        <h4 className="font-heading uppercase tracking-wide text-base text-[#0f4851]">
                          Mit Kundenkonto bestellen (Empfohlen)
                        </h4>
                      </div>
                      <Badge className="bg-[#00A8BC] text-white text-[10px] font-bold uppercase rounded-none border-0">
                        Vorteile
                      </Badge>
                    </div>

                    <ul className="space-y-1.5 text-xs text-[#505c5f] pt-1">
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span>Bestellhistorie & Abholstatus jederzeit einsehen</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span>Schnellere Nachbestellung ohne erneute Dateneingabe</span>
                      </li>
                    </ul>

                    <Button
                      onClick={() => setAuthModalOpen(true)}
                      className="w-full font-bold uppercase tracking-wider text-xs h-10 bg-[#0f4851] text-white hover:bg-[#174e56] rounded-none mt-2 shadow-xs transition-colors duration-150"
                    >
                      <UserPlus className="size-4 mr-2 text-[#00A8BC]" aria-hidden="true" />
                      Konto anlegen oder Anmelden
                    </Button>
                  </div>

                  {/* Secondary: Guest Checkout */}
                  <div className="p-4 rounded-none border border-[#c8d3d5] bg-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-none bg-[#eeeeee] text-[#505c5f]">
                        <UserIcon className="size-4" aria-hidden="true" />
                      </div>
                      <h4 className="font-heading uppercase tracking-wide text-base text-[#1a1c1c]">
                        Als Gast fortfahren
                      </h4>
                    </div>
                    <p className="text-xs text-[#505c5f] leading-relaxed">
                      Einmalige Vorbestellung ohne Passwort. Name, E-Mail und Telefonnummer werden für die Abwicklung und Bestätigungsmail benötigt.
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => setStep("guest-form")}
                      className="w-full font-bold uppercase tracking-wider text-xs h-10 border-[#c8d3d5] rounded-none text-[#0f4851] hover:bg-[#eeeeee] transition-colors duration-150"
                    >
                      Als Gast reservieren
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("cart")}
                      className="w-full font-bold uppercase tracking-wider text-xs h-11 border-[#c8d3d5] bg-white rounded-none text-[#0f4851] hover:bg-[#eeeeee] flex items-center justify-center gap-2 shadow-2xs transition-colors duration-150"
                    >
                      <ArrowLeft className="size-4 text-[#00A8BC]" aria-hidden="true" />
                      <span>Zurück zum Warenkorb</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Guest & Contact Form */}
              {step === "guest-form" && (
                <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
                  {error && (
                    <div role="alert" aria-live="polite" className="p-3 bg-destructive/10 border border-destructive/20 rounded-none flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  {!isAnonymous && (
                    <div className="p-3 bg-white border border-[#00A8BC] rounded-none flex items-center gap-2 text-sm text-[#0f4851] font-medium shadow-2xs">
                      <UserCheck className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                      <span>Angemeldet als <strong>{user?.email}</strong></span>
                    </div>
                  )}

                  <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-name" className="text-xs font-bold uppercase tracking-wider text-[#505c5f] flex items-center gap-1.5">
                        <UserIcon className="size-3.5 text-[#505c5f]" aria-hidden="true" />
                        <span>Vollständiger Name des Bestellers *</span>
                      </Label>
                      <Input
                        id="checkout-name"
                        name="name"
                        autoComplete="name"
                        placeholder="z. B. Max Mustermann"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-email" className="text-xs font-bold uppercase tracking-wider text-[#505c5f] flex items-center gap-1.5">
                        <Mail className="size-3.5 text-[#505c5f]" aria-hidden="true" />
                        <span>E-Mail-Adresse für Bestätigung *</span>
                      </Label>
                      <Input
                        id="checkout-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        placeholder="z. B. max.mustermann@beispiel.de"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]"
                      />
                      <p className="text-xs text-[#505c5f]">
                        An diese Adresse wird die Bestätigungsmail mit allen Bestelldetails geschickt.
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-phone" className="text-xs font-bold uppercase tracking-wider text-[#505c5f] flex items-center gap-1.5">
                        <Phone className="size-3.5 text-[#505c5f]" aria-hidden="true" />
                        <span>Telefonnummer (für Rückfragen / Abholung) *</span>
                      </Label>
                      <Input
                        id="checkout-phone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="z. B. 0170 1234567 oder 039204 1234"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c] tabular-nums"
                      />
                    </div>

                    {/* Pickup Date Slot Selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="size-3.5 text-[#00A8BC]" aria-hidden="true" />
                          <span>Gewünschter Abholtermin *</span>
                        </span>
                        {pickupSlots.find(s => s.dateStr === selectedPickupSlotDate)?.isSpecial && (
                          <Badge className="bg-[#00A8BC] text-white text-[10px] py-0 px-1.5 rounded-none uppercase font-bold border-0">
                            Besonderer Termin
                          </Badge>
                        )}
                      </Label>
                      
                      {pickupSlots.length === 0 ? (
                        <div className="p-3 bg-white border border-[#c8d3d5] rounded-none text-sm text-[#505c5f]">
                          Lade verfügbare Abholtermine…
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger
                              aria-label="Abholtermin wählen"
                              className={cn(
                                "flex w-full items-center justify-start rounded-none border border-[#c8d3d5] bg-white px-3 py-2 text-sm font-medium shadow-2xs transition-colors hover:bg-[#eeeeee] outline-none select-none h-10 cursor-pointer text-[#1a1c1c]",
                                !selectedPickupSlotDate && "text-[#505c5f]"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                              <span className="truncate">
                                {pickupSlots.find(s => s.dateStr === (selectedPickupSlotDate || pickupSlots[0]?.dateStr))?.formattedDate || "Datum wählen"}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-none border-[#c8d3d5]" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  (selectedPickupSlotDate || pickupSlots[0]?.dateStr) 
                                    ? new Date((selectedPickupSlotDate || pickupSlots[0]?.dateStr) + "T12:00:00") 
                                    : undefined
                                }
                                onSelect={(date) => {
                                  if (date) {
                                    const ymd = [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
                                    setSelectedPickupSlotDate(ymd);
                                    setDatePickerOpen(false);
                                  }
                                }}
                                disabled={(date) => {
                                  const ymd = [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
                                  return !pickupSlots.some(s => s.dateStr === ymd);
                                }}
                                locale={de}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          {(() => {
                            const currentSlot = pickupSlots.find(s => s.dateStr === (selectedPickupSlotDate || pickupSlots[0]?.dateStr));
                            if (!currentSlot) return null;
                            return (
                              <div className="p-2.5 bg-white rounded-none border border-[#c8d3d5] flex items-start gap-2.5 text-sm text-[#1a1c1c] shadow-2xs">
                                <Clock className="size-4 mt-0.5 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-sm text-[#0f4851] tabular-nums">Abholzeit: {currentSlot.timeRange}</span>
                                  {currentSlot.note && <span className="text-xs text-[#505c5f]">{currentSlot.note}</span>}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-[#505c5f] flex items-center gap-1.5 font-medium">
                        <MapPinCheckInside className="size-3.5 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span>Abholung im Werksverkauf: Zum Siekweg 2, 39343 Rottmersleben</span>
                      </p>
                    </div>

                    {/* Customer Type */}
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="checkout-customer-type" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Kundentyp</Label>
                      <Select
                        value={customerType}
                        onValueChange={(val) => {
                          if (val) setCustomerType(val as "private" | "business");
                        }}
                      >
                        <SelectTrigger id="checkout-customer-type" className="w-full bg-white h-10 text-sm font-medium rounded-none border-[#c8d3d5] text-[#1a1c1c]">
                          <SelectValue placeholder="Kundentyp wählen">
                            {customerType === "business" ? "Geschäftskunde (Firma / Verein / Gastro)" : "Privatkunde"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#c8d3d5]">
                          <SelectItem value="private" label="Privatkunde" className="rounded-none text-sm">
                            Privatkunde
                          </SelectItem>
                          <SelectItem value="business" label="Geschäftskunde (Firma / Verein / Gastro)" className="rounded-none text-sm">
                            Geschäftskunde (Firma / Verein / Gastro)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {customerType === "business" && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="checkout-company" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                            Firmenname / Gastronomiebetrieb *
                          </Label>
                          <Input
                            id="checkout-company"
                            name="organization"
                            autoComplete="organization"
                            placeholder="z. B. Gasthof Bördeblick GmbH"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]"
                          />
                        </div>
                        <div className="grid grid-cols-[1fr_100px] gap-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="checkout-street" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Straße *</Label>
                            <Input id="checkout-street" name="address-line1" autoComplete="street-address" value={street} onChange={(e) => setStreet(e.target.value)} required className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="checkout-hnr" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Hausnr. *</Label>
                            <Input id="checkout-hnr" name="house-number" autoComplete="address-line2" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} required className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="checkout-zip" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">PLZ *</Label>
                            <Input id="checkout-zip" name="postal-code" autoComplete="postal-code" inputMode="numeric" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c] tabular-nums" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="checkout-city" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Ort *</Label>
                            <Input id="checkout-city" name="address-level2" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} required className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium text-[#1a1c1c]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className="my-3 border-[#c8d3d5]" />

                    {/* Summary Totals */}
                    <div className="space-y-1.5 text-xs text-[#505c5f] bg-white p-3.5 rounded-none border border-[#c8d3d5]">
                      {items.length > 0 && (
                        <div className="flex justify-between">
                          <span>Zwischensumme Getränke:</span>
                          <span className="font-bold text-[#1a1c1c] tabular-nums">
                            {formatPrice(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))}
                          </span>
                        </div>
                      )}
                      {rentalItems.map((r) => (
                        <div key={`summary-rent-${r.rentalId}`} className="flex justify-between text-[#0f4851] font-medium">
                          <span>Miete {r.quantity > 1 ? `${r.quantity}x ` : ""}{r.rentalName}:</span>
                          <span className="font-bold tabular-nums">{formatPrice(r.rentalPriceCents * r.quantity)}</span>
                        </div>
                      ))}
                      {depositTotalCents > 0 && (
                        <div className="flex justify-between text-[#00A8BC]">
                          <span>Pfand (Flaschen / Gebinde):</span>
                          <span className="font-bold tabular-nums">+ {formatPrice(depositTotalCents)}</span>
                        </div>
                      )}
                      {rentalItems.filter((r) => r.depositCents > 0).map((r) => (
                        <div key={`summary-dep-${r.rentalId}`} className="flex justify-between text-[#505c5f] text-[11px]">
                          <span>Kaution {r.quantity > 1 ? `${r.quantity}x ` : ""}{r.rentalName} (vor Ort):</span>
                          <span className="font-medium tabular-nums">{formatPrice(r.depositCents * r.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-baseline font-bold pt-2 border-t border-[#c8d3d5] text-[#1a1c1c]">
                        <span className="text-xs uppercase tracking-wider text-[#505c5f]">Gesamtbetrag (inkl. Pfand):</span>
                        <span className="font-heading text-2xl text-[#0f4851] tabular-nums">
                          {formatPrice(grandTotalCents)}
                        </span>
                      </div>
                    </div>

                    {/* Click & Reserve & JuSchG Legal Notices */}
                    <div className="p-3 bg-[#eeeeee] border border-[#c8d3d5] rounded-none space-y-2.5 text-xs text-[#1a1c1c]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 shrink-0 flex items-center justify-center pt-0.5">
                          <ShieldCheck className="size-4 text-[#00A8BC]" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0f4851] text-xs uppercase tracking-wider leading-snug">
                            Unverbindliche Vorbestellung (Click & Reserve)
                          </p>
                          <p className="text-[11px] text-[#505c5f] leading-snug mt-0.5">
                            Es kommt kein Fernabsatzvertrag zustande. Sie zahlen erst bei Abholung vor Ort an der Ladenkasse (Bar oder EC-Karte).
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#c8d3d5] flex items-start gap-2.5">
                        <div className="w-5 shrink-0 flex items-center justify-center pt-0.5">
                          <span className="font-bold text-[9px] px-1 py-0.5 bg-[#0f4851] rounded-none text-white leading-none">
                            16+
                          </span>
                        </div>
                        <p className="text-[11px] text-[#505c5f] leading-snug flex-1 min-w-0">
                          <strong className="text-[#0f4851]">Jugendschutz:</strong> Abgabe von Bier nur an Personen ab 16 Jahren. Gesetzliche Altersprüfung erfolgt bei der Abholung.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-6 text-sm font-bold uppercase tracking-wider mt-2 flex flex-col items-center justify-center gap-0.5 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none shadow-xs transition-colors duration-150"
                      disabled={isSubmitting || (items.length === 0 && rentalItems.length === 0)}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                          <span>Reservierung wird übermittelt…</span>
                        </div>
                      ) : (
                        <>
                          <span>Unverbindlich reservieren</span>
                          <span className="text-[10px] font-medium tracking-normal normal-case text-white/90">
                            Zahlung erst bei Abholung vor Ort
                          </span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(isAnonymous ? "account-choice" : "cart")}
                      className="w-full font-bold uppercase tracking-wider text-xs h-11 border-[#c8d3d5] bg-white rounded-none text-[#0f4851] hover:bg-[#eeeeee] flex items-center justify-center gap-2 mt-2 shadow-2xs transition-colors duration-150"
                    >
                      <ArrowLeft className="size-4 text-[#00A8BC]" aria-hidden="true" />
                      <span>{isAnonymous ? "Zurück zur Auswahl" : "Zurück zum Warenkorb"}</span>
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Auth Modal for 1-Click Login / Register */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={(isOpen) => {
          setAuthModalOpen(isOpen);
          if (!isOpen && user && !user.isAnonymous) {
            setStep("guest-form");
          }
        }}
      />
    </>
  );
}
