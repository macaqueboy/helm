"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "code";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 border-2 border-brutal-black bg-slate-900 rounded overflow-hidden shadow-brutal-sm">
      <div className="bg-slate-800 border-b-2 border-brutal-black px-3 py-1.5 flex justify-between items-center text-xs font-mono text-slate-300">
        <span className="uppercase font-bold tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors bg-slate-700 hover:bg-slate-600 border border-slate-500 px-2 py-0.5 rounded text-[11px]"
        >
          {copied ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none font-body text-sm text-brutal-black leading-normal space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display font-black text-base uppercase border-b-2 border-brutal-black pb-1 mt-3 mb-2 tracking-wide">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display font-bold text-sm uppercase mt-3 mb-1.5 border-b border-brutal-black/30 pb-0.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display font-bold text-xs uppercase mt-2 mb-1 text-brutal-black/80">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed font-normal">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-1 font-body">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-1 font-body">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold text-brutal-black bg-amber-200/50 px-1 py-0.5 rounded">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brutal-black pl-3 py-1 my-2 bg-black/5 italic font-serif">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border-2 border-brutal-black shadow-brutal-xs">
              <table className="min-w-full divide-y-2 divide-brutal-black text-xs font-mono">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-brutal-yellow uppercase font-bold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y border-brutal-black bg-white">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="px-3 py-1.5 text-left border-r-2 border-brutal-black last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="px-3 py-1.5 border-r border-brutal-black/30 last:border-r-0">{children}</td>,
          code({ node, inline, className, children, ...props }: any) {
            if (inline) {
              return (
                <code
                  className="bg-black/10 border border-brutal-black/40 px-1.5 py-0.5 rounded font-mono text-xs font-bold text-purple-900"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
