"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { PixelAvatar } from "@/lib/pixel-avatar";
import { Send, Hash, Bot, Sparkles, Terminal, Search, ShieldCheck } from "lucide-react";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import WorkspaceDrawer from "@/components/chat/workspace-drawer";

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

const AGENT_THEMES: Record<string, { bg: string; badgeBg: string; text: string; icon: any }> = {
  helm: {
    bg: "bg-sky-50 border-2 border-brutal-black shadow-brutal-xs",
    badgeBg: "bg-sky-300 text-sky-950 border border-brutal-black",
    text: "text-sky-900",
    icon: Sparkles,
  },
  coder: {
    bg: "bg-emerald-50 border-2 border-brutal-black shadow-brutal-xs",
    badgeBg: "bg-emerald-300 text-emerald-950 border border-brutal-black",
    text: "text-emerald-900",
    icon: Terminal,
  },
  scout: {
    bg: "bg-amber-50 border-2 border-brutal-black shadow-brutal-xs",
    badgeBg: "bg-amber-300 text-amber-950 border border-brutal-black",
    text: "text-amber-900",
    icon: Search,
  },
  reviewer: {
    bg: "bg-purple-50 border-2 border-brutal-black shadow-brutal-xs",
    badgeBg: "bg-purple-300 text-purple-950 border border-brutal-black",
    text: "text-purple-900",
    icon: ShieldCheck,
  },
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
  const initialLoadedRef = useRef(false);
  const userSentRef = useRef(false);

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
      const parsed: Message[] = next.map((m: any) => ({
        id: m.id,
        userName: m.userName ?? "Anónimo",
        userAvatarSeed: m.userAvatarSeed ?? (m.userName ?? "anon"),
        agentName: m.agentName,
        agentAvatarSeed: m.agentAvatarSeed,
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAgent: !!m.agentId,
      }));

      // PREVENT RE-RENDERING IF MESSAGES ARE IDENTICAL (Prevents iframe reload / game reset)
      setMessages((prev) => {
        if (
          prev.length === parsed.length &&
          prev.every((msg, i) => msg.id === parsed[i].id && msg.content === parsed[i].content)
        ) {
          return prev; // Return exact same array reference -> NO React re-render
        }

        // Only scroll if new message was appended and user was near bottom or sent it
        if (!initialLoadedRef.current || userSentRef.current) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
          initialLoadedRef.current = true;
          userSentRef.current = false;
        }

        return parsed;
      });
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialLoadedRef.current = false;
    fetchChannelName();
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [channelId]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    userSentRef.current = true; // flag to scroll down when sent
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), channelId }),
      });
      if (res.ok) {
        setText("");
        fetchMessages();
      }
    } catch (e) {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-brutal-cream overflow-hidden">
      {/* Left Pane: Chat Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Channel header */}
        <div className="h-14 border-b-2 border-brutal-black bg-white flex items-center px-4 shadow-brutal-xs z-10">
          <Hash className="text-brutal-black mr-2" size={20} />
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">{channelName || channelId}</h2>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="font-mono text-xs text-brutal-stone">Cargando conversación...</p>
          ) : messages.length === 0 ? (
            <p className="font-mono text-xs text-brutal-stone">Sin mensajes aún. ¡Escribe el primero para comenzar con el equipo de agentes!</p>
          ) : null}

          {messages.map((m) => {
            if (m.isAgent) {
              const agentKey = m.agentName?.toLowerCase() || "";
              const theme = AGENT_THEMES[agentKey] || {
                bg: "bg-brutal-yellow border-2 border-brutal-black shadow-brutal-xs",
                badgeBg: "bg-brutal-black text-white",
                text: "text-brutal-black",
                icon: Bot,
              };
              const Icon = theme.icon;

              return (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <PixelAvatar seed={m.agentAvatarSeed ?? m.agentName ?? "agent"} name={m.agentName ?? "Agente"} size={40} rounded />
                    <div className="absolute -bottom-1 -right-1 bg-white border-2 border-brutal-black rounded-full p-0.5 shadow-brutal-xs">
                      <Icon size={12} className="text-brutal-black" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-sm text-brutal-black">
                        @{m.agentName}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase rounded ${theme.badgeBg}`}>
                        AGENTE AI
                      </span>
                      <span className="font-mono text-xs text-brutal-stone">{m.time}</span>
                    </div>
                    <div className={`p-4 rounded-sm ${theme.bg}`}>
                      <MarkdownMessage content={m.content} />
                    </div>
                  </div>
                </div>
              );
            }

            // User message
            return (
              <div key={m.id} className="flex items-start gap-3">
                <div className="shrink-0">
                  <PixelAvatar seed={m.userAvatarSeed ?? "anon"} name={m.userName ?? "User"} size={40} rounded />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-sm text-brutal-black">{m.userName}</span>
                    <span className="font-mono text-xs text-brutal-stone">{m.time}</span>
                  </div>
                  <div className="bg-white border-2 border-brutal-black p-3 rounded-sm shadow-brutal-xs">
                    <MarkdownMessage content={m.content} />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={onSend} className="border-t-2 border-brutal-black bg-white p-3 flex items-center gap-2">
          <input
            className="flex-1 h-11 border-2 border-brutal-black px-4 font-body text-sm focus:outline-none focus:bg-amber-50"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje o menciona a @coder, @scout, @reviewer, @helm..."
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="h-11 px-5 bg-brutal-yellow border-2 border-brutal-black font-display font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none disabled:opacity-50 transition-all"
          >
            <span>Enviar</span>
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Right Pane: Slide-out Laboratory Workspace & Artifacts Hub */}
      <WorkspaceDrawer
        channelId={String(channelId)}
        onInsertMention={(mention) => setText((prev) => prev + mention)}
      />
    </div>
  );
}
