export function normalizeEnumValue(rawValue, allowedValues, fallback = null) {
  if (typeof rawValue !== 'string') return fallback;
  const trimmed = rawValue.trim();
  const match = allowedValues.find((value) => value.toLowerCase() === trimmed.toLowerCase());
  return match ?? fallback;
}
