// src/apps/alfa-app/interface/talisman.d.ts
declare module 'talisman/metrics/damerau-levenshtein' {
  /** Damerau–Levenshtein distance between two strings. */
  export default function damerauLevenshtein(a: string, b: string): number;
}
