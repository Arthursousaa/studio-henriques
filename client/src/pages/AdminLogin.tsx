import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";

type Mode = "login" | "register";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Não foi possível acessar o painel.");
        return;
      }
      setLocation("/admin");
    } catch {
      setError("Não foi possível acessar o painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf8f3] px-4 py-10 text-[#342923]">
      <section className="w-full max-w-md rounded-[1.75rem] border border-[#342923]/10 bg-[#fffdf9] p-7 shadow-[0_28px_80px_-42px_rgba(60,37,30,0.55)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a4675d]">Studio Henriques</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.05em]">Área administrativa</h1>
        <p className="mt-3 text-sm leading-6 text-[#705e56]">
          {mode === "login" ? "Entre para gerenciar preços, pedidos e acessos." : "Crie seu acesso. A conta proprietária é reconhecida automaticamente pelo e-mail cadastrado."}
        </p>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          {mode === "register" && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" required minLength={2} value={name} onChange={event => setName(event.target.value)} className="h-11 rounded-xl" /></div>}
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" required type="password" minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} className="h-11 rounded-xl" /><p className="text-xs text-[#8a756d]">Use ao menos 10 caracteres.</p></div>
          {error && <p role="alert" className="rounded-xl bg-[#f6e2df] px-3 py-2 text-sm text-[#8a4239]">{error}</p>}
          <Button disabled={loading} type="submit" className="h-11 w-full rounded-full bg-[#5b3b35] text-[#fffaf2] hover:bg-[#754d45]">{loading ? "Aguarde..." : mode === "login" ? "Entrar no painel" : "Criar acesso"}</Button>
        </form>

        <button type="button" onClick={() => { setMode(current => current === "login" ? "register" : "login"); setError(""); }} className="mt-6 w-full text-center text-sm font-medium text-[#7e4c43] underline-offset-4 hover:underline">
          {mode === "login" ? "Ainda não tem acesso? Criar cadastro" : "Já possui acesso? Entrar"}
        </button>
        <a href="/" className="mt-4 block text-center text-sm text-[#705e56] underline-offset-4 hover:underline">Voltar ao site</a>
      </section>
    </main>
  );
}
