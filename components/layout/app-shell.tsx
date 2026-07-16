"use client";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { PixelAvatar } from "@/lib/pixel-avatar";
import Link from "next/link";
import {
  LayoutDashboard,
  Hash,
  MessageSquare,
  Settings,
  LogOut,
  User,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppShell({
  children,
  workspace,
  channels,
  agents,
  currentChannelId,
  user,
}: {
  children: React.ReactNode;
  workspace: { id: string; name: string; avatarSeed: string };
  channels: { id: string; name: string; isPrivate: boolean }[];
  agents: { id: string; name: string; status: string }[];
  currentChannelId?: string;
  user: { id: string; name: string; email: string; avatarSeed: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const publicChannels = channels.filter((c) => !c.isPrivate);

  async function onSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/sign-in");
  }

  async function createChannel() {
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName.trim(), isPrivate: false }),
      });
      if (res.ok) {
        setShowCreateChannel(false);
        setNewChannelName("");
        router.refresh();
      }
    } catch (err) {
      console.error("Error creating channel:", err);
    } finally {
      setCreatingChannel(false);
    }
  }

  return (
    <div className="grid h-screen w-screen" style={{ gridTemplateColumns: "240px 1fr" }}>
      {/* Left sidebar */}
      <aside className="h-full border-r-2 border-brutal-black bg-brutal-white flex flex-col overflow-hidden">
        {/* Workspace header */}
        <div className="px-3 py-3 border-b-2 border-brutal-black bg-brutal-yellow">
          <div className="flex items-center gap-2">
            <PixelAvatar seed={workspace.avatarSeed} name={workspace.name} size={28} rounded />
            <div className="min-w-0">
              <div className="font-display font-bold text-xs uppercase tracking-wide truncate leading-none">
                {workspace.name}
              </div>
              <div className="text-[10px] font-mono text-brutal-stone mt-1 truncate">
                WORKSPACE
              </div>
            </div>
          </div>
        </div>

        {/* Workspace switcher / nav */}
        <nav className="px-2 py-2 space-y-1 overflow-y-auto flex-1">
          <Button
            variant={pathname === "/app" ? "default" : "ghost"}
            className="w-full justify-start h-9 px-2 font-display text-xs uppercase"
            onClick={() => router.push("/app")}
          >
            <LayoutDashboard size={14} className="mr-2" />
            Inicio
          </Button>

          <div className="px-2 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono text-brutal-stone uppercase tracking-widest">
              Canales
            </span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="w-6 h-6 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center hover:shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
              title="Crear canal"
            >
              <Plus size={14} className="text-black" />
            </button>
          </div>
          {publicChannels.map((c) => (
            <Button
              key={c.id}
              variant={currentChannelId === c.id ? "default" : "ghost"}
              className="w-full justify-start h-8 px-2 font-mono text-xs"
              onClick={() => router.push(`/app/channel/${c.id}`)}
            >
              <Hash size={12} className="mr-2" />
              <span className="truncate">{c.name}</span>
            </Button>
          ))}

          <div className="px-2 pt-3 pb-1 text-[10px] font-mono text-brutal-stone uppercase tracking-widest">
            Agentes
          </div>
          {agents.map((a) => (
            <Button
              key={a.id}
              variant="ghost"
              className="w-full justify-start h-8 px-2 font-mono text-xs"
              onClick={() => router.push(`/app/agent/${a.id}`)}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  a.status === "active"
                    ? "bg-brutal-lime"
                    : a.status === "stuck"
                    ? "bg-brutal-red"
                    : "bg-brutal-stone"
                }`}
              />
              <span className="truncate">{a.name}</span>
            </Button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t-2 border-brutal-black px-2 py-2 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-8 px-2 font-mono text-xs"
            onClick={() => router.push("/app/settings")}
          >
            <Settings size={14} className="mr-2" />
            Ajustes
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-8 px-2 font-mono text-xs text-brutal-red"
            onClick={onSignOut}
          >
            <LogOut size={14} className="mr-2" />
            Salir
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="h-full overflow-hidden bg-brutal-cream flex flex-col">
        {children}
      </main>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo canal</DialogTitle>
            <DialogDescription>
              Ingresa el nombre para tu nuevo canal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Nombre</Label>
              <Input
                className="border-2 border-brutal-black"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Nombre del canal"
                onKeyDown={(e) => e.key === "Enter" && createChannel()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateChannel(false)}>
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={createChannel}
              disabled={creatingChannel || !newChannelName.trim()}
            >
              {creatingChannel ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}