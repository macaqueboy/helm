"use client";
import { useState, useEffect } from "react";
import { ListTodo, Plus, ArrowRightLeft } from "lucide-react";

type Task = {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  number: number;
  ownerName?: string;
  ownerAvatarSeed?: string;
};

type Channel = {
  id: string;
  name: string;
};

type Column = {
  id: "todo" | "in_progress" | "done";
  label: string;
};

const COLUMNS: Column[] = [
  { id: "todo", label: "Por hacer" },
  { id: "in_progress", label: "En progreso" },
  { id: "done", label: "Hecho" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setChannels(data);
        setSelectedChannelId(data[0].id);
      }
    } catch (e) {
      // silent
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) return;
      const data = await res.json();
      const next: Task[] = Array.isArray(data) ? data : [];
      setTasks(
        next.map((t: any) => ({
          id: t.id,
          channelId: t.channelId,
          title: t.title,
          description: t.description,
          status: t.status === "in-progress" ? "in_progress" : (t.status ?? "todo"),
          number: t.number ?? 0,
          ownerName: t.ownerName,
          ownerAvatarSeed: t.ownerAvatarSeed,
        }))
      );
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchTasks();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetChannelId = selectedChannelId || tasks[0]?.channelId || channels[0]?.id;
    if (!targetChannelId) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        channelId: targetChannelId,
      }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
      fetchTasks();
    }
  };

  const moveTask = async (taskId: string, status: "todo" | "in_progress" | "done") => {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });
    if (res.ok) {
      setTasks((prev: Task[]) => prev.map((t: Task) => (t.id === taskId ? { ...t, status } : t)));
    }
  };

  const getColumnTasks = (status: Column["id"]) => tasks.filter((t) => t.status === status);

  return (
    <div className="h-full overflow-hidden bg-brutal-cream flex flex-col">
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <ListTodo className="mr-2" />
        <h2 className="font-display font-bold text-lg">Tareas</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto h-8 w-8 border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px]"
        >
          <Plus size={14} />
        </button>
      </div>

      {showForm ? (
        <form className="border-b-2 border-brutal-black bg-white p-3 flex flex-wrap gap-2 items-center" onSubmit={createTask}>
          <input
            className="flex-1 min-w-[150px] h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none bg-white"
            placeholder="Nueva tarea..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            className="flex-1 min-w-[150px] h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none bg-white"
            placeholder="Descripción (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          {channels.length > 0 && (
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="h-10 border-2 border-brutal-black px-2 font-mono text-xs bg-brutal-cream"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="h-10 px-4 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] font-display font-bold text-sm"
          >
            Guardar
          </button>
        </form>
      ) : null}

      <div className="flex-1 overflow-x-auto p-4 flex gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="w-72 min-w-[18rem] border-2 border-brutal-black bg-white flex flex-col">
            <div className="h-10 border-b-2 border-brutal-black bg-brutal-yellow flex items-center px-3 font-display font-bold text-sm justify-between">
              <span>{col.label}</span>
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 border border-brutal-black">
                {getColumnTasks(col.id).length}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {loading ? (
                <p className="font-mono text-xs text-brutal-stone">Cargando tareas...</p>
              ) : getColumnTasks(col.id).length === 0 ? (
                <p className="font-mono text-xs text-brutal-stone">Sin tareas</p>
              ) : null}

              {getColumnTasks(col.id).map((t) => (
                <div key={t.id} className="border-2 border-brutal-black p-3 shadow-brutal-sm bg-white hover:border-brutal-blue transition-colors">
                  <div className="font-display font-bold text-sm mb-1">#{t.number} {t.title}</div>
                  {t.description ? (
                    <div className="font-body text-xs text-brutal-black mb-2">{t.description}</div>
                  ) : null}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brutal-stone/20">
                    <div className="flex items-center gap-1 text-xs font-mono text-brutal-stone">
                      {t.ownerName ?? "Sin asignar"}
                    </div>
                    <div className="flex gap-1">
                      {col.id !== "todo" ? (
                        <button
                          onClick={() => moveTask(t.id, "todo")}
                          className="px-2 py-1 border border-brutal-black bg-white text-xs hover:bg-brutal-cream font-bold"
                          title="A por hacer"
                        >
                          ← Todo
                        </button>
                      ) : null}
                      {col.id !== "in_progress" ? (
                        <button
                          onClick={() => moveTask(t.id, "in_progress")}
                          className="px-2 py-1 border border-brutal-black bg-white text-xs hover:bg-brutal-cream font-bold"
                          title="En progreso"
                        >
                          → Progreso
                        </button>
                      ) : null}
                      {col.id !== "done" ? (
                        <button
                          onClick={() => moveTask(t.id, "done")}
                          className="px-2 py-1 border border-brutal-black bg-brutal-yellow text-xs hover:bg-brutal-yellow/80 font-bold"
                          title="Completar"
                        >
                          ✓ Hecho
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
