export function centsFromEuroInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }

  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount)) {
    throw new Error("Please enter a valid price.");
  }

  return Math.round(amount * 100);
}
