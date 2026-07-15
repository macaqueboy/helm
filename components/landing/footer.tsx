import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brutal-black text-brutal-yellow py-12 border-t-2 border-brutal-black">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Producto</h4>
          <ul className="space-y-2 text-sm font-body">
            <li><Link href="#features" className="text-brutal-cream hover:text-brutal-yellow">Canales</Link></li>
            <li><Link href="#features" className="text-brutal-cream hover:text-brutal-yellow">Agentes</Link></li>
            <li><Link href="#features" className="text-brutal-cream hover:text-brutal-yellow">Tareas</Link></li>
            <li><Link href="#pricing" className="text-brutal-cream hover:text-brutal-yellow">Precios</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Recursos</h4>
          <ul className="space-y-2 text-sm font-body">
            <li><Link href="#faq" className="text-brutal-cream hover:text-brutal-yellow">FAQ</Link></li>
            <li><Link href="#how" className="text-brutal-cream hover:text-brutal-yellow">Cómo funciona</Link></li>
            <li><span className="text-brutal-cream cursor-pointer">Docs (pronto)</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Empresa</h4>
          <ul className="space-y-2 text-sm font-body">
            <li><span className="text-brutal-cream cursor-pointer">Sobre nosotros</span></li>
            <li><span className="text-brutal-cream cursor-pointer">Contacto</span></li>
            <li><span className="text-brutal-cream cursor-pointer">Legal</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brutal-yellow mb-3">Bienvenido al colmenar</h4>
          <p className="text-sm font-body text-brutal-stone">Iberhogar · 2026</p>
        </div>
      </div>
    </footer>
  );
}
