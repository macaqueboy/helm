"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Sparkles, RefreshCw, ChevronRight, ChevronLeft, Play, Code, Copy, Check, Send } from "lucide-react";
import { ArtifactCard } from "./artifact-viewer";

type ToolLog = {
  id: string;
  agentName: string;
  toolName: string;
  input: string;
  output: string;
  status: string;
  createdAt: string;
};

type Artifact = {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
};

export default function WorkspaceDrawer({
  channelId,
  onInsertMention,
}: {
  channelId: string;
  onInsertMention: (mention: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "artifacts">("terminal");
  const [logs, setLogs] = useState<ToolLog[]>([]);
  const [artifactsList, setArtifactsList] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/tool-logs?channelId=${channelId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      // silent
    }
  };

  const fetchArtifacts = async () => {
    try {
      const res = await fetch(`/api/artifacts?channelId=${channelId}`);
      if (res.ok) {
        const data = await res.json();
        setArtifactsList(data);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (!channelId) return;
    fetchLogs();
    fetchArtifacts();

    const interval = setInterval(() => {
      fetchLogs();
      fetchArtifacts();
    }, 4000);

    return () => clearInterval(interval);
  }, [channelId]);

  // Group artifacts by slug
  const groupedArtifacts: Record<string, Artifact[]> = {};
  artifactsList.forEach((art) => {
    if (!groupedArtifacts[art.slug]) {
      groupedArtifacts[art.slug] = [];
    }
    groupedArtifacts[art.slug].push(art);
  });

  // Sort groups by latest version
  const uniqueArtifacts = Object.keys(groupedArtifacts).map((slug) => {
    const list = groupedArtifacts[slug].sort((a, b) => b.version - a.version);
    return list[0]; // Return newest version as lead
  });

  const handleSelectArtifact = (art: Artifact) => {
    setSelectedArtifact(art);
    setSelectedVersion(art.version);
  };

  const activeArtifactHistory = selectedArtifact ? groupedArtifacts[selectedArtifact.slug] || [] : [];
  const activeArtifactToShow = selectedArtifact 
    ? activeArtifactHistory.find((a) => a.version === selectedVersion) || selectedArtifact
    : null;

  return (
    <div className="relative flex h-full border-l-2 border-brutal-black bg-white">
      {/* Trigger Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-[-34px] top-4 h-9 w-[34px] border-2 border-r-0 border-brutal-black bg-brutal-yellow flex items-center justify-center shadow-brutal-sm hover:-translate-x-[2px] active:translate-x-0 transition-all rounded-l-md z-30"
        title={isOpen ? "Cerrar consola" : "Abrir consola de laboratorio"}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} className="animate-pulse" />}
      </button>

      {/* Drawer Body Panel */}
      <div
        className={`h-full flex flex-col transition-all duration-300 overflow-hidden ${
          isOpen ? "w-[450px]" : "w-0 border-l-0"
        }`}
      >
        {/* Header Tabs */}
        <div className="h-14 border-b-2 border-brutal-black bg-brutal-stone/10 flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex border-2 border-brutal-black bg-white overflow-hidden font-display text-xs font-bold uppercase rounded">
            <button
              onClick={() => {
                setActiveTab("terminal");
                setSelectedArtifact(null);
              }}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${
                activeTab === "terminal" && !selectedArtifact
                  ? "bg-brutal-black text-white"
                  : "hover:bg-slate-100 text-black"
              }`}
            >
              <Terminal size={14} />
              <span>Consola AI</span>
            </button>
            <button
              onClick={() => setActiveTab("artifacts")}
              className={`px-3 py-1.5 flex items-center gap-1.5 border-l-2 border-brutal-black transition-all ${
                activeTab === "artifacts" || selectedArtifact
                  ? "bg-brutal-black text-white"
                  : "hover:bg-slate-100 text-black"
              }`}
            >
              <Sparkles size={14} />
              <span>Artifacts ({uniqueArtifacts.length})</span>
            </button>
          </div>

          <span className="text-[10px] font-mono font-black border-2 border-brutal-black px-1.5 py-0.5 bg-white uppercase">
            LAB_MODE
          </span>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto bg-brutal-cream p-4">
          {/* Terminal Console Tab */}
          {activeTab === "terminal" && !selectedArtifact && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-xs uppercase text-brutal-black">
                  🖥️ Ejecuciones de herramientas en vivo
                </h3>
                <span className="text-[10px] font-mono text-brutal-stone animate-pulse">● ESCUCHANDO</span>
              </div>

              {logs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-brutal-black p-6 bg-white">
                  <Terminal size={32} className="text-brutal-stone mb-2 animate-pulse" />
                  <p className="font-mono text-[11px] text-brutal-stone text-center uppercase">
                    Consola vacía. Menciona a un agente para ver sus procesos en vivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-mono text-[11px] bg-slate-950 p-4 border-2 border-brutal-black shadow-brutal-sm text-slate-300 rounded overflow-y-auto max-h-[70vh]">
                  {logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-800 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                        <span>⚡ @{log.agentName}</span>
                        <span className="text-slate-500 text-[9px]">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-amber-400 font-bold mb-0.5">
                        &gt; {log.toolName}({log.input})
                      </div>
                      <div className="text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto pl-2 border-l border-slate-700 mt-1 font-mono leading-relaxed bg-black/40 p-2 rounded">
                        {log.output || "Retorno vacío"}
                      </div>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </div>
          )}

          {/* Artifacts Registry Tab */}
          {(activeTab === "artifacts" || selectedArtifact) && (
            <div className="space-y-4">
              {/* Inside Detail View of an Artifact */}
              {activeArtifactToShow ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedArtifact(null)}
                    className="font-mono text-xs font-bold text-brutal-stone hover:text-black flex items-center gap-1 mb-2"
                  >
                    &larr; Volver al listado
                  </button>

                  <div className="border-2 border-brutal-black bg-white p-3 flex flex-wrap items-center justify-between gap-2 shadow-brutal-xs">
                    <div>
                      <h4 className="font-display font-black text-sm uppercase text-brutal-black">
                        {activeArtifactToShow.title}
                      </h4>
                      <span className="font-mono text-[10px] text-brutal-stone">
                        ID: @artifact:{activeArtifactToShow.slug}
                      </span>
                    </div>

                    {/* Version Selector */}
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span>Versión:</span>
                      <select
                        value={selectedVersion}
                        onChange={(e) => setSelectedVersion(Number(e.target.value))}
                        className="border-2 border-brutal-black font-bold bg-white px-1 py-0.5"
                      >
                        {activeArtifactHistory.map((a) => (
                          <option key={a.id} value={a.version}>
                            v{a.version}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onInsertMention(`@coder actualiza #artifact:${activeArtifactToShow.slug} con `)}
                      className="flex-1 h-9 bg-brutal-yellow text-brutal-black font-display font-bold text-xs uppercase border-2 border-brutal-black flex items-center justify-center gap-2 shadow-brutal-sm hover:translate-y-[-1px] active:translate-y-0"
                    >
                      <Send size={12} />
                      <span>Modificar en Chat</span>
                    </button>
                  </div>

                  {/* Sandbox Frame */}
                  <ArtifactCard
                    title={`${activeArtifactToShow.title} (v${selectedVersion})`}
                    htmlCode={activeArtifactToShow.content}
                  />
                </div>
              ) : (
                /* Main List View */
                <div>
                  <h3 className="font-display font-bold text-xs uppercase text-brutal-black mb-3">
                    📦 Aplicaciones y Artifacts Generados ({uniqueArtifacts.length})
                  </h3>

                  {uniqueArtifacts.length === 0 ? (
                    <div className="border-2 border-dashed border-brutal-black p-6 bg-white text-center">
                      <Sparkles size={32} className="text-brutal-stone mx-auto mb-2" />
                      <p className="font-mono text-xs text-brutal-stone uppercase">
                        Sin artifacts aún. ¡Pide un juego o app en el chat!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uniqueArtifacts.map((art) => (
                        <div
                          key={art.id}
                          className="border-2 border-brutal-black bg-white p-4 shadow-brutal-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-md transition-all cursor-pointer flex justify-between items-center"
                          onClick={() => handleSelectArtifact(art)}
                        >
                          <div>
                            <h4 className="font-display font-black text-sm uppercase text-brutal-black">
                              {art.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-[10px] text-brutal-stone">
                                @artifact:{art.slug}
                              </span>
                              <span className="bg-brutal-lime border border-brutal-black text-[9px] px-1 font-mono font-bold">
                                v{groupedArtifacts[art.slug]?.length || 1}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-brutal-black shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
