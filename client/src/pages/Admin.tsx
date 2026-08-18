import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Inbox,
  LockKeyhole,
  Save,
  Settings2,
  ShieldCheck,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const statusLabel = {
  requested: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
} as const;

const statusClass = {
  requested: "bg-[#f8e7bd] text-[#795313]",
  confirmed: "bg-[#dcecdf] text-[#32633c]",
  completed: "bg-[#dce7f3] text-[#345f86]",
  cancelled: "bg-[#f2dfdd] text-[#8a4239]",
} as const;

function displayPrice(price: string) {
  const value = Number(price);
  if (!value) return "A definir";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function Admin() {
  return (
    <DashboardLayout>
      <AdminContent />
    </DashboardLayout>
  );
}

function AdminContent() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [draftPrices, setDraftPrices] = useState<Record<number, string>>({});
  const isAdmin = user?.role === "admin";
  const accessQuery = trpc.admin.access.useQuery(undefined, { enabled: isAdmin });
  const servicesQuery = trpc.admin.services.useQuery(undefined, { enabled: isAdmin });
  const bookingsQuery = trpc.admin.bookings.useQuery(undefined, { enabled: isAdmin });
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: isAdmin });
  const updateService = trpc.admin.updateService.useMutation({
    onSuccess: () => {
      toast.success("Serviço atualizado.");
      utils.admin.services.invalidate();
      utils.studio.services.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o serviço."),
  });
  const updateBooking = trpc.admin.updateBookingStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do agendamento atualizado.");
      utils.admin.bookings.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o agendamento."),
  });
  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Acesso administrativo atualizado.");
      utils.admin.users.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o acesso."),
  });

  useEffect(() => {
    if (!servicesQuery.data) return;
    setDraftPrices(current => {
      const next = { ...current };
      servicesQuery.data.forEach(service => {
        if (next[service.id] === undefined) next[service.id] = service.price;
      });
      return next;
    });
  }, [servicesQuery.data]);

  const bookings = bookingsQuery.data ?? [];
  const stats = useMemo(() => ({
    pending: bookings.filter(booking => booking.status === "requested").length,
    confirmed: bookings.filter(booking => booking.status === "confirmed").length,
    completed: bookings.filter(booking => booking.status === "completed").length,
  }), [bookings]);

  if (loading) return null;

  if (!isAdmin) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-8 text-center shadow-[0_20px_50px_-35px_rgba(60,37,30,0.45)]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f2e2d7] text-[#92554a]"><LockKeyhole className="h-5 w-5" /></span>
          <h1 className="mt-5 font-serif text-3xl tracking-[-0.04em]">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-[#705e56]">Este painel é reservado à administradora do Studio Henriques.</p>
          <Button asChild className="mt-6 rounded-full bg-[#5b3b35] text-[#fffaf2] hover:bg-[#754d45]"><a href="/">Voltar ao site</a></Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-1 py-3 sm:px-3">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a4675d]">Área administrativa</p>
          <h1 className="mt-2 font-serif text-4xl tracking-[-0.045em] text-[#342923]">Olá, Jaqueline.</h1>
          <p className="mt-2 text-sm text-[#705e56]">Acompanhe os pedidos e mantenha seus serviços atualizados.</p>
        </div>
        <Button asChild variant="outline" className="rounded-full border-[#5b3b35]/20 bg-[#fffdf9] text-[#5b3b35] hover:bg-[#f3e4da]"><a href="/" target="_blank" rel="noreferrer">Ver site público <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Inbox className="h-5 w-5" />} label="Novas solicitações" value={stats.pending} tone="rose" />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Confirmados" value={stats.confirmed} tone="sage" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Concluídos" value={stats.completed} tone="blue" />
      </section>

      <section className="rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-5 shadow-[0_20px_50px_-42px_rgba(60,37,30,0.48)] sm:p-7">
        <div className="flex flex-col justify-between gap-3 border-b border-[#342923]/10 pb-5 sm:flex-row sm:items-center">
          <div><div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[#a4675d]" /><h2 className="font-serif text-2xl tracking-[-0.035em]">Serviços e preços</h2></div><p className="mt-1 text-sm text-[#705e56]">Edite os valores e defina o que ficará visível para as clientes.</p></div>
          <Badge className="w-fit rounded-full bg-[#f3e4da] px-3 py-1 text-[#7e4c43] hover:bg-[#f3e4da]">Alterações aparecem no site</Badge>
        </div>
        <div className="mt-2 divide-y divide-[#342923]/10">
          {servicesQuery.isLoading && <p className="py-8 text-sm text-[#705e56]">Carregando serviços...</p>}
          {servicesQuery.data?.map(service => {
            const draft = draftPrices[service.id] ?? service.price;
            return (
              <div key={service.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_160px_150px] lg:items-center">
                <div><p className="font-semibold text-[#342923]">{service.name}</p><p className="mt-1 text-sm text-[#705e56]">{service.description}</p></div>
                <div><label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8a756d]" htmlFor={`price-${service.id}`}>Preço em R$</label><Input id={`price-${service.id}`} inputMode="decimal" value={draft} onChange={event => setDraftPrices(current => ({ ...current, [service.id]: event.target.value.replace(",", ".") }))} className="mt-1 h-10 rounded-xl border-[#342923]/15 bg-white" /></div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button size="sm" disabled={updateService.isPending} onClick={() => updateService.mutate({ id: service.id, price: draft || "0", isActive: service.isActive })} className="h-10 rounded-full bg-[#5b3b35] px-4 text-[#fffaf2] hover:bg-[#754d45]"><Save className="mr-1.5 h-3.5 w-3.5" />Salvar</Button>
                  <Button size="sm" variant="outline" disabled={updateService.isPending} onClick={() => updateService.mutate({ id: service.id, price: draft || "0", isActive: !service.isActive })} className="h-10 rounded-full border-[#342923]/15 bg-white px-4 text-[#5b3b35] hover:bg-[#f3e4da]">{service.isActive ? "Ocultar" : "Exibir"}</Button>
                </div>
                <p className="text-xs text-[#8a756d] lg:col-start-2 lg:col-end-4">Exibido atualmente: {displayPrice(service.price)} · {service.isActive ? "ativo" : "oculto"}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-5 shadow-[0_20px_50px_-42px_rgba(60,37,30,0.48)] sm:p-7">
        <div className="flex flex-col justify-between gap-3 border-b border-[#342923]/10 pb-5 sm:flex-row sm:items-center">
          <div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#a4675d]" /><h2 className="font-serif text-2xl tracking-[-0.035em]">Acesso ao painel</h2></div><p className="mt-1 max-w-2xl text-sm leading-6 text-[#705e56]">Depois que Jaqueline entrar uma vez pelo botão “Área da Jaqueline”, a conta dela aparecerá aqui. A proprietária pode promovê-la a administradora.</p></div>
          <Badge className="w-fit rounded-full bg-[#f3e4da] px-3 py-1 text-[#7e4c43] hover:bg-[#f3e4da]">Somente a proprietária altera acessos</Badge>
        </div>
        <div className="mt-2 divide-y divide-[#342923]/10">
          {usersQuery.isLoading && <p className="py-8 text-sm text-[#705e56]">Carregando contas...</p>}
          {usersQuery.data?.map(account => (
            <div key={account.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-[#342923]">{account.name || "Sem nome"}</p><p className="mt-1 text-sm text-[#705e56]">{account.email || "E-mail não informado"}</p></div>
              <div className="flex items-center gap-3"><Badge className={`rounded-full px-3 py-1 ${account.role === "admin" ? "bg-[#dcecdf] text-[#32633c]" : "bg-[#f1ece7] text-[#705e56]"}`}>{account.role === "admin" ? "Administradora" : "Usuária"}</Badge>{accessQuery.data?.isProjectOwner && <Button size="sm" disabled={updateUserRole.isPending || account.role === "admin"} onClick={() => updateUserRole.mutate({ id: account.id, role: "admin" })} className="h-10 rounded-full bg-[#5b3b35] px-4 text-[#fffaf2] hover:bg-[#754d45]"><UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />Tornar admin</Button>}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-5 shadow-[0_20px_50px_-42px_rgba(60,37,30,0.48)] sm:p-7">
        <div className="border-b border-[#342923]/10 pb-5"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#a4675d]" /><h2 className="font-serif text-2xl tracking-[-0.035em]">Solicitações de agendamento</h2></div><p className="mt-1 text-sm text-[#705e56]">Cada pedido também abre uma conversa para você confirmar a disponibilidade com a cliente.</p></div>
        <div className="mt-2 divide-y divide-[#342923]/10">
          {bookingsQuery.isLoading && <p className="py-8 text-sm text-[#705e56]">Carregando solicitações...</p>}
          {!bookingsQuery.isLoading && bookings.length === 0 && <div className="py-12 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f2e2d7] text-[#92554a]"><Clock3 className="h-5 w-5" /></span><p className="mt-4 font-semibold">Ainda não há solicitações.</p><p className="mt-1 text-sm text-[#705e56]">Quando uma cliente pedir horário pelo site, ela aparecerá aqui.</p></div>}
          {bookings.map(booking => (
            <article key={booking.id} className="grid gap-4 py-5 lg:grid-cols-[1.1fr_0.8fr_0.9fr_160px] lg:items-center">
              <div><p className="font-semibold text-[#342923]">{booking.customerName}</p><p className="mt-1 text-sm text-[#705e56]">{booking.serviceName} · {booking.customerPhone}</p>{booking.notes && <p className="mt-2 text-xs leading-5 text-[#8a756d]">“{booking.notes}”</p>}</div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8a756d]">Horário pedido</p><p className="mt-1 text-sm font-medium text-[#5b3b35]">{formatDate(booking.scheduledAt)}</p></div>
              <div><Badge className={`rounded-full px-3 py-1 ${statusClass[booking.status]}`}>{statusLabel[booking.status]}</Badge></div>
              <select aria-label={`Alterar status de ${booking.customerName}`} value={booking.status} onChange={event => updateBooking.mutate({ id: booking.id, status: event.target.value as keyof typeof statusLabel })} disabled={updateBooking.isPending} className="h-10 rounded-xl border border-[#342923]/15 bg-white px-3 text-sm text-[#5b3b35] outline-none focus:border-[#a4675d]">
                {Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "rose" | "sage" | "blue" }) {
  const tones = {
    rose: "bg-[#f3e4da] text-[#92554a]",
    sage: "bg-[#e0ecdf] text-[#427047]",
    blue: "bg-[#e1e9f3] text-[#42668c]",
  };
  return <article className="rounded-[1.25rem] border border-[#342923]/10 bg-[#fffdf9] p-5"><span className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone]}`}>{icon}</span><p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-[#342923]">{value}</p><p className="mt-1 text-sm text-[#705e56]">{label}</p></article>;
}
