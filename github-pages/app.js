import { categories, buildWhatsAppMessage, formatPrice, services } from "./catalog.js";

const whatsappNumber = "5511992698360";
const categorySymbols = {
  Unhas: "UN",
  "Pés": "PE",
  Facial: "FA",
  Depilação: "DE",
  Massagens: "MA",
  "Pacotes mensais": "PA",
};

const $ = selector => document.querySelector(selector);
const filters = $("#filters");
const grid = $("#services");
const select = $("#serviceSelect");
const form = $("#contactForm");
const status = $("#formStatus");
let activeCategory = "Todos";

function visibleServices() {
  return activeCategory === "Todos" ? services : services.filter(service => service.category === activeCategory);
}

function renderFilters() {
  filters.replaceChildren(...categories.map(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-button${category === activeCategory ? " is-active" : ""}`;
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFilters();
      renderServices();
    });
    return button;
  }));
}

function selectService(serviceName) {
  select.value = serviceName;
  status.textContent = `${serviceName} foi selecionado. Preencha os seus dados para continuar pelo WhatsApp.`;
  $("#informacoes").scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => $("#name").focus({ preventScroll: true }), 450);
}

function createServiceCard(service) {
  const card = document.createElement("article");
  card.className = "service-card";
  const top = document.createElement("div");
  top.className = "service-card-top";
  const symbol = document.createElement("span");
  symbol.className = "service-symbol";
  symbol.textContent = categorySymbols[service.category] || "SH";
  symbol.setAttribute("aria-hidden", "true");
  const category = document.createElement("span");
  category.className = "service-category";
  category.textContent = service.category;
  top.append(symbol, category);
  const title = document.createElement("h3");
  title.textContent = service.name;
  const description = document.createElement("p");
  description.textContent = service.description;
  const footer = document.createElement("div");
  footer.className = "service-footer";
  const price = document.createElement("span");
  price.className = "service-price";
  price.textContent = formatPrice(service.price);
  const button = document.createElement("button");
  button.className = "service-more";
  button.type = "button";
  button.textContent = "Quero saber mais →";
  button.addEventListener("click", () => selectService(service.name));
  footer.append(price, button);
  card.append(top, title, description, footer);
  return card;
}

function renderServices() {
  const matches = visibleServices();
  if (!matches.length) {
    grid.innerHTML = '<p class="empty-state">Nenhum serviço disponível nesta categoria no momento.</p>';
    return;
  }
  grid.replaceChildren(...matches.map(createServiceCard));
}

function populateSelect() {
  select.replaceChildren();
  const placeholder = new Option("Selecione um serviço", "");
  placeholder.disabled = true;
  placeholder.selected = true;
  select.add(placeholder);
  services.forEach(service => select.add(new Option(`${service.name} — ${formatPrice(service.price)}`, service.name)));
}

function setupMobileNavigation() {
  const toggle = $("#menuToggle");
  const menu = $("#mobileMenu");
  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    menu.hidden = true;
  };
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    menu.hidden = isOpen;
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
}

function setupForm() {
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const message = buildWhatsAppMessage({
      name: $("#name").value,
      phone: $("#phone").value,
      service: select.value,
      message: $("#message").value,
    });
    status.textContent = "Abrindo o WhatsApp com a sua solicitação preparada.";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
}

populateSelect();
renderFilters();
renderServices();
setupMobileNavigation();
setupForm();
