import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildInfoRequestNotes, selectServiceForInfoRequest } from "@/lib/infoRequestSelection";
import { formatServicePrice } from "@/lib/servicePresentation";
import { filterServicesByCategory, getServiceCategories } from "@/lib/serviceFilters";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Hand,
  HeartHandshake,
  Menu,
  MessageCircle,
  Scissors,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type InfoRequestForm = {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  depilationMethod: "" | "Cera" | "Laser";
};

export type PublicStudioService = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: string;
  isPriceOnRequest: boolean;
};

const initialForm: InfoRequestForm = {
  serviceId: "",
  customerName: "",
  customerPhone: "",
  notes: "",
  depilationMethod: "",
};

type DepilationMethod = Exclude<InfoRequestForm["depilationMethod"], "">;

function ServiceIcon({ slug }: { slug: string }) {
  const className = "h-5 w-5";
  if (slug === "sobrancelhas") return <Eye className={className} />;
  if (slug === "depilacao") return <WandSparkles className={className} />;
  if (slug === "massagem") return <HeartHandshake className={className} />;
  if (slug === "alongamentos") return <Sparkles className={className} />;
  if (slug === "pedicure") return <Scissors className={className} />;
  return <Hand className={className} />;
}

export function PublicServiceCard({ service, onSelect, depilationMethod }: { service: PublicStudioService; onSelect: (id: number) => void; depilationMethod?: DepilationMethod }) {
  return (
    <article className="group flex min-h-64 flex-col rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-6 shadow-[0_16px_40px_-32px_rgba(60,37,30,0.45)] transition-all duration-200 hover:-translate-y-1 hover:border-[#a4675d]/30 hover:shadow-[0_22px_45px_-30px_rgba(60,37,30,0.55)]">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f2e2d7] text-[#94594e]"><ServiceIcon slug={service.slug} /></span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a4675d]">{service.category}</span>
      </div>
      <div className="mt-auto pt-10">
        <h3 className="font-serif text-2xl tracking-[-0.03em]">{service.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[#705e56]">{service.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-[#342923]/10 pt-4">
          <span className="font-semibold text-[#5b3b35]">{depilationMethod === "Laser" ? "Sob consulta" : formatServicePrice(service.price, service.isPriceOnRequest)}</span>
          <button className="text-sm font-semibold text-[#a4675d] transition-colors hover:text-[#5b3b35]" onClick={() => onSelect(service.id)}>
            Escolher opção <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function PublicServiceOptions({ services, depilationMethod }: { services: PublicStudioService[]; depilationMethod?: DepilationMethod }) {
  return <>{services.map(service => {
    const isLaser = service.category === "Depilação" && depilationMethod === "Laser";
    const methodLabel = service.category === "Depilação" && depilationMethod ? ` (${depilationMethod})` : "";
    return <option value={service.id} key={service.id}>{service.name}{methodLabel} — {isLaser ? "Sob consulta" : formatServicePrice(service.price, service.isPriceOnRequest)}</option>;
  })}</>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<InfoRequestForm>(initialForm);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDepilationMethod, setSelectedDepilationMethod] = useState<DepilationMethod | "">("");
  const servicesQuery = trpc.studio.services.useQuery();
  const createBooking = trpc.studio.requestBooking.useMutation({
    onSuccess: () => {
      toast.success("Pedido enviado! Em breve o Studio Henriques entrará em contato.");
      setForm(initialForm);
    },
    onError: error => toast.error(error.message || "Não foi possível registrar o pedido."),
  });

  const services = servicesQuery.data ?? [];
  const selectedService = useMemo(
    () => services.find(service => service.id === Number(form.serviceId)),
    [form.serviceId, services],
  );
  const serviceCategories = useMemo(() => getServiceCategories(services).filter(category => category !== "Todos"), [services]);
  const filteredServices = useMemo(() => selectedCategory ? filterServicesByCategory(services, selectedCategory) : [], [services, selectedCategory]);

  function scrollToBooking() {
    document.querySelector("#agendar")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  function updateForm(field: keyof InfoRequestForm, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || !form.customerName || !form.customerPhone) {
      toast.error("Preencha seu nome, WhatsApp e serviço para enviar o pedido.");
      return;
    }

    if (selectedService.category === "Depilação" && !form["depilationMethod"]) {
      toast.error("Escolha se prefere depilação por cera ou laser.");
      return;
    }

    createBooking.mutate({
      serviceId: selectedService.id,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      notes: buildInfoRequestNotes(form.notes, form["depilationMethod"] || undefined),
    });
  }

  function selectCategory(category: string) {
    setSelectedCategory(category);
    setSelectedDepilationMethod("");
  }

  function selectService(id: number, depilationMethod: DepilationMethod | "" = "") {
    setForm(current => selectServiceForInfoRequest(current, id, { depilationMethod }));
    scrollToBooking();
  }

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#342923]">
      <header className="sticky top-0 z-50 border-b border-[#342923]/10 bg-[#fbf8f3]/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between">
          <a href="#inicio" className="group flex items-center gap-3" aria-label="Studio Henriques, início">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#5b3b35] font-serif text-lg text-[#fffaf2] shadow-sm transition-transform duration-200 group-hover:scale-105">
              SH
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-xl tracking-[-0.03em]">Studio Henriques</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6259]">beleza & bem-estar</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Navegação principal">
            <a className="transition-colors hover:text-[#9d6156]" href="#servicos">Serviços</a>
            <a className="transition-colors hover:text-[#9d6156]" href="#sobre">Sobre a Jaqueline</a>
            <a className="transition-colors hover:text-[#9d6156]" href="#agendar">Agendar</a>
          </nav>

          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-[#5b3b35]/15 md:hidden"
            onClick={() => setMenuOpen(current => !current)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#342923]/10 bg-[#fbf8f3] px-5 py-4 md:hidden" aria-label="Navegação móvel">
            <div className="mx-auto flex max-w-md flex-col gap-3 text-sm font-medium">
              <a onClick={() => setMenuOpen(false)} href="#servicos">Serviços</a>
              <a onClick={() => setMenuOpen(false)} href="#sobre">Sobre a Jaqueline</a>
              <button className="text-left" onClick={scrollToBooking}>Agendar</button>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden bg-[#d9c0b0]">
          <img
            src="/manus-storage/studio-henriques-hero_66b3ef02.jpg"
            alt="Atendimento de manicure em ambiente acolhedor"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#372720] via-[#372720]/90 to-[#372720]/10" />
          <div className="container relative grid min-h-[620px] items-end py-16 sm:min-h-[660px] sm:py-20 lg:min-h-[690px]">
            <div className="max-w-2xl text-[#fffaf2]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#fffaf2]/30 bg-[#fffaf2]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Seu momento de cuidado começa aqui
              </div>
              <h1 className="max-w-xl font-serif text-5xl leading-[0.94] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Beleza que acompanha o seu ritmo.
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-[#fffaf2]/82 sm:text-lg">
                Um espaço pensado para você reservar um tempo, cuidar de si e sair ainda mais confiante.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button onClick={scrollToBooking} className="h-12 rounded-full bg-[#f9e8dd] px-6 text-sm font-semibold text-[#4e302a] shadow-lg transition-transform hover:bg-white active:scale-[0.97]">
                  Agendar meu horário <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href="#servicos" className="rounded-full px-5 py-3 text-sm font-semibold text-[#fffaf2] transition-colors hover:bg-white/10">
                  Conhecer serviços
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#342923]/10 bg-[#f5ede5]">
          <div className="container grid divide-y divide-[#342923]/10 py-3 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:py-0">
            <div className="flex items-center gap-3 py-4 sm:justify-center"><CalendarDays className="h-4 w-4 text-[#a4675d]" /><span>Agendamento simples pelo WhatsApp</span></div>
            <div className="flex items-center gap-3 py-4 sm:justify-center"><Clock3 className="h-4 w-4 text-[#a4675d]" /><span>Atendimento com hora marcada</span></div>
            <div className="flex items-center gap-3 py-4 sm:justify-center"><Check className="h-4 w-4 text-[#a4675d]" /><span>Preços sempre atualizados</span></div>
          </div>
        </section>

        <section id="servicos" className="container py-20 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a4675d]">Serviços</p>
              <h2 className="max-w-sm font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">Cuidado pensado para você.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#705e56] lg:pb-1">
              Comece pelo tipo de cuidado e, em seguida, escolha a opção que combina com você. Na depilação, você também seleciona entre cera e laser antes da área.
            </p>
          </div>

          {!selectedCategory ? (
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Tipos de serviço">
              {servicesQuery.isLoading && Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-[1.5rem] bg-[#f1e8df]" />)}
              {serviceCategories.map(category => {
                const optionCount = filterServicesByCategory(services, category).length;
                const iconSlug = category === "Depilação" ? "depilacao" : category === "Massagens" ? "massagem" : category === "Pés" ? "pedicure" : category === "Unhas" ? "alongamentos" : "sobrancelhas";
                return (
                  <button key={category} onClick={() => selectCategory(category)} className="group rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-6 text-left shadow-[0_16px_40px_-32px_rgba(60,37,30,0.45)] transition-all hover:-translate-y-1 hover:border-[#a4675d]/30 hover:shadow-[0_22px_45px_-30px_rgba(60,37,30,0.55)]">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f2e2d7] text-[#94594e]"><ServiceIcon slug={iconSlug} /></span>
                    <span className="mt-10 block font-serif text-2xl tracking-[-0.03em]">{category}</span>
                    <span className="mt-2 block text-sm leading-6 text-[#705e56]">{category === "Depilação" ? "Escolha cera ou laser e depois a área." : `${optionCount} opções para escolher.`}</span>
                    <span className="mt-5 block border-t border-[#342923]/10 pt-4 text-sm font-semibold text-[#a4675d]">Ver opções <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button onClick={() => selectCategory("")} className="rounded-full border border-[#342923]/15 bg-[#fffdf9] px-4 py-2 text-sm font-semibold text-[#705e56] transition-colors hover:border-[#a4675d]/50 hover:text-[#5b3b35]">← Todos os tipos</button>
                <p className="font-serif text-2xl tracking-[-0.03em]">{selectedCategory === "Depilação" && selectedDepilationMethod ? `Depilação por ${selectedDepilationMethod}` : `Opções de ${selectedCategory}`}</p>
              </div>

              {selectedCategory === "Depilação" && !selectedDepilationMethod ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(["Cera", "Laser"] as const).map(method => (
                    <button key={method} onClick={() => setSelectedDepilationMethod(method)} className="rounded-[1.5rem] border border-[#342923]/10 bg-[#fffdf9] p-6 text-left shadow-[0_16px_40px_-32px_rgba(60,37,30,0.45)] transition-all hover:-translate-y-1 hover:border-[#a4675d]/30 hover:shadow-[0_22px_45px_-30px_rgba(60,37,30,0.55)]">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f2e2d7] text-[#94594e]"><WandSparkles className="h-5 w-5" /></span>
                      <span className="mt-10 block font-serif text-2xl tracking-[-0.03em]">Depilação por {method}</span>
                      <span className="mt-2 block text-sm leading-6 text-[#705e56]">{method === "Cera" ? "Veja os valores por área e escolha a sua preferência." : "Escolha a área para solicitar informações e disponibilidade."}</span>
                      <span className="mt-5 block border-t border-[#342923]/10 pt-4 text-sm font-semibold text-[#a4675d]">Escolher {method.toLowerCase()} <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map(service => <PublicServiceCard key={service.id} service={service} depilationMethod={selectedCategory === "Depilação" ? selectedDepilationMethod || undefined : undefined} onSelect={id => selectService(id, selectedCategory === "Depilação" ? selectedDepilationMethod : "")} />)}
                  {!servicesQuery.isLoading && filteredServices.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-[#342923]/15 bg-[#fffdf9] p-8 text-center text-sm text-[#705e56]">Nenhuma opção disponível neste momento.</p>}
                </div>
              )}
            </>
          )}
        </section>

        <section id="sobre" className="overflow-hidden bg-[#5b3b35] text-[#fffaf2]">
          <div className="container grid gap-12 py-20 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div className="relative min-h-80 overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#8fcfc7] p-8 text-[#2f3633] sm:min-h-[29rem] sm:p-10">
              <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full border-[24px] border-[#f6dc88]/80" />
              <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full border-[24px] border-white/20" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-[#2f3633]/20 bg-[#b9e2dc] font-serif text-xl tracking-[-0.05em]">JH</span>
                <div>
                  <div className="max-w-sm border border-[#2f3633]/40 px-4 py-3">
                    <p className="font-serif text-lg leading-none tracking-[-0.04em]">Jaqueline Henriques</p>
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#2f3633]/65">Studio de estética e beleza</p>
                  </div>
                  <p className="mt-4 max-w-sm font-serif text-4xl leading-[1.02] tracking-[-0.05em]">Cuidar de você também é a minha paixão.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#edc3b1]">Sobre a Jaqueline</p>
              <h2 className="max-w-2xl font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">Estética com escuta, propósito e cuidado.</h2>
              <div className="mt-7 max-w-2xl space-y-4 text-base leading-7 text-[#fffaf2]/80">
                <p>Meu nome é Jaqueline Henriques, tenho 27 anos e sou estudante de Estética, atualmente no 3º semestre. Sou apaixonada pelo poder que o autocuidado tem de transformar a autoestima.</p>
                <p>Sou fundadora do Studio Henriques, um espaço criado com carinho para oferecer cuidados, bem-estar e momentos especiais. Para mim, a estética vai muito além da beleza: ela está ligada à confiança, ao cuidado com o corpo e ao amor-próprio.</p>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border-t border-white/20 pt-4"><span className="text-xs uppercase tracking-[0.15em] text-[#edc3b1]">Em constante evolução</span><p className="mt-2 text-sm leading-6 text-[#fffaf2]/82">Estou sempre aprendendo para oferecer um atendimento cada vez mais atento e especial.</p></div>
                <div className="border-t border-white/20 pt-4"><span className="text-xs uppercase tracking-[0.15em] text-[#edc3b1]">Bem-estar na rotina</span><p className="mt-2 text-sm leading-6 text-[#fffaf2]/82">Treino, corrida e momentos tranquilos fazem parte da minha forma de viver e cuidar de mim.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="agendar" className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_#f1ddd1_0%,_transparent_72%)]" />
          <div className="container relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div className="lg:pt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a4675d]">Mais informações</p>
              <h2 className="max-w-sm font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">Vamos conversar sobre o seu cuidado?</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#705e56]">
                Escolha um serviço, conte o que você precisa e deixe seu WhatsApp. A Jaqueline retornará para esclarecer dúvidas e combinar o melhor horário.
              </p>
              <div className="mt-8 rounded-2xl border border-[#d7b9aa] bg-[#fffaf2] p-5 text-sm leading-6 text-[#6c5048]">
                <div className="mb-2 flex items-center gap-2 font-semibold text-[#5b3b35]"><MessageCircle className="h-4 w-4" /> Atendimento personalizado</div>
                Seu pedido é enviado para o Studio Henriques. A confirmação de horário e os detalhes são combinados diretamente com você.
              </div>
            </div>

            <form onSubmit={handleBooking} className="rounded-[1.75rem] border border-[#342923]/10 bg-[#fffdf9] p-6 shadow-[0_25px_60px_-40px_rgba(60,37,30,0.55)] sm:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="service" className="text-sm font-semibold">Qual serviço você deseja?</Label>
                  <select id="service" value={form.serviceId} onChange={event => {
                    const nextService = services.find(service => service.id === Number(event.target.value));
                    setForm(current => ({ ...current, serviceId: event.target.value, depilationMethod: nextService?.category === "Depilação" ? current["depilationMethod"] : "" }));
                  }} className="mt-2 h-11 w-full rounded-xl border border-[#342923]/15 bg-white px-3 text-sm outline-none transition focus:border-[#a4675d] focus:ring-2 focus:ring-[#dcb4a4]/40">
                    <option value="">Selecione um serviço</option>
                    <PublicServiceOptions services={services} depilationMethod={form["depilationMethod"] || undefined} />
                  </select>
                </div>
                {selectedService?.category === "Depilação" && (
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-semibold">Qual método de depilação você prefere?</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {(["Cera", "Laser"] as const).map(method => (
                        <button type="button" key={method} onClick={() => updateForm("depilationMethod", method)} className={`h-11 rounded-xl border text-sm font-semibold transition ${form["depilationMethod"] === method ? "border-[#5b3b35] bg-[#5b3b35] text-[#fffaf2]" : "border-[#342923]/15 bg-white text-[#705e56] hover:border-[#a4675d]/50 hover:text-[#5b3b35]"}`}>{method}</button>
                      ))}
                    </div>
                    {form["depilationMethod"] === "Laser" && <p className="mt-2 text-xs leading-5 text-[#705e56]">Os valores de depilação a laser são informados pelo Studio conforme a área e a disponibilidade.</p>}
                  </div>
                )}
                <div>
                  <Label htmlFor="customerName" className="text-sm font-semibold">Seu nome</Label>
                  <Input id="customerName" value={form.customerName} onChange={event => updateForm("customerName", event.target.value)} placeholder="Como podemos te chamar?" className="mt-2 h-11 rounded-xl border-[#342923]/15 bg-white focus-visible:ring-[#dcb4a4]" />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-sm font-semibold">Seu WhatsApp</Label>
                  <Input id="customerPhone" type="tel" value={form.customerPhone} onChange={event => updateForm("customerPhone", event.target.value)} placeholder="(11) 99999-9999" className="mt-2 h-11 rounded-xl border-[#342923]/15 bg-white focus-visible:ring-[#dcb4a4]" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Como podemos ajudar? <span className="font-normal text-[#705e56]">(opcional)</span></Label>
                  <Textarea id="notes" value={form.notes} onChange={event => updateForm("notes", event.target.value)} maxLength={600} placeholder="Conte qual informação você gostaria de receber." className="mt-2 min-h-24 resize-y rounded-xl border-[#342923]/15 bg-white focus-visible:ring-[#dcb4a4]" />
                </div>
              </div>
              <Button type="submit" disabled={createBooking.isPending || servicesQuery.isLoading} className="mt-7 h-12 w-full rounded-full bg-[#5b3b35] text-sm font-semibold text-[#fffaf2] hover:bg-[#754d45] active:scale-[0.98]">
                <MessageCircle className="mr-2 h-4 w-4" /> {createBooking.isPending ? "Enviando pedido..." : "Enviar pedido de informações"}
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-[#8a756d]">O Studio Henriques entrará em contato pelo WhatsApp informado.</p>
            </form>
          </div>
        </section>

        <section id="contato" className="border-y border-[#342923]/10 bg-[#f5ede5]">
          <div className="container grid gap-8 py-12 sm:grid-cols-3 sm:items-center sm:py-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a4675d]">Contato</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#342923]">Venha cuidar de você.</h2>
            </div>
            <div className="border-l-0 border-[#342923]/10 sm:border-l sm:pl-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a4675d]">Endereço</p>
              <p className="mt-2 text-sm leading-6 text-[#705e56]">Rua Ipatinga, 28A<br />Vila Princesa Isabel</p>
            </div>
            <div className="border-l-0 border-[#342923]/10 sm:border-l sm:pl-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a4675d]">WhatsApp</p>
              <a className="mt-2 inline-block text-base font-semibold text-[#5b3b35] transition-colors hover:text-[#a4675d]" href="https://wa.me/5511992698360" target="_blank" rel="noreferrer">(11) 99269-8360</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#342923]/10 bg-[#f5ede5]">
        <div className="container flex flex-col justify-between gap-5 py-8 text-sm text-[#705e56] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#5b3b35] font-serif text-xs text-white">SH</span><span>Studio Henriques · Beleza &amp; bem-estar</span></div>
          <div className="flex items-center gap-4"><button onClick={scrollToBooking} className="font-semibold text-[#5b3b35] hover:text-[#a4675d]">Agendar</button></div>
        </div>
      </footer>
    </div>
  );
}
