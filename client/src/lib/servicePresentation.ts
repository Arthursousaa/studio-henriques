export function formatServicePrice(price: string, isPriceOnRequest = false) {
  if (isPriceOnRequest) return "Sob orçamento";

  const value = Number(price);
  if (!value) return "Consulte o valor";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
