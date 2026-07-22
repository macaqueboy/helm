"use client";

import { useState } from "react";
import { Play, Code, RefreshCw, Maximize2, X, Check, Copy, Sparkles } from "lucide-react";

export function ArtifactCard({
  title,
  htmlCode,
  language = "html",
}: {
  title: string;
  htmlCode: string;
  language?: string;
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // for reloading iframe
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, sans-serif; background: #fafafa; }
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
    </html>
  `;

  return (
    <>
      {/* Inline Brutalist Artifact Container */}
      <div className="my-4 border-2 border-brutal-black bg-white rounded shadow-brutal-sm overflow-hidden">
        {/* Header Bar */}
        <div className="bg-brutal-yellow border-b-2 border-brutal-black px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brutal-black fill-brutal-black" />
            <span className="font-display font-black text-xs uppercase tracking-wider text-brutal-black">
              ARTIFACT LIVE: {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab switch */}
            <div className="flex border-2 border-brutal-black rounded bg-white overflow-hidden text-[11px] font-mono font-bold">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-2.5 py-1 flex items-center gap-1 ${
                  activeTab === "preview" ? "bg-brutal-black text-white" : "hover:bg-slate-100 text-black"
                }`}
              >
                <Play size={12} />
                <span>Vista Previa</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-2.5 py-1 flex items-center gap-1 border-l border-brutal-black ${
                  activeTab === "code" ? "bg-brutal-black text-white" : "hover:bg-slate-100 text-black"
                }`}
              >
                <Code size={12} />
                <span>Código</span>
              </button>
            </div>

            {/* Reload iframe button */}
            {activeTab === "preview" && (
              <button
                onClick={() => setKey((k) => k + 1)}
                className="p-1.5 bg-white border-2 border-brutal-black rounded hover:bg-slate-100 active:translate-y-0.5"
                title="Reiniciar aplicación"
              >
                <RefreshCw size={12} />
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 bg-white border-2 border-brutal-black rounded hover:bg-slate-100 active:translate-y-0.5"
              title="Copiar código"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>

            {/* Expand Fullscreen */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 bg-brutal-blue text-white border-2 border-brutal-black rounded hover:opacity-90 active:translate-y-0.5"
              title="Pantalla completa"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === "preview" ? (
          <div className="relative w-full bg-slate-100 min-h-[380px] max-h-[600px] flex justify-center items-center overflow-hidden">
            <iframe
              key={key}
              srcDoc={iframeContent}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-[450px] border-none bg-white"
              title={title}
            />
          </div>
        ) : (
          <div className="bg-slate-900 p-4 overflow-x-auto max-h-[450px]">
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre">
              <code>{htmlCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Fullscreen Modal Dialog */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-brutal-black shadow-brutal-lg w-full max-w-5xl h-[90vh] flex flex-col rounded-lg overflow-hidden">
            <div className="bg-brutal-yellow border-b-4 border-brutal-black px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-black" />
                <h3 className="font-display font-black text-lg uppercase tracking-wide">
                  ARTIFACT EN PANTALLA COMPLETA: {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKey((k) => k + 1)}
                  className="px-3 py-1 bg-white border-2 border-brutal-black font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100"
                >
                  <RefreshCw size={14} />
                  Reiniciar
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1 bg-brutal-red text-white border-2 border-brutal-black rounded hover:opacity-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 w-full h-full overflow-hidden">
              <iframe
                key={key}
                srcDoc={iframeContent}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full border-none bg-white"
                title={title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
