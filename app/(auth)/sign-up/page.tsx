import { signUpWithCreds, signInWithCreds } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const name = String(formData.get("name"));
    const tos = formData.get("tos") === "on";
    if (!tos) {
      alert("Debes aceptar los Términos de servicio.");
      return;
    }
    const result = await signUpWithCreds(email, password, name);
    if (result.ok) redirect("/app");
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name" className="font-mono text-xs uppercase text-brutal-stone">Nombre</Label>
        <Input name="name" id="name" type="text" required className="mt-1 brutal-input font-body" placeholder="Tu nombre" />
      </div>
      <div>
        <Label htmlFor="email" className="font-mono text-xs uppercase text-brutal-stone">Email</Label>
        <Input name="email" id="email" type="email" required className="mt-1 brutal-input font-body" placeholder="tú@email.com" />
      </div>
      <div>
        <Label htmlFor="password" className="font-mono text-xs uppercase text-brutal-stone">Contraseña</Label>
        <Input name="password" id="password" type="password" required className="mt-1 brutal-input font-body" minLength={6} placeholder="••••••••" />
      </div>
      <label className="flex items-start gap-2 font-body text-sm text-brutal-stone">
        <input type="checkbox" name="tos" className="mt-1" />
        <span>Acepto los Términos de servicio</span>
      </label>
      <Button type="submit" className="w-full bg-brutal-pink text-brutal-black border-2 border-brutal-black font-display font-bold shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
        Registrarme
      </Button>
      <div className="text-center text-sm font-body text-brutal-stone">
        ¿Ya tienes cuenta? <a href="/sign-in" className="text-brutal-cyan font-bold hover:underline">Inicia sesión</a>
      </div>
    </form>
  );
}