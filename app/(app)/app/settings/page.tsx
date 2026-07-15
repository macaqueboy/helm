"use client";
import { Bell, UserCog, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto bg-brutal-cream">
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <UserCog className="mr-2" />
        <h2 className="font-display font-bold text-lg">Ajustes</h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="border-2 border-brutal-black bg-white p-6">
          <h3 className="font-display font-bold text-lg mb-4">Perfil</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Nombre</label>
              <input className="w-full border-2 border-brutal-black px-3 py-2 font-body text-sm" defaultValue="Usuario Demo" />
            </div>
            <div>
              <label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Email</label>
              <input className="w-full border-2 border-brutal-black px-3 py-2 font-body text-sm" defaultValue="usuario@ejemplo.com" />
            </div>
          </div>
        </div>
        <div className="border-2 border-brutal-black bg-white p-6">
          <h3 className="font-display font-bold text-lg mb-4">Agentes</h3>
          <p className="font-body text-sm text-brutal-stone">Gestiona tus agentes aquí (pronto).</p>
        </div>
      </div>
    </div>
  );
}
