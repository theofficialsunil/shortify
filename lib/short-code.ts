import { nanoid } from "nanoid";

export function generateShortCode() {
  return nanoid(7);
}

export function normalizeAlias(alias?: string) {
  if (!alias) return "";

  return alias.trim().toLowerCase();
}