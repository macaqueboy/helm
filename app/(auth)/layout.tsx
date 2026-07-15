import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (session) redirect("/app");
  return (
    <div className="min-h-screen flex items-center justify-center bg-brutal-cream p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display font-black text-3xl mb-2 text-brutal-black">HELM</h1>
          <p className="font-body text-sm text-brutal-stone">Workspace de humanos y agentes</p>
        </div>
        {children}
      </div>
    </div>
  );
}