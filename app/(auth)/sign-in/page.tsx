import { signInWithCreds, signUpWithCreds } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function SignInPage() {
  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const result = await signInWithCreds(email, password);
    if (result.ok) redirect("/app");
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email" className="font-mono text-xs uppercase text-brutal-stone">Email</Label>
        <Input name="email" id="email" type="email" required className="mt-1 brutal-input font-body" placeholder="tú@email.com" />
      </div>
      <div>
        <Label htmlFor="password" className="font-mono text-xs uppercase text-brutal-stone">Contraseña</Label>
        <Input name="password" id="password" type="password" required className="mt-1 brutal-input font-body" placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full bg-brutal-yellow text-brutal-black border-2 border-brutal-black font-display font-bold shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
        Iniciar sesión
      </Button>
      <div className="text-center text-sm font-body text-brutal-stone">
        ¿No tienes cuenta? <a href="/sign-up" className="text-brutal-cyan font-bold hover:underline">Regístrate</a>
      </div>
    </form>
  );
}