"use client";
import { useState } from "react";
import { ListTodo, User } from "lucide-react";

export default function TasksPage() {
  const [tasks] = useState<{ id: string; title: string; status: string; owner: string }[]>([
    { id: "1", title: "Crear diseño brutalista", status: "done", owner: "User" },
    { id: "2", title: "Implementar canales", status: "in-progress", owner: "Agent" },
    { id: "3", title: "Configurar agentes AI", status: "todo", owner: "User" },
  ]);

  const columns = [
    { id: "todo", label: "Por hacer" },
    { id: "in-progress", label: "En progreso" },
    { id: "done", label: "Hecho" },
  ];

  return (
    <div className="h-full overflow-hidden bg-brutal-cream flex flex-col">
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <ListTodo className="mr-2" />
        <h2 className="font-display font-bold text-lg">Tareas</h2>
      </div>
      <div className="flex-1 overflow-x-auto p-4 flex gap-4">
        {columns.map((col) => (
          <div key={col.id} className="w-64 min-w-[16rem] border-2 border-brutal-black bg-white">
            <div className="h-10 border-b-2 border-brutal-black bg-brutal-yellow flex items-center px-3 font-display font-bold text-sm">
              {col.label}
            </div>
            <div className="p-3 space-y-3">
              {tasks.filter((t) => t.status === col.id).map((t) => (
                <div key={t.id} className="border-2 border-brutal-black p-3 shadow-brutal-sm">
                  <div className="font-display font-bold text-sm mb-1">{t.title}</div>
                  <div className="flex items-center gap-1 text-xs font-mono text-brutal-stone">
                    <User size={12} /> {t.owner}
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
