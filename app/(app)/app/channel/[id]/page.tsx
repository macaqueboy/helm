"use client";
import { useParams } from "next/navigation";
import { PixelAvatar } from "@/lib/pixel-avatar";
import { Send, Hash } from "lucide-react";
import { useState, FormEvent } from "react";

export default function ChannelPage() {
  const params = useParams<{ id: string }>();
  const [messages] = useState<{ id: string; user: string; content: string; time: string }[]>([
    { id: "1", user: "Demo User", content: "¡Hola equipo! Bienvenidos al canal general.", time: "10:30" },
  ]);
  const [text, setText] = useState("");

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-brutal-cream">
      {/* Channel header */}
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <Hash className="text-brutal-black mr-2" size={20} />
        <h2 className="font-display font-bold text-lg">{params.id}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-3">
            <PixelAvatar seed={m.user} name={m.user} size={36} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-sm">{m.user}</span>
                <span className="font-mono text-xs text-brutal-stone">{m.time}</span>
              </div>
              <p className="font-body text-sm mt-1 text-brutal-black">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={onSend} className="border-t-2 border-brutal-black bg-white p-3 flex items-center gap-2">
        <input
          className="flex-1 h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit" className="h-10 w-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
