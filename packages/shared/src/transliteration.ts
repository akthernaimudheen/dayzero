// DayZero — deterministic Malayalam↔Manglish transliteration helpers.

// Design notes:
// - Manglish (Latin-script Malayalam) is informal and inconsistent, so this library is
//   NOT intended to be a bidirectional transliterator with perfect round-tripping.
//   It is a small, deterministic helper for the specific Manglish spellings we accept
//   in search/lookup UX (for example, typing "kochi" or "kochin" alongside Malayalam
//   place names).
// - The mapping is intentionally conservative: it is a curated term table, not a
//   phonetic engine. Malayalam orthography is not derivable from Manglish by rule —
//   the same "na" is ണ in Ernakulam (എറണാകുളം) but ന in Thiruvananthapuram
//   (തിരുവനന്തപുരം) — so guessing would produce wrong spellings. Unknown words are
//   returned unchanged rather than transliterated badly.
// - For Korean ↔ Malayalam there is no meaningful transliteration relationship;
//   the Korean decoding helpers live in packages/shared/src/ instead.

/** Curated Manglish (lower-case) → Malayalam term table. */
const MANGISH_TO_MALAYALAM: Record<string, string> = {
  // Recovery programme / product vocabulary
  thanal: 'തണൽ',
  punarjani: 'പുനർജനി',
  vimukthi: 'വിമുക്തി',
  mayangilla: 'മയങ്ങില്ല',
  sahayam: 'സഹായം',
  // Kerala districts (English name → Malayalam)
  thiruvananthapuram: 'തിരുവനന്തപുരം',
  kollam: 'കൊല്ലം',
  pathanamthitta: 'പത്തനംതിട്ട',
  alappuzha: 'ആലപ്പുഴ',
  kottayam: 'കോട്ടയം',
  idukki: 'ഇടുക്കി',
  ernakulam: 'എറണാകുളം',
  thrissur: 'തൃശ്ശൂർ',
  palakkad: 'പാലക്കാട്',
  malappuram: 'മലപ്പുറം',
  kozhikode: 'കോഴിക്കോട്',
  wayanad: 'വയനാട്',
  kannur: 'കണ്ണൂർ',
  kasaragod: 'കാസർഗോഡ്',
};

/** Reverse table (Malayalam → Manglish), derived so the two directions can never drift. */
const MALAYALAM_TO_MANGISH: Record<string, string> = Object.fromEntries(
  Object.entries(MANGISH_TO_MALAYALAM).map(([manglish, malayalam]) => [malayalam, manglish])
);

/** Longest-first list of Malayalam terms, for greedy matching in toManglish. */
const MALAYALAM_TERMS_LONGEST_FIRST: string[] = Object.keys(MALAYALAM_TO_MANGISH).sort(
  (a, b) => b.length - a.length
);

/**
 * Convert a single Manglish word to Malayalam.
 * Case-insensitive; words that are not in the curated table are returned unchanged.
 */
export function transliterateWordToMalayalam(word: string): string {
  const key = String(word ?? '').trim().toLowerCase();
  return MANGISH_TO_MALAYALAM[key] ?? String(word ?? '');
}

/**
 * Convert Manglish text (place names, vocabulary) to Malayalam, word by word.
 * Known words are converted; unknown words and existing Malayalam pass through.
 */
export function toMalayalamScript(text: string): string {
  const source = String(text ?? '');
  // Whole-string hit first (handles "Ernakulam" → എറണാകുളം without splitting).
  const whole = MANGISH_TO_MALAYALAM[source.trim().toLowerCase()];
  if (whole) return whole;

  return source
    .split(/([^\p{L}\p{N}]+)/u)
    .map((token) => {
      const converted = MANGISH_TO_MALAYALAM[token.toLowerCase()];
      return converted ?? token;
    })
    .join('');
}

/**
 * Convert Malayalam text to readable Manglish (Latin script), longest term first.
 * Unknown Malayalam runs are returned unchanged rather than transliterated badly.
 */
export function toManglish(text: string): string {
  const source = String(text ?? '');
  let remaining = source;
  let out = '';

  while (remaining.length > 0) {
    let matched = false;
    for (const term of MALAYALAM_TERMS_LONGEST_FIRST) {
      if (remaining.startsWith(term)) {
        out += MALAYALAM_TO_MANGISH[term];
        remaining = remaining.slice(term.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += remaining[0];
      remaining = remaining.slice(1);
    }
  }
  return out;
}
