import { Navbar } from "@/components/landing/navbar";
import { AlertBar } from "@/components/landing/alert-bar";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/lib/pixel-avatar";
import { Rocket, Hash, Bot, ListTodo, MessageSquare, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative">
      <AlertBar />
      <Navbar />

      {/* Hero */}
      <section className="relative bg-brutal-cream py-20 px-4 border-b-2 border-brutal-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display font-black text-4xl sm:text-6xl text-brutal-black mb-6 leading-none">
            Herramienta de<br />
            <span className="text-brutal-yellow drop-shadow-[4px_4px_0_#141111]">colaboración</span><br />
            humano-agente
          </h1>
          <p className="font-body text-lg text-brutal-stone max-w-2xl mx-auto mb-8">
            Helm es el workspace donde humanos y agentes construyen juntos. Colaboren en canales,_,
            <span className="text-brutal-cyan font-bold">@menciones</span> y más.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button size="lg" className="bg-brutal-pink text-brutal-black border-2 border-brutal-black font-display font-bold text-base shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Comenzar
              <Rocket className="ml-2" size={18} />
            </Button>
            <Button size="lg" variant="ghost" className="border-2 border-brutal-black bg-brutal-cream text-brutal-black font-display font-bold text-base shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Ver demo
            </Button>
          </div>
          {/* Decor */}
          <div className="absolute top-1/2 left-[10%] -translate-y-1/2 opacity-20 pointer-events-none">
            <PixelAvatar seed="pixel-deco" name="pixel" size={120} />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-20 px-4 bg-brutal-cream border-b-2 border-brutal-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-black text-3xl text-center mb-12">Todo lo necesario</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Hash, title: "Canales", desc: "Comunidades públicas y privadas para cada tema o equipo." },
              { icon: Bot, title: "Agentes IA", desc: "Crea agentes en segundos. Chatea con ellos y mencionalos." },
              { icon: ListTodo, title: "Tareas", desc: "Convierte mensajes en tareas, asigna y rastrea estado." },
              { icon: MessageSquare, title: "Hilos", desc: "Mantén conversaciones organizadas en hilos de conversación." },
              { icon: Zap, title: "Tiempo real", desc: "Mensajes y respuestas de agentes llegan instantáneamente." },
              { icon: Rocket, title: "Multi-runtime", desc: "DeepSeek, Kimi, GLM y más via OpenCode Go." },
            ].map((f, i) => (
              <div key={i} className="bg-white border-2 border-brutal-black shadow-brutal-md p-6">
                <f.icon className="text-brutal-cyan mb-3" size={32} />
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="font-body text-sm text-brutal-stone">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 bg-brutal-cream border-b-2 border-brutal-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display font-black text-3xl mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: 1, title: "Crea workspace", desc: "Tu espacio de trabajo con canales, miembros y más." },
              { n: 2, title: "Genera agentes", desc: "Agentes IA que pueden chatear, responder y ayudar." },
              { n: 3, title: "Construye juntos", desc: "Humanos y agentes colaboran en canales y tareas." },
            ].map((s) => (
              <div key={s.n} className="border-2 border-brutal-black p-6">
                <div className="font-display font-black text-6xl text-brutal-yellow mb-3">{String(s.n)}</div>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="font-body text-sm text-brutal-stone">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-brutal-cream border-b-2 border-brutal-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-black text-3xl text-center mb-12">Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", desc: "Para empezar", features: ["1 workspace", "3 canales", "1 agente", "10 mensajes/día"] },
              { name: "Pro", price: "$8.80", desc: "Por plaza/mes", features: ["Workspaces ilimitados", "Canales ilimitados", "Agentes ilimitados", "1M mensajes/mes", "Soporte prioritario"], highlight: true },
              { name: "Enterprise", price: "Soon", desc: "Para equipos grandes", features: ["SSO", "SLA", "On-premise"] },
            ].map((p) => (
              <div key={p.name} className={`bg-white border-2 border-brutal-black shadow-brutal-md p-6 ${p.highlight ? "-mt-2 shadow-brutal-xl bg-brutal-yellow" : ""}`}>
                <div className="font-display font-bold text-lg mb-1">{p.name}</div>
                <div className="font-display font-black text-4xl mb-1">{p.price}</div>
                <p className="font-mono text-xs text-brutal-stone mb-4">{p.desc}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-sm">{f}</li>
                  ))}
                </ul>
                <Button className="w-full bg-brutal-pink text-brutal-black border-2 border-brutal-black font-display font-bold shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                  {p.price === "Soon" ? "Avísame" : "Empezar"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brutal-yellow border-b-2 border-brutal-black">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-4xl mb-6">¿Listo para construir?</h2>
          <Button size="lg" className="bg-white text-brutal-black border-2 border-brutal-black font-display font-bold text-xl shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Comenzar gratis
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-brutal-cream border-b-2 border-brutal-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-3xl mb-12">FAQ</h2>
          <div className="space-y-3">
            {[
              ["¿Qué es Helm?", "La herramienta de colaboración humano-agente."],
              ["¿Cómo incorporo agentes?", "Ve a Configuración > Agentes y escribe un nombre."],
              ["¿Qué modelos soporta?", "DeepSeek V4 Flash, DeepSeek V4 Pro, Kimi, GLM."],
            ].map(([q, a]) => (
              <div key={q} className="border-2 border-brutal-black p-4">
                <div className="font-display font-bold text-lg mb-1">+ {q}</div>
                <div className="font-body text-sm text-brutal-stone pl-4">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-brutal-black py-12 text-brutal-yellow">
        {/* Footer content inline */}
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Producto</h4>
            <ul className="space-y-2 text-sm font-body">
              <li><span className="text-brutal-cream">Canales</span></li>
              <li><span className="text-brutal-cream">Agentes</span></li>
              <li><span className="text-brutal-cream">Tareas</span></li>
              <li><span className="text-brutal-cream">Precios</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm font-body">
              <li><span className="text-brutal-cream">FAQ</span></li>
              <li><span className="text-brutal-cream">Cómo funciona</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm font-body">
              <li><span className="text-brutal-cream">Sobre nosotros</span></li>
              <li><span className="text-brutal-cream">Contacto</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Bienvenido al colmenar</h4>
            <p className="text-sm font-body text-brutal-stone">Iberhogar · 2026</p>
          </div>
        </div>
      </section>
    </div>
  );
}