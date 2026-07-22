"use client";

import { useState, memo } from "react";
import { Play, Code, RefreshCw, Maximize2, X, Check, Copy, Sparkles, Gamepad2 } from "lucide-react";

export const ArtifactCard = memo(function ArtifactCard({
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

  // Detect if code is full self-contained HTML document
  const isFullHtml = htmlCode.trim().toLowerCase().startsWith("<!doctype") || 
                     htmlCode.trim().toLowerCase().includes("<html");

  // Focus and layout helper script to inject
  const helperScript = `
    <script>
      // Auto-focus window on click so space/arrow keys work instantly
      window.addEventListener('mousedown', function() {
        window.focus();
        if (document.activeElement) {
          document.activeElement.blur();
        }
      });
      
      // Prevent spacebar scrolling page when playing inside iframe
      window.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }, { passive: false });

      // Clean default margins/padding if they cause clipping
      if (document.body) {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
      }
    </script>
  `;

  // Construct final srcDoc
  let srcDoc = "";
  if (isFullHtml) {
    // Inject our focus helper script before </body>
    const bodyIndex = htmlCode.toLowerCase().lastIndexOf("</body>");
    if (bodyIndex !== -1) {
      srcDoc = htmlCode.slice(0, bodyIndex) + helperScript + htmlCode.slice(bodyIndex);
    } else {
      srcDoc = htmlCode + helperScript;
    }
  } else {
    srcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: system-ui, sans-serif; background: #fafafa; }
            #container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
          </style>
        </head>
        <body>
          <div id="container">
            ${htmlCode}
          </div>
          ${helperScript}
        </body>
      </html>
    `;
  }

  return (
    <>
      {/* Inline Brutalist Artifact Container */}
      <div className="my-4 border-4 border-brutal-black bg-white shadow-brutal-md overflow-hidden">
        {/* Header Bar */}
        <div className="bg-brutal-yellow border-b-4 border-brutal-black px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brutal-black fill-brutal-black animate-pulse" />
            <span className="font-display font-black text-xs uppercase tracking-wider text-brutal-black">
              ARTIFACT LIVE: {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab switch */}
            <div className="flex border-2 border-brutal-black bg-white overflow-hidden text-[11px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 flex items-center gap-1.5 transition-all ${
                  activeTab === "preview" ? "bg-brutal-black text-white" : "hover:bg-slate-100 text-black"
                }`}
              >
                <Play size={12} />
                <span>Ejecutar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 flex items-center gap-1.5 border-l-2 border-brutal-black transition-all ${
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
                type="button"
                onClick={() => setKey((k) => k + 1)}
                className="p-1.5 bg-white border-2 border-brutal-black hover:bg-slate-100 active:translate-y-0.5 transition-all"
                title="Reiniciar aplicación"
              >
                <RefreshCw size={12} />
              </button>
            )}

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 bg-white border-2 border-brutal-black hover:bg-slate-100 active:translate-y-0.5 transition-all"
              title="Copiar código"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>

            {/* Expand Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 bg-brutal-blue text-white border-2 border-brutal-black hover:opacity-90 active:translate-y-0.5 transition-all"
              title="Pantalla completa"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        {/* Focus guidance helper bar */}
        {activeTab === "preview" && (
          <div className="bg-emerald-100 border-b-2 border-brutal-black px-4 py-1.5 flex items-center gap-2 text-xs font-mono font-bold text-emerald-900">
            <Gamepad2 size={14} className="animate-bounce" />
            <span>🎮 HAZ CLIC DENTRO DEL JUEGO PARA ACTIVAR EL TECLADO (ESPACIO / CLIC)</span>
          </div>
        )}

        {/* Content Body */}
        {activeTab === "preview" ? (
          <div className="relative w-full bg-slate-100 min-h-[500px] flex justify-center items-center overflow-hidden">
            <iframe
              key={key}
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-[620px] border-none bg-white"
              title={title}
            />
          </div>
        ) : (
          <div className="bg-slate-900 p-4 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre">
              <code>{htmlCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Fullscreen Modal Dialog */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-brutal-black shadow-brutal-lg w-full max-w-5xl h-[92vh] flex flex-col rounded-lg overflow-hidden">
            <div className="bg-brutal-yellow border-b-4 border-brutal-black px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-black" />
                <h3 className="font-display font-black text-lg uppercase tracking-wide">
                  ARTIFACT EN PANTALLA COMPLETA: {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKey((k) => k + 1)}
                  className="px-3 py-1 bg-white border-2 border-brutal-black font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100"
                >
                  <RefreshCw size={14} />
                  Reiniciar
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 bg-brutal-red text-white border-2 border-brutal-black rounded hover:opacity-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="bg-emerald-100 border-b-2 border-brutal-black px-6 py-2 flex items-center gap-2 text-xs font-mono font-bold text-emerald-900">
              <Gamepad2 size={16} className="animate-bounce" />
              <span>🎮 HAZ CLIC DENTRO PARA ACTIVAR EL TECLADO (ESPACIO / CLIC / TECLAS)</span>
            </div>
            <div className="flex-1 bg-slate-100 w-full h-full overflow-hidden">
              <iframe
                key={key}
                srcDoc={srcDoc}
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
});
