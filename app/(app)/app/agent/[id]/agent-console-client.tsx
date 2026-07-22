"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function AgentConsoleClient({
  agentName,
  channelId,
}: {
  agentName: string;
  channelId: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setStatus("Enviando orden al agente...");

    try {
      const fullContent = `@${agentName} ${prompt.trim()}`;
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fullContent, channelId }),
      });

      if (res.ok) {
        setStatus("¡Orden procesada correctamente!");
        setPrompt("");
        router.refresh();
      } else {
        setStatus("Error al enviar mensaje");
      }
    } catch (err) {
      setStatus("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {status && (
        <div className="text-[11px] font-mono font-bold text-brutal-cyan border border-brutal-black bg-white p-2">
          {status}
        </div>
      )}
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={`Instrucciones directas para @${agentName}...`}
        className="border-2 border-brutal-black bg-white font-body text-xs p-2 min-h-[80px]"
      />
      <Button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full bg-brutal-yellow text-brutal-black border-2 border-brutal-black font-display font-bold text-xs h-9 shadow-brutal-sm hover:shadow-brutal-md active:shadow-none"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
        ) : (
          <Send className="w-3.5 h-3.5 mr-1" />
        )}
        Ejecutar con @{agentName}
      </Button>
    </form>
  );
}
