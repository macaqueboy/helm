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
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

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
    fetchTasks();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const firstChannel = tasks[0]?.channelId;
    if (!firstChannel) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        channelId: firstChannel,
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
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
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
        <form className="border-b-2 border-brutal-black bg-white p-3 flex gap-2" onSubmit={createTask}>
          <input
            className="flex-1 h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none"
            placeholder="Nueva tarea..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            className="flex-1 h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none"
            placeholder="Descripción (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
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
            <div className="h-10 border-b-2 border-brutal-black bg-brutal-yellow flex items-center px-3 font-display font-bold text-sm">
              {col.label}
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {loading ? (
                <p className="font-mono text-xs text-brutal-stone">Cargando tareas...</p>
              ) : getColumnTasks(col.id).length === 0 ? (
                <p className="font-mono text-xs text-brutal-stone">Sin tareas</p>
              ) : null}

              {getColumnTasks(col.id).map((t) => (
                <div key={t.id} className="border-2 border-brutal-black p-3 shadow-brutal-sm bg-white">
                  <div className="font-display font-bold text-sm mb-1">#{t.number} {t.title}</div>
                  {t.description ? (
                    <div className="font-body text-xs text-brutal-black mb-2">{t.description}</div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-mono text-brutal-stone">
                      {t.ownerAvatarSeed ? (
                        <span className="inline-block h-4 w-4 border border-brutal-black bg-brutal-stone/20" />
                      ) : null}
                      {t.ownerName ?? "Sin asignar"}
                    </div>
                    <div className="flex gap-1">
                      {col.id !== "todo" ? (
                        <button
                          onClick={() => moveTask(t.id, "todo")}
                          className="px-2 py-1 border border-brutal-black bg-white text-xs hover:bg-brutal-cream"
                          title="A por hacer"
                        >
                          ←
                        </button>
                      ) : null}
                      {col.id !== "done" ? (
                        <button
                          onClick={() => moveTask(t.id, "done")}
                          className="px-2 py-1 border border-brutal-black bg-white text-xs hover:bg-brutal-cream"
                          title="Completar"
                        >
                          ✓
                        </button>
                      ) : null}
                      {col.id !== "in_progress" ? (
                        <button
                          onClick={() => moveTask(t.id, "in_progress")}
                          className="px-2 py-1 border border-brutal-black bg-white text-xs hover:bg-brutal-cream"
                          title="En progreso"
                        >
                          →
                        </button>
                      ) : null}
                      <ArrowRightLeft size={12} className="text-brutal-stone mt-1" />
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
