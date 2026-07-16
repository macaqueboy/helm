"use client";

import { useState, useEffect } from "react";
import { UserCog, Bot, Plus, Trash2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MODELS = [
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { value: "glm-5.2", label: "GLM 5.2" },
  { value: "kimi-k2.7-code", label: "Kimi K2.7 Code" },
  { value: "qwen3.7-max", label: "Qwen3.7 Max" },
];

type Agent = {
  id: string;
  name: string;
  description?: string;
  model: string;
  status: string;
  createdAt: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", description: "", model: "deepseek-v4-flash" });
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchAgents();
  }, []);

  async function fetchUserData() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setTempName(data.name);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgents() {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  }

  async function saveName() {
    if (!tempName.trim()) return;
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditingName(false);
      } else {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSavingName(false);
    }
  }

  async function createAgent() {
    if (!newAgent.name.trim()) return;
    setCreatingAgent(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent),
      });
      if (res.ok) {
        const created = await res.json();
        setAgents([...agents, created]);
        setShowCreateAgent(false);
        setNewAgent({ name: "", description: "", model: "deepseek-v4-flash" });
      } else {
        const data = await res.json();
        setError(data.error || "Error al crear agente");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setCreatingAgent(false);
    }
  }

  async function deleteAgent(id: string) {
    setDeletingAgent(id);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setDeletingAgent(null);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      active: "bg-brutal-lime border-brutal-black",
      idle: "bg-brutal-yellow border-brutal-black",
      stuck: "bg-brutal-red border-brutal-black",
      offline: "bg-brutal-stone border-brutal-black",
    };
    const style = styles[status] || styles.idle;
    return (
      <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold uppercase border-2 ${style}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-brutal-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brutal-black" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-brutal-cream">
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <UserCog className="mr-2" />
        <h2 className="font-display font-bold text-lg">Ajustes</h2>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="border-2 border-brutal-red bg-brutal-red-50 p-4">
            <p className="font-mono text-sm text-brutal-red font-bold">{error}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="border-2 border-brutal-black bg-white p-6 shadow-brutal-sm">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center">
            <UserCog className="mr-2" size={18} />
            Perfil
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Nombre</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    className="flex-1 border-2 border-brutal-black px-3 py-2 font-mono text-sm"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveName}
                    disabled={savingName || !tempName.trim()}
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingName(false);
                      setTempName(user?.name || "");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-brutal-yellow border-2 border-brutal-black px-3 py-2">
                  <span className="font-mono text-sm font-bold">{user?.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}>
                    Editar
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Email</Label>
              <div className="bg-brutal-yellow border-2 border-brutal-black px-3 py-2">
                <span className="font-mono text-sm font-bold">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Section */}
        <div className="border-2 border-brutal-black bg-white p-6 shadow-brutal-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg flex items-center">
              <Bot className="mr-2" size={18} />
              Agentes
            </h3>
            <Button variant="default" size="sm" onClick={() => setShowCreateAgent(true)}>
              <Plus className="mr-1 w-4 h-4" />
              Nuevo
            </Button>
          </div>

          {agents.length === 0 ? (
            <div className="border-2 border-dashed border-brutal-stone p-8 text-center">
              <p className="font-mono text-sm text-brutal-stone">No tienes agentes creados yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="border-2 border-brutal-black bg-brutal-cream p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm">{agent.name}</div>
                      {agent.description && (
                        <div className="font-mono text-xs text-brutal-stone truncate max-w-[200px]">
                          {agent.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(agent.status)}
                        <span className="font-mono text-xs text-brutal-stone">{agent.model}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAgent(agent.id)}
                    disabled={deletingAgent === agent.id}
                    className="text-brutal-red hover:bg-brutal-red hover:text-white"
                  >
                    {deletingAgent === agent.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateAgent} onOpenChange={setShowCreateAgent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo agente</DialogTitle>
            <DialogDescription>
              Configura tu nuevo agente con nombre, descripción y modelo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Nombre</Label>
              <Input
                className="border-2 border-brutal-black"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                placeholder="Nombre del agente"
              />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Descripción</Label>
              <Input
                className="border-2 border-brutal-black"
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                placeholder="Descripción (opcional)"
              />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase text-brutal-stone block mb-1">Modelo</Label>
              <select
                className="w-full border-2 border-brutal-black px-3 py-2 font-mono text-sm bg-brutal-cream"
                value={newAgent.model}
                onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateAgent(false)}>
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={createAgent}
              disabled={creatingAgent || !newAgent.name.trim()}
            >
              {creatingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}