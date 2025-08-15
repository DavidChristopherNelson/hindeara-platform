// experiments/words-phonemes-data.ts
// Usage: ts-node experiments/words-phonemes-data.ts > word-data.json

type GraphemeSegment = {
  segment: string;
  index: number;
  input: string;
  isWordLike?: boolean;
};

type SegmenterLike = {
  segment(input: string): Iterable<GraphemeSegment>;
};

type IntlWithSegmenter = typeof Intl & {
  Segmenter: new (
    locales?: string | string[],
    options?: { granularity?: 'grapheme' | 'word' | 'sentence' },
  ) => SegmenterLike;
};

function hasIntlSegmenter(i: typeof Intl): i is IntlWithSegmenter {
  return (
    'Segmenter' in i &&
    typeof (i as Record<string, unknown>).Segmenter === 'function'
  );
}

// 1) Paste your phoneme table here (or require() it from a file)
const phonemes: Array<{
  id: number;
  letter: string;
  example_noun: string;
  example_image: string;
  is_active: boolean;
  createdAt: string;
}> = [
  {
    id: 1,
    letter: 'A',
    example_noun: 'Apple',
    example_image: 'apple.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 2,
    letter: 'B',
    example_noun: 'Ball',
    example_image: 'ball.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 3,
    letter: 'C',
    example_noun: 'Cat',
    example_image: 'cat.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 4,
    letter: 'D',
    example_noun: 'Dog',
    example_image: 'dog.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 5,
    letter: 'E',
    example_noun: 'Elephant',
    example_image: 'elephant.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 6,
    letter: 'F',
    example_noun: 'Fish',
    example_image: 'fish.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 7,
    letter: 'G',
    example_noun: 'Goat',
    example_image: 'goat.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 8,
    letter: 'H',
    example_noun: 'Hat',
    example_image: 'hat.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 9,
    letter: 'I',
    example_noun: 'Igloo',
    example_image: 'igloo.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 10,
    letter: 'J',
    example_noun: 'Jar',
    example_image: 'jar.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 11,
    letter: 'K',
    example_noun: 'Kite',
    example_image: 'kite.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 12,
    letter: 'L',
    example_noun: 'Lion',
    example_image: 'lion.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 13,
    letter: 'M',
    example_noun: 'Monkey',
    example_image: 'monkey.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 14,
    letter: 'N',
    example_noun: 'Nest',
    example_image: 'nest.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 15,
    letter: 'O',
    example_noun: 'Orange',
    example_image: 'orange.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 16,
    letter: 'P',
    example_noun: 'Pig',
    example_image: 'pig.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 17,
    letter: 'Q',
    example_noun: 'Queen',
    example_image: 'queen.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 18,
    letter: 'R',
    example_noun: 'Rabbit',
    example_image: 'rabbit.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 19,
    letter: 'S',
    example_noun: 'Sun',
    example_image: 'sun.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 20,
    letter: 'T',
    example_noun: 'Tiger',
    example_image: 'tiger.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 21,
    letter: 'U',
    example_noun: 'Umbrella',
    example_image: 'umbrella.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 22,
    letter: 'V',
    example_noun: 'Violin',
    example_image: 'violin.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 23,
    letter: 'W',
    example_noun: 'Whale',
    example_image: 'whale.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 24,
    letter: 'X',
    example_noun: 'Xylophone',
    example_image: 'xylophone.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 25,
    letter: 'Y',
    example_noun: 'Yacht',
    example_image: 'yacht.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 26,
    letter: 'Z',
    example_noun: 'Zebra',
    example_image: 'zebra.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:56.977Z',
  },
  {
    id: 27,
    letter: 'अ',
    example_noun: 'अनार',
    example_image: 'pomegranate.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 28,
    letter: 'आ',
    example_noun: 'आम',
    example_image: 'mango.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 29,
    letter: 'इ',
    example_noun: 'इमली',
    example_image: 'tamarind.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 30,
    letter: 'ई',
    example_noun: 'ईंट',
    example_image: 'brick.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 31,
    letter: 'उ',
    example_noun: 'उल्लू',
    example_image: 'owl.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 32,
    letter: 'ऊ',
    example_noun: 'ऊन',
    example_image: 'wool.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 33,
    letter: 'ऋ',
    example_noun: 'ऋषि',
    example_image: 'sage.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 34,
    letter: 'ए',
    example_noun: 'एरोप्लेन',
    example_image: 'aeroplane.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 35,
    letter: 'ऐ',
    example_noun: 'ऐनक',
    example_image: 'glasses.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 36,
    letter: 'ओ',
    example_noun: 'ओखली',
    example_image: 'mortar.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 37,
    letter: 'औ',
    example_noun: 'औरत',
    example_image: 'woman.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 38,
    letter: 'क',
    example_noun: 'कबूतर',
    example_image: 'pigeon.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 39,
    letter: 'ख',
    example_noun: 'खरगोश',
    example_image: 'rabbit.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 40,
    letter: 'ग',
    example_noun: 'गाय',
    example_image: 'cow.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 41,
    letter: 'घ',
    example_noun: 'घड़ी',
    example_image: 'clock.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 42,
    letter: 'ङ',
    example_noun: 'ङ',
    example_image: 'letter_nga.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 43,
    letter: 'च',
    example_noun: 'चम्मच',
    example_image: 'spoon.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 44,
    letter: 'छ',
    example_noun: 'छाता',
    example_image: 'umbrella.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 45,
    letter: 'ज',
    example_noun: 'जहाज़',
    example_image: 'ship.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 46,
    letter: 'झ',
    example_noun: 'झील',
    example_image: 'lake.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 47,
    letter: 'ञ',
    example_noun: 'ञ',
    example_image: 'letter_nya.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 48,
    letter: 'ट',
    example_noun: 'टमाटर',
    example_image: 'tomato.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 49,
    letter: 'ठ',
    example_noun: 'ठप्पा',
    example_image: 'stamp.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 50,
    letter: 'ड',
    example_noun: 'डमरू',
    example_image: 'drum.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 51,
    letter: 'ढ',
    example_noun: 'ढक्कन',
    example_image: 'lid.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 52,
    letter: 'ण',
    example_noun: 'ण',
    example_image: 'letter_rna.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 53,
    letter: 'त',
    example_noun: 'तरबूज़',
    example_image: 'watermelon.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 54,
    letter: 'थ',
    example_noun: 'थर्मस',
    example_image: 'thermos.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 55,
    letter: 'द',
    example_noun: 'दरवाज़ा',
    example_image: 'door.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 56,
    letter: 'ध',
    example_noun: 'धनुष',
    example_image: 'bow.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 57,
    letter: 'न',
    example_noun: 'नारियल',
    example_image: 'coconut.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 58,
    letter: 'प',
    example_noun: 'पतंग',
    example_image: 'kite.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 59,
    letter: 'फ',
    example_noun: 'फूल',
    example_image: 'flower.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 60,
    letter: 'ब',
    example_noun: 'बिल्ली',
    example_image: 'cat.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 61,
    letter: 'भ',
    example_noun: 'भालू',
    example_image: 'bear.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 62,
    letter: 'म',
    example_noun: 'मछली',
    example_image: 'fish.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 63,
    letter: 'य',
    example_noun: 'याक',
    example_image: 'yak.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 64,
    letter: 'र',
    example_noun: 'राजा',
    example_image: 'king.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 65,
    letter: 'ल',
    example_noun: 'लड्डू',
    example_image: 'sweet_ball.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 66,
    letter: 'व',
    example_noun: 'वानर',
    example_image: 'monkey.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 67,
    letter: 'श',
    example_noun: 'शेर',
    example_image: 'lion.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 68,
    letter: 'ष',
    example_noun: 'षट्​कोण',
    example_image: 'hexagon.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 69,
    letter: 'स',
    example_noun: 'साइकिल',
    example_image: 'bicycle.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
  {
    id: 70,
    letter: 'ह',
    example_noun: 'हाथी',
    example_image: 'elephant.png',
    is_active: true,
    createdAt: '2025-08-14T10:16:57.017Z',
  },
];

// 2) Put your word list here (e.g. your 'बिना मात्रा' list)
const words: string[] = [
  'घर',
  'फल',
  'जल',
  'धन',
  'मन',
  'तन',
  'जन',
  'चल',
  'कल',
  'हल',
  'पल',
  'बल',
  'दल',
  'गम',
  'कम',
  'दम',
  'नट',
  'पट',
  'पथ',
  'रथ',
  'सत',
  'मत',
  'कत',
  'खर',
  'घन',
  'घट',
  'झट',
  'छत',
  'छल',
  'चर',
  'तर',
  'सर',
  'नर',
  'हर',
  'कब',
  'खट',
  'नम',
  'लहर',
  'वचन',
  'गदल',
  'दमन',
  'बदल',
  'सफल',
  'भरत',
  'कसर',
  'गजब',
  'सकल',
  'दशक',
  'บटन',
  'कटन',
  'पतन',
  'भव',
  'गगन',
  'चमक',
  'भगत',
  'मगर',
  'बकर',
  'बच',
  'बल',
  'सब',
  'सत',
  'सर',
  'सच',
  'रस',
  'रच',
  'तप',
  'तर',
  'तल',
  'तब',
  'कर',
  'कब',
  'कप',
  'कल',
  'कस',
  'चर',
  'लत',
  'लब',
  'पल',
  'अप',
  'पस',
  'नल',
  'जल',
  'जन',
  'जम',
  'जप',
  'जय',
  'जब',
  'अघ',
  'गम',
  'गद',
  'गज',
  'दम',
  'डर',
  'धन',
  'धर',
  'वन',
  'वर',
  'वध',
  'दल',
  'दर',
  'נस',
  'सन',
  'हक',
  'हल',
  'हर',
  'कट',
  'हठ',
  'शक',
  'शर',
  'शह',
  'यश',
  'गगन',
  'नगर',
  'नहर',
  'लहर',
  'भगत',
  'भर',
  'भय',
  'भट',
  'भजन',
  'नमक',
  'मल',
  'मकर',
  'महक',
  'कमल',
  'कलम',
  'अकल',
  'असर',
  'अमर',
  'अचल',
  'अलग',
  'पत्र',
  'बदन',
  'बदल',
  'बचपन',
  'बरगद',
  'परवल',
  'นट',
  'खत',
  'खन',
  'खटमल',
  'फसल',
  'फल',
  'फन',
  'फट',
  'उछल',
  'चमक',
  'टन',
  'टल',
  'ठप',
  'चक',
  'चख',
  'झप',
  'झक',
  'पलट',
];

// ----------------- helper logic -----------------

// Map letter -> id for quick lookup
const idByLetter = new Map<string, number>();
for (const p of phonemes) {
  // normalize to NFC for consistent matching
  idByLetter.set(p.letter.normalize('NFC'), p.id);
}

// Remove combining marks (matras, virama, etc.) so only base letters remain.
// (If you *want* to keep halant/conjuncts, remove this step.)
const removeCombiningMarks = (s: string) =>
  s.normalize('NFC').replace(/\p{Mn}/gu, '');

// Split a Hindi word into grapheme clusters (best effort).
// Intl.Segmenter handles conjunct clusters better; fallback to Array.from.
const splitGraphemes = (s: string): string[] => {
  if (hasIntlSegmenter(Intl)) {
    const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
    const out: string[] = [];
    for (const part of seg.segment(s)) out.push(part.segment);
    return out;
  }
  // Fallback: basic code point split
  return Array.from(s);
};

// Build the dataset
type OutputItem = { word: string; phonemes: Array<{ id: number }> };
const out: OutputItem[] = [];

const missingLetters = new Set<string>();
const skippedWords = new Set<string>();

for (const rawWord of words) {
  const cleaned = removeCombiningMarks(rawWord);
  const glyphs = splitGraphemes(cleaned).filter((g) => g.trim() !== '');

  // skip any word that has a glyph not present in the phoneme table
  const unknown = glyphs.filter((g) => !idByLetter.has(g));
  if (unknown.length) {
    unknown.forEach((g) => missingLetters.add(g));
    skippedWords.add(rawWord);
    continue;
  }

  const phonemeIds = glyphs.map((g) => idByLetter.get(g)!);
  out.push({ word: rawWord, phonemes: phonemeIds.map((id) => ({ id })) });
}

// Optional diagnostics (stderr)
if (skippedWords.size) {
  console.error(
    '⏭️  Skipped ' +
      skippedWords.size +
      ' word(s) due to unknown letters: ' +
      Array.from(missingLetters).join(' '),
  );
}

// Print the JSON structure
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
