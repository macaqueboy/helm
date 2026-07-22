"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/app");
        router.refresh();
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="border-2 border-brutal-black bg-brutal-red p-3 shadow-brutal-sm">
          <p className="font-mono text-xs font-bold text-white">{error}</p>
        </div>
      )}

      <div>
        <Label htmlFor="email" className="font-mono text-xs uppercase text-brutal-stone">
          Email
        </Label>
        <Input
          name="email"
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 border-2 border-brutal-black bg-white font-body px-3 py-2 text-sm"
          placeholder="tú@email.com"
        />
      </div>

      <div>
        <Label htmlFor="password" className="font-mono text-xs uppercase text-brutal-stone">
          Contraseña
        </Label>
        <Input
          name="password"
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 border-2 border-brutal-black bg-white font-body px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brutal-yellow text-brutal-black border-2 border-brutal-black font-display font-bold shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
      </Button>

      <div className="text-center text-sm font-body text-brutal-stone">
        ¿No tienes cuenta?{" "}
        <a href="/sign-up" className="text-brutal-cyan font-bold hover:underline">
          Regístrate
        </a>
      </div>
    </form>
  );
}
