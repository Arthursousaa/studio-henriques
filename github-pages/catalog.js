export const services = [
  ["Manicure", "Unhas", "Corte, lixa, hidratação, cutilagem e aplicação de esmalte.", 25],
  ["Unha postiça", "Unhas", "Preparação da unha natural, aplicação de unha postiça e esmaltação.", 35],
  ["Banho de gel", "Unhas", "Reforço para unhas mais fortes e resistentes.", 60],
  ["Alongamento", "Unhas", "Alongamento com gel, fibra de vidro ou acrílico.", 100],
  ["Pedicure", "Pés", "Corte, lixa, hidratação, cutilagem e esmaltação.", 30],
  ["Spa dos pés", "Pés", "Esfoliação, hidratação profunda, cutilagem e esmaltação.", 35],
  ["Plástica dos pés", "Pés", "Tratamento intensivo com esfoliação e massagem.", 45],
  ["Design de sobrancelhas", "Facial", "Correção e definição do formato das sobrancelhas.", 25],
  ["Design com brow lamination", "Facial", "Alinhamento e definição dos fios.", 45],
  ["Limpeza de pele", "Facial", "Pele mais saudável, luminosa e revitalizada.", 90],
  ["Design com henna", "Facial", "Coloração temporária para realçar o desenho natural.", 35],
  ["Lash lifting", "Facial", "Curvatura natural dos cílios.", 50],
  ["Maquiagem", "Facial", "Personalizada para o dia a dia, eventos ou ocasiões especiais.", null],
  ["Buço", "Depilação", "Remoção delicada dos pelos da região superior dos lábios.", 15],
  ["Axila", "Depilação", "Pele lisa e confortável.", 20],
  ["Abdômen", "Depilação", "Remoção dos pelos e impurezas da região abdominal.", 45],
  ["Meia perna", "Depilação", "Depilação da parte inferior das pernas.", 55],
  ["Braço completo", "Depilação", "Depilação completa dos braços.", 85],
  ["Virilha", "Depilação", "Depilação íntima com técnica segura.", 90],
  ["Perna inteira", "Depilação", "Depilação completa das pernas.", 100],
  ["Drenagem linfática", "Massagens", "Bem-estar e redução da sensação de inchaço.", 70],
  ["Massagem relaxante", "Massagens", "Alívio do estresse e da tensão muscular.", 80],
  ["Massagem com ventosa", "Massagens", "Estimula a circulação e o bem-estar corporal.", 120],
  ["Pacote Bronze", "Pacotes mensais", "2 spas dos pés e 4 manicures. Válido por 30 dias.", 150],
  ["Pacote Prata", "Pacotes mensais", "1 plástica dos pés, 1 spa dos pés e 4 manicures. Válido por 30 dias.", 170],
  ["Pacote Ouro", "Pacotes mensais", "1 plástica dos pés, 1 spa dos pés, 4 manicures e 1 design. Válido por 30 dias.", 190],
  ["Pacote Platina", "Pacotes mensais", "Pacote mensal com unhas, design e depilações. Válido por 30 dias.", 215],
  ["Pacote Diamante", "Pacotes mensais", "Pacote mensal completo com cuidados de unhas, depilação e drenagem. Válido por 30 dias.", 315],
].map(([name, category, description, price]) => ({ name, category, description, price }));

export const categories = ["Todos", ...new Set(services.map(service => service.category))];

export function formatPrice(price) {
  return price === null ? "Sob orçamento" : price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildWhatsAppMessage({ name, phone, service, message }) {
  const note = message.trim() ? ` Observação: ${message.trim()}` : "";
  return `Olá, meu nome é ${name.trim()}. Gostaria de mais informações sobre ${service}. Meu WhatsApp: ${phone.trim()}.${note}`;
}
