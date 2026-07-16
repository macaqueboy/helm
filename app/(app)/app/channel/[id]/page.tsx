"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { PixelAvatar } from "@/lib/pixel-avatar";
import { Send, Hash, Bot } from "lucide-react";

type Message = {
  id: string;
  userName?: string;
  userAvatarSeed?: string;
  agentName?: string;
  agentAvatarSeed?: string;
  content: string;
  time: string;
  isAgent: boolean;
};

export default function ChannelPage() {
  const params = useParams<{ id: string }>();
  const channelId = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelName, setChannelName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChannelName = async () => {
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) return;
      const data = await res.json();
      const channel = data.find((c: any) => c.id === channelId);
      if (channel) {
        setChannelName(channel.name);
      }
    } catch (e) {
      // silent
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}`);
      if (!res.ok) return;
      const data = await res.json();
      const next = Array.isArray(data) ? data : [];
      setMessages(
        next.map((m: any) => ({
          id: m.id,
          userName: m.userName ?? "Anónimo",
          userAvatarSeed: m.userAvatarSeed ?? (m.userName ?? "anon"),
          agentName: m.agentName,
          agentAvatarSeed: m.agentAvatarSeed,
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isAgent: !!m.agentId,
        }))
      );
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelName();
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
      fetchChannelName(); // refresh channel name in case it changed
    }, 3000);
    return () => clearInterval(interval);
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), channelId }),
      });
      if (res.ok) {
        setText("");
        // Messages will be re-fetched via polling
      }
    } catch (e) {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brutal-cream">
      {/* Channel header */}
      <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4">
        <Hash className="text-brutal-black mr-2" size={20} />
        <h2 className="font-display font-bold text-lg">{channelName || channelId}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="font-mono text-xs text-brutal-stone">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="font-mono text-xs text-brutal-stone">Sin mensajes aún. ¡Escribe el primero!</p>
        ) : null}

        {messages.map((m) =>
          m.isAgent ? (
            <div key={m.id} className="flex items-start gap-3">
              <div className="relative">
                <PixelAvatar seed={m.agentAvatarSeed ?? m.agentName ?? "agent"} name={m.agentName ?? "Agente"} size={36} />
                <div className="absolute -bottom-1 -right-1 bg-brutal-yellow border-2 border-brutal-black rounded-full p-0.5">
                  <Bot size={12} className="text-brutal-black" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-sm text-brutal-blue">
                    @{m.agentName}
                    <span className="ml-1 font-mono text-xs text-brutal-stone">(agente)</span>
                  </span>
                  <span className="font-mono text-xs text-brutal-stone">{m.time}</span>
                </div>
                <div className="bg-brutal-yellow border-2 border-brutal-black p-2 mt-1 rounded-sm">
                  <p className="font-body text-sm text-brutal-black">{m.content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-3">
              <PixelAvatar seed={m.userAvatarSeed ?? "anon"} name={m.userName ?? "???"} size={36} />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-sm">{m.userName}</span>
                  <span className="font-mono text-xs text-brutal-stone">{m.time}</span>
                </div>
                <p className="font-body text-sm mt-1 text-brutal-black">{m.content}</p>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={onSend} className="border-t-2 border-brutal-black bg-white p-3 flex items-center gap-2">
        <input
          className="flex-1 h-10 border-2 border-brutal-black px-3 font-body text-sm focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending}
          className="h-10 w-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}