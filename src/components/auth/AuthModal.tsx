"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck, Hop, AlertCircle, LogOut } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const {
    user,
    profile,
    logout,
    linkWithEmailPassword,
    loginWithEmailPassword,
    resetPassword,
    registerWithEmailPassword,
    loginWithGoogle,
    deleteAccount,
    updateProfileData,
  } = useAuth();
  const { clearCart } = useCart();

  const [activeTab, setActiveTab] = useState<"register" | "login">("login");
  const [viewMode, setViewMode] = useState<"tabs" | "forgot_password">("tabs");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerType, setCustomerType] = useState<"private" | "business">("private");
  const [companyName, setCompanyName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editCustomerType, setEditCustomerType] = useState<"private" | "business">("private");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editHouseNumber, setEditHouseNumber] = useState("");
  const [editZipCode, setEditZipCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  // Reset to overview mode whenever the modal opens
  React.useEffect(() => {
    if (open) {
      setViewMode("tabs");
      setIsEditingProfile(false);
      setShowDeleteConfirm(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [open]);

  const handleRegisterOrLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!displayName.trim()) {
      setError("Bitte geben Sie Ihren Namen an.");
      setLoading(false);
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setError("Bitte geben Sie eine gültige Telefonnummer an.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }
    if (!agbAccepted) {
      setError("Bitte akzeptieren Sie die AGB und die Datenschutzerklärung.");
      setLoading(false);
      return;
    }
    if (customerType === "business" && (!street || !houseNumber || !zipCode || !city)) {
      setError("Bitte füllen Sie die Rechnungsadresse vollständig aus.");
      setLoading(false);
      return;
    }

    try {
      if (isAnonymous) {
        // When linking an anonymous session, we also update the profile with the new details
        await linkWithEmailPassword(email, password);
        await registerWithEmailPassword(email, password, customerType, companyName, displayName.trim(), phoneNumber.trim(), street.trim(), houseNumber.trim(), zipCode.trim(), city.trim()); // We can call this to update the doc, or just use updateProfileData
        setSuccessMsg("Konto erfolgreich registriert!");
      } else {
        await registerWithEmailPassword(email, password, customerType, companyName, displayName.trim(), phoneNumber.trim(), street.trim(), houseNumber.trim(), zipCode.trim(), city.trim());
        setSuccessMsg("Konto erfolgreich registriert!");
      }
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an.");
      } else if (err.code === "auth/weak-password") {
        setError("Das Passwort sollte mindestens 6 Zeichen lang sein.");
      } else {
        setError(err.message || "Fehler bei der Registrierung.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await loginWithEmailPassword(email, password);
      setSuccessMsg("Erfolgreich angemeldet!");
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Ungültige E-Mail-Adresse oder falsches Passwort.");
      } else {
        setError(err.message || "Fehler bei der Anmeldung.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!email) {
      setError("Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      setSuccessMsg("E-Mail zum Zurücksetzen gesendet! Bitte prüfen Sie Ihren Posteingang.");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("Diese E-Mail-Adresse ist nicht registriert.");
      } else {
        setError(err.message || "Fehler beim Zurücksetzen des Passworts.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileResetPassword = async () => {
    if (!user?.email) return;
    setError(null);
    setSuccessMsg(null);
    try {
      setLoading(true);
      await resetPassword(user.email);
      setSuccessMsg(`Link zum Zurücksetzen des Passworts wurde an ${user.email} gesendet! Bitte prüfe deinen Posteingang.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Senden der E-Mail zum Zurücksetzen.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    clearCart();
    await logout();
    onOpenChange(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      setSuccessMsg("Erfolgreich mit Google angemeldet!");
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        return;
      }
      setError(err.message || "Fehler bei der Anmeldung mit Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditDisplayName(profile?.displayName || "");
    setEditPhoneNumber(profile?.phoneNumber || "");
    setEditCustomerType(profile?.customerType || "private");
    setEditCompanyName(profile?.companyName || "");
    setEditStreet(profile?.street || "");
    setEditHouseNumber(profile?.houseNumber || "");
    setEditZipCode(profile?.zipCode || "");
    setEditCity(profile?.city || "");
    setShowDeleteConfirm(false);
    setIsEditingProfile(true);
  };

  const handleDeleteAccount = async () => {
    setError(null);
    try {
      setLoading(true);
      clearCart();
      await deleteAccount();
      onOpenChange(false);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sicherheitsbestätigung wurde abgebrochen.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Aus Sicherheitsgründen ist eine erneute Anmeldung erforderlich. Bitte loggen Sie sich aus und erneut ein.");
      } else {
        setError(err.message || "Fehler beim Löschen des Kontos.");
      }
    } finally {
      setShowDeleteConfirm(false);
      setIsEditingProfile(false);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateProfileData({
        displayName: editDisplayName.trim() || undefined,
        phoneNumber: editPhoneNumber.trim() || undefined,
        customerType: editCustomerType,
        companyName: editCustomerType === "business" ? editCompanyName.trim() || undefined : undefined,
        street: editCustomerType === "business" ? editStreet.trim() || undefined : undefined,
        houseNumber: editCustomerType === "business" ? editHouseNumber.trim() || undefined : undefined,
        zipCode: editCustomerType === "business" ? editZipCode.trim() || undefined : undefined,
        city: editCustomerType === "business" ? editCity.trim() || undefined : undefined,
      });
      setIsEditingProfile(false);
      setSuccessMsg("Profil erfolgreich aktualisiert.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError("Fehler beim Speichern des Profils.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] sm:max-h-[90vh] flex flex-col bg-[#f9f9f9] rounded-none border border-[#c8d3d5] p-0 shadow-xl overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-3 bg-white border-b border-[#c8d3d5] shrink-0 pr-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-none bg-[#0f4851] text-white flex items-center justify-center shrink-0">
                <Hop className="size-4 text-[#00A8BC]" />
              </div>
              <DialogTitle className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-[#0f4851]">Kundenkonto</DialogTitle>
              {!isAnonymous && (
                <Badge variant="outline" className="text-[10px] font-bold uppercase bg-white text-[#0f4851] border-[#c8d3d5] rounded-none shrink-0">
                  <UserCheck className="size-3 mr-1 text-[#00A8BC]" />
                  Registriert
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-[#505c5f]">
            {isAnonymous
              ? "Melden Sie sich an oder erstellen Sie ein neues Kundenkonto."
              : "Verwalten Sie Ihre Anmeldedaten und Kundeneinstellungen."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!isAnonymous ? (
            // Profile View for registered users
            <div className="space-y-4">
            
            {successMsg && (
              <div className="p-3 bg-white border border-[#00A8BC] rounded-none flex items-center gap-2 text-xs text-[#0f4851] font-bold">
                <UserCheck className="size-4 shrink-0 text-[#00A8BC]" />
                <span>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-none flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-white border border-[#c8d3d5] rounded-none space-y-3 shadow-2xs">
              {isEditingProfile ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Name</Label>
                    <Input id="edit-name" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="h-9 text-xs bg-white rounded-none border-[#c8d3d5]" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-phone" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Telefon</Label>
                    <Input id="edit-phone" value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value)} className="h-9 text-xs bg-white rounded-none border-[#c8d3d5]" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="edit-customer-type" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Kundentyp</Label>
                    <Select
                      value={editCustomerType}
                      onValueChange={(val) => {
                        if (val) setEditCustomerType(val as "private" | "business");
                      }}
                    >
                      <SelectTrigger id="edit-customer-type" className="w-full bg-white h-9 text-xs font-medium rounded-none border-[#c8d3d5]">
                        <SelectValue placeholder="Kundentyp wählen">
                          {editCustomerType === "business" ? "Geschäftskunde (Firma / Gastro)" : "Privatkunde"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#c8d3d5]">
                        <SelectItem value="private" label="Privatkunde" className="rounded-none">
                          Privatkunde
                        </SelectItem>
                        <SelectItem value="business" label="Geschäftskunde (Firma / Gastro)" className="rounded-none">
                          Geschäftskunde (Firma / Gastro)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editCustomerType === "business" && (
                    <div className="space-y-3 pt-1 border-t border-border/60">
                      <div className="space-y-1">
                        <Label htmlFor="edit-company" className="text-xs">Firmenname *</Label>
                        <Input
                          id="edit-company"
                          placeholder="z. B. Gasthof Bördeblick GmbH"
                          value={editCompanyName}
                          onChange={(e) => setEditCompanyName(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-[1fr_80px] gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="edit-street" className="text-xs">Straße</Label>
                          <Input id="edit-street" value={editStreet} onChange={(e) => setEditStreet(e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-hnr" className="text-xs">Hausnr.</Label>
                          <Input id="edit-hnr" value={editHouseNumber} onChange={(e) => setEditHouseNumber(e.target.value)} className="h-8 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="edit-zip" className="text-xs">PLZ</Label>
                          <Input id="edit-zip" value={editZipCode} onChange={(e) => setEditZipCode(e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-city" className="text-xs">Ort</Label>
                          <Input id="edit-city" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={loading} className="w-full h-9 font-medium">
                      {loading ? "Speichert..." : "Speichern"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(false)} disabled={loading} className="w-full h-9 font-medium">
                      Abbrechen
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-destructive/20 mt-4">
                    {showDeleteConfirm ? (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl space-y-2.5 text-center animate-in fade-in zoom-in-95 duration-150">
                        <p className="text-xs font-semibold text-destructive">
                          Möchten Sie Ihr Kundenkonto wirklich unwiderruflich löschen?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="w-full h-8 text-xs font-bold"
                            onClick={handleDeleteAccount}
                            disabled={loading}
                          >
                            {loading ? "Löscht..." : "Ja, löschen"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs font-medium"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={loading}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                      >
                        Konto endgültig löschen
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt="Profile"
                        className="size-12 rounded-full border-2 border-primary/20 object-cover"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : "K"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-base text-foreground truncate">
                        {profile?.displayName || "Kunde"}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_2fr] gap-2 text-sm pt-1">
                    <span className="text-muted-foreground font-medium">Name:</span>
                    <span className="font-semibold text-foreground truncate">{profile?.displayName || "-"}</span>

                    <span className="text-muted-foreground font-medium">E-Mail:</span>
                    <span className="font-semibold text-foreground truncate">{user?.email}</span>

                    <span className="text-muted-foreground font-medium">Telefon:</span>
                    <span className="font-semibold text-foreground truncate">{profile?.phoneNumber || "-"}</span>

                    <span className="text-muted-foreground font-medium">Kundentyp:</span>
                    <span className="font-semibold text-foreground">
                      {profile?.customerType === "business" ? "Geschäftskunde" : "Privatkunde"}
                    </span>

                    {profile?.customerType === "business" && profile?.companyName && (
                      <>
                        <span className="text-muted-foreground font-medium">Firma:</span>
                        <span className="font-semibold text-foreground truncate">{profile.companyName}</span>
                      </>
                    )}

                    {(profile?.street || profile?.city) && (
                      <>
                        <span className="text-muted-foreground font-medium">Adresse:</span>
                        <span className="font-semibold text-foreground truncate">
                          {profile.street ? `${profile.street} ${profile.houseNumber || ""}`.trim() : ""}
                          {profile.zipCode || profile.city ? `, ${profile.zipCode || ""} ${profile.city || ""}`.trim() : ""}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="pt-2 border-t mt-3 flex items-center justify-between gap-2">
                    {user?.email && !user.providerData.some((p) => p.providerId === "google.com") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleProfileResetPassword}
                        disabled={loading}
                        className="h-8 text-xs font-semibold rounded-none border-[#c8d3d5] text-[#0f4851] hover:bg-[#eeeeee]"
                      >
                        Passwort ändern
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleEditProfile} className="h-8 text-xs font-medium ml-auto">
                      Profil bearbeiten
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!isEditingProfile && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="size-4 mr-2" />
                Abmelden
              </Button>
            )}
          </div>
        ) : (
          // Login / Register View for Anonymous / Guests
          <>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <UserCheck className="size-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {viewMode === "forgot_password" ? (
              <div className="space-y-4 pt-1">
                <div className="text-left space-y-1">
                  <h3 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Passwort zurücksetzen</h3>
                  <p className="text-xs text-[#505c5f]">
                    Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen sicheren Link per E-Mail, mit dem Sie ein neues Passwort festlegen können.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResetPassword();
                  }}
                  className="space-y-3 pt-2"
                >
                  <div className="space-y-1">
                    <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                      E-Mail-Adresse
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-4 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider h-10 shadow-xs"
                    disabled={loading}
                  >
                    {loading ? "Wird gesendet..." : "Link zum Zurücksetzen anfordern"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs font-bold uppercase tracking-wider text-[#505c5f] hover:text-[#0f4851] rounded-none"
                    onClick={() => {
                      setViewMode("tabs");
                      setError(null);
                    }}
                  >
                    Zurück zum Login
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2 bg-[#eeeeee] border border-[#c8d3d5] rounded-none p-1">
                  <TabsTrigger value="login" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors duration-150">
                    Anmelden
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors duration-150">
                    Neu registrieren
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="register" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="w-full rounded-none border-[#c8d3d5] bg-white font-bold uppercase tracking-wider text-xs h-9 text-[#1a1c1c] hover:bg-[#eeeeee] transition-colors duration-150" onClick={handleGoogleLogin} disabled={loading}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Mit Google fortfahren
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#c8d3d5]" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                      <span className="bg-[#f9f9f9] px-2 text-[#505c5f]">oder mit E-Mail</span>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterOrLink} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">E-Mail-Adresse *</Label>
                      <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        placeholder="name@beispiel.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-pass" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Passwort *</Label>
                        <Input
                          id="reg-pass"
                          name="new-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Min. 6 Zeichen"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg-pass-confirm" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Wiederholen *</Label>
                        <Input
                          id="reg-pass-confirm"
                          name="new-password-confirm"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Passwort wiederholen"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          required
                          minLength={6}
                          className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Vollständiger Name *</Label>
                        <Input
                          id="reg-name"
                          name="name"
                          autoComplete="name"
                          placeholder="Max Mustermann"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg-phone" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Telefonnummer *</Label>
                        <Input
                          id="reg-phone"
                          name="tel"
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="0170 12345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-type" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Kundentyp</Label>
                      <Select value={customerType} onValueChange={(v) => setCustomerType(v as any)}>
                        <SelectTrigger id="reg-type" className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs">
                          <SelectValue placeholder="Kundentyp auswählen" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#c8d3d5]">
                          <SelectItem value="private">Privatkunde</SelectItem>
                          <SelectItem value="business">Geschäftskunde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {customerType === "business" && (
                      <div className="space-y-3 pt-2 border-t border-[#c8d3d5]">
                        <div className="space-y-1">
                          <Label htmlFor="reg-company" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Firmenname *</Label>
                          <Input
                            id="reg-company"
                            name="organization"
                            autoComplete="organization"
                            placeholder="Musterfirma GmbH"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Rechnungsadresse *</Label>
                          <div className="grid grid-cols-[3fr_1fr] gap-2">
                            <Input
                              name="address-line1"
                              autoComplete="street-address"
                              placeholder="Straße"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              required
                              className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                            />
                            <Input
                              name="house-number"
                              autoComplete="address-line2"
                              placeholder="Hausnr."
                              value={houseNumber}
                              onChange={(e) => setHouseNumber(e.target.value)}
                              required
                              className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-[1fr_2fr] gap-2">
                            <Input
                              name="postal-code"
                              autoComplete="postal-code"
                              inputMode="numeric"
                              placeholder="PLZ"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              required
                              className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs tabular-nums"
                            />
                            <Input
                              name="address-level2"
                              autoComplete="address-level2"
                              placeholder="Ort"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              required
                              className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="agb"
                        checked={agbAccepted}
                        onChange={(e) => setAgbAccepted(e.target.checked)}
                        className="mt-1 size-4 rounded-none border-[#c8d3d5] text-[#00A8BC] focus:ring-[#00A8BC]"
                        required
                      />
                      <Label htmlFor="agb" className="text-xs text-[#505c5f] leading-tight">
                        Ich habe die Allgemeinen Geschäftsbedingungen sowie die Datenschutzerklärung gelesen und akzeptiere diese. *
                      </Label>
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider h-10 shadow-xs transition-colors duration-150" disabled={loading}>
                      {loading ? "Wird verarbeitet…" : "Konto erstellen"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="login" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="w-full rounded-none border-[#c8d3d5] bg-white font-bold uppercase tracking-wider text-xs h-9 text-[#1a1c1c] hover:bg-[#eeeeee] transition-colors duration-150" onClick={handleGoogleLogin} disabled={loading}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Mit Google fortfahren
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#c8d3d5]" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                      <span className="bg-[#f9f9f9] px-2 text-[#505c5f]">oder mit E-Mail</span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">E-Mail-Adresse</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        placeholder="name@beispiel.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-pass" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Passwort</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setSuccessMsg(null);
                            setViewMode("forgot_password");
                          }}
                          className="text-[10px] sm:text-xs text-[#00A8BC] hover:underline font-bold uppercase tracking-wider"
                          disabled={loading}
                        >
                          Passwort vergessen?
                        </button>
                      </div>
                      <Input
                        id="login-pass"
                        name="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs"
                      />
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider h-10 shadow-xs transition-colors duration-150" disabled={loading}>
                      {loading ? "Anmeldung läuft…" : "Anmelden"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
