"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tos, setTos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || loading) return;

    if (!tos) {
      setError("Debes aceptar los Términos de servicio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/app");
        router.refresh();
      } else {
        setError(data.error || "Error al registrarse");
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
        <Label htmlFor="name" className="font-mono text-xs uppercase text-brutal-stone">
          Nombre
        </Label>
        <Input
          name="name"
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 border-2 border-brutal-black bg-white font-body px-3 py-2 text-sm"
          placeholder="Tu nombre"
        />
      </div>

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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 border-2 border-brutal-black bg-white font-body px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-brutal-black cursor-pointer">
        <input
          type="checkbox"
          checked={tos}
          onChange={(e) => setTos(e.target.checked)}
          className="w-4 h-4 border-2 border-brutal-black"
        />
        <span>Acepto los Términos de servicio</span>
      </label>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brutal-pink text-brutal-black border-2 border-brutal-black font-display font-bold shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrarme"}
      </Button>

      <div className="text-center text-sm font-body text-brutal-stone">
        ¿Ya tienes cuenta?{" "}
        <a href="/sign-in" className="text-brutal-cyan font-bold hover:underline">
          Inicia sesión
        </a>
      </div>
    </form>
  );
}
