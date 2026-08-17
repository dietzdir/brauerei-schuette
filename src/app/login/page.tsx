"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { loginWithEmailPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await loginWithEmailPassword(email, password);
      // Verify admin claim
      const idTokenResult = await loggedInUser.getIdTokenResult(true);
      if (!idTokenResult.claims.admin) {
        setError("Dieses Konto besitzt keine Administrator-Rechte.");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email"
      ) {
        setError("Ungültige E-Mail-Adresse oder falsches Passwort.");
      } else {
        setError("Anmeldung fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f9f9f9]">
      <div className="w-full max-w-md space-y-8 rounded-none bg-white p-8 border border-[#c8d3d5] shadow-xs">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#0f4851]/10 text-[#0f4851] text-xs font-bold uppercase tracking-widest mb-2">
            Verwaltung
          </div>
          <h2 className="font-heading text-3xl uppercase tracking-wider text-[#0f4851]">Admin Login</h2>
          <p className="text-xs font-medium uppercase tracking-wider text-[#505c5f]">
            Bitte melde dich an, um auf das Dashboard zuzugreifen.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-none bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">E-Mail Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="info@rottmersleber-brauerei.de"
                className="bg-white rounded-none border-[#c8d3d5] h-10 text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-white rounded-none border-[#c8d3d5] h-10 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider h-11 shadow-xs"
            disabled={loading}
          >
            {loading ? "Anmeldung läuft..." : "Anmelden"}
          </Button>
        </form>
      </div>
    </div>
  );
}
