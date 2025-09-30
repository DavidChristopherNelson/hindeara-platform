// src/apps/alfa-app/state/evaluate-answer.utils.spec.ts
/**
 * Comprehensive tests for evaluate-answer.utils.ts
 *
 * npm i -D jest @types/jest ts-jest
 * npx jest
 */

import {
  markWord,
  markImage,
  markLetter,
  detectIncorrectEndMatra,
  detectIncorrectMiddleMatra,
} from './evaluate-answer.utils';

const LONG_A = 'ा';

/* ------------------------------------------------------------------ */
/*  clean – tested indirectly via markWord                            */
/* ------------------------------------------------------------------ */
describe('clean (indirect via markWord)', () => {
  it('removes punctuation (comma)', () => {
    expect(markWord({ correctAnswer: 'कल', studentAnswer: 'क,ल' })).toBe(true);
  });

  it('normalises non-NFC input (ड + nukta → pre-composed ड़)', () => {
    const decomposed = 'ड\u093C'; // ड + ◌़  (NFD)
    const composed = 'ड़'; // U+095C  (NFC)
    expect(
      markWord({ correctAnswer: composed, studentAnswer: decomposed }),
    ).toBe(true);
  });

  it('trims leading / trailing whitespace', () => {
    expect(markWord({ correctAnswer: 'राम', studentAnswer: '   राम   ' })).toBe(
      true,
    );
  });

  it('lower-cases English letters', () => {
    expect(markWord({ correctAnswer: 'a', studentAnswer: 'A' })).toBe(true);
  });
});

describe('markWord - prepended characters support', () => {
  const correct = 'घर';

  it('accepts student answer with exactly one extra character prepended', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'अघर' })).toBe(
      true,
    );
  });

  it('accepts student answer with multiple extra characters prepended', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'घरघर' })).toBe(
      true,
    );
  });

  it('still rejects student answer with extra characters appended', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'घरअ' })).toBe(
      false,
    );
  });

  it('still rejects completely different word', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'दर' })).toBe(
      false,
    );
  });

  it('prepended + same-family consonant still passes', () => {
    // correct = घर, student = अगर (ग़ is in same family as ग/घ)
    expect(markWord({ correctAnswer: 'घर', studentAnswer: 'अगर' })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  markWord  &  markImage (alias)                                    */
/* ------------------------------------------------------------------ */
describe('markWord / markImage', () => {
  const correct = 'कला';

  test('single matching word → true', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'कला' })).toBe(
      true,
    );
  });

  test('single word, one mātrā off → false', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'कली' })).toBe(
      false,
    );
  });

  test('single word, one consonant off → false', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'गला' })).toBe(
      false,
    );
  });

  test('multiple words – match at beginning / middle / end', () => {
    expect(
      markWord({ correctAnswer: correct, studentAnswer: 'कला बहुत सुंदर' }),
    ).toBe(true);
    expect(
      markWord({ correctAnswer: correct, studentAnswer: 'यह कला अद्भुत है' }),
    ).toBe(true);
    expect(
      markWord({ correctAnswer: correct, studentAnswer: 'सुंदर है कला' }),
    ).toBe(true);
  });

  test('multiple words – correct word repeated', () => {
    expect(
      markWord({ correctAnswer: correct, studentAnswer: 'कला कला कला' }),
    ).toBe(true);
  });

  test('multiple words – one word 1-mātrā-off, others correct', () => {
    expect(markWord({ correctAnswer: correct, studentAnswer: 'कला कली' })).toBe(
      true,
    );
  });

  test('schwa deletion: correct ends with ा, student omits it → true', () => {
    expect(markWord({ correctAnswer: 'लड़का', studentAnswer: 'लड़क' })).toBe(
      true,
    );
  });

  test('false match – no occurrences', () => {
    expect(
      markWord({ correctAnswer: correct, studentAnswer: 'सुंदर चित्र' }),
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  markImage – first char + optional 2nd-char matra equality         */
/* ------------------------------------------------------------------ */
describe('markImage (first character match + optional second-char matra match)', () => {
  it('returns false when example is empty', () => {
    expect(markImage({ correctAnswer: '', studentAnswer: 'कुछ' })).toBe(false);
  });

  it('returns false when student is empty (no tokens)', () => {
    expect(markImage({ correctAnswer: 'कमल', studentAnswer: '' })).toBe(false);
  });

  it('skips whitespace-only tokens and returns false if none match', () => {
    expect(markImage({ correctAnswer: 'कमल', studentAnswer: '   \t  ' })).toBe(false);
  });

  it('first character mismatch → false', () => {
    expect(markImage({ correctAnswer: 'कमल', studentAnswer: 'गल' })).toBe(false);
    expect(markImage({ correctAnswer: 'कील', studentAnswer: 'गील' })).toBe(false);
  });

  it('first character matches, example 2nd char is NOT a matra → true (no 2nd-char requirement)', () => {
    // Example: "कमल" → ['क','म','ल']; 2nd char 'म' is not a matra
    expect(markImage({ correctAnswer: 'कमल', studentAnswer: 'कबीर' })).toBe(true);
    // Very short student token still allowed when example’s 2nd isn’t a matra
    expect(markImage({ correctAnswer: 'कमल', studentAnswer: 'क' })).toBe(true);
  });

  it('example 2nd char IS a matra and matches in student → true', () => {
    // "कील" → 2nd is 'ी'
    expect(markImage({ correctAnswer: 'कील', studentAnswer: 'कीड़ा' })).toBe(true);
    // "कुर्सी" → 2nd is 'ु'
    expect(markImage({ correctAnswer: 'कुर्सी', studentAnswer: 'कुत्ता' })).toBe(true);
  });

  it('example 2nd char IS a matra but student lacks that matra (too short) → false', () => {
    expect(markImage({ correctAnswer: 'कील', studentAnswer: 'क' })).toBe(false);
  });

  it('example 2nd char IS a matra but student has a DIFFERENT matra → false', () => {
    expect(markImage({ correctAnswer: 'कील', studentAnswer: 'कुल' })).toBe(false); // 'ी' vs 'ु'
    expect(markImage({ correctAnswer: 'कोना', studentAnswer: 'कैदी' })).toBe(false); // 'ो' vs 'ै'
  });

  it('multiple tokens: ignores non-matching tokens and returns true when a later token matches', () => {
    expect(
      markImage({ correctAnswer: 'कील', studentAnswer: 'घर कल कीड़ा' })
    ).toBe(true); // first two fail, third matches
  });

  it('multiple tokens: all tokens fail → false', () => {
    expect(
      markImage({ correctAnswer: 'कील', studentAnswer: 'घर गल गली' })
    ).toBe(false);
  });

  it('Unicode NFC normalization of first char (nukta decomposed vs precomposed) → true when rule allows', () => {
    const example = 'ड़ना';          // precomposed nukta
    const student = 'ड\u093Cना';     // decomposed nukta
    expect(markImage({ correctAnswer: example, studentAnswer: student })).toBe(true);
  });

  it('first character matches but example 2nd is a matra and student has a consonant at 2nd → false', () => {
    expect(markImage({ correctAnswer: 'कोठा', studentAnswer: 'कठिन' })).toBe(false); // needs 'ो' at idx 1
  });

  it('cleans punctuation/whitespace inside token and still matches → true', () => {
    expect(markImage({ correctAnswer: 'कील', studentAnswer: '  की,ड़ा  ' })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  markLetter                                                        */
/* ------------------------------------------------------------------ */
describe('markLetter', () => {
  test('identical single consonant → true', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'क' })).toBe(true);
  });

  test('identical single vowel → true', () => {
    expect(markLetter({ correctAnswer: 'ई', studentAnswer: 'ई' })).toBe(true);
  });

  test('single a vowel with long ā → true', () => {
    expect(markLetter({ correctAnswer: 'अ', studentAnswer: 'आ' })).toBe(true);
  });

  test("a short vowel with it's long form → true", () => {
    expect(markLetter({ correctAnswer: 'उ', studentAnswer: 'ऊ' })).toBe(true);
  });

  test("a long vowel with it's short form → true", () => {
    expect(markLetter({ correctAnswer: 'ऊ', studentAnswer: 'उ' })).toBe(true);
  });

  test('same family consonants → true (क ↔ ख)', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'ख' })).toBe(true);
  });

  test('student adds long ā mātrā where none in correct → true (क → का)', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'का' })).toBe(true);
  });

  test('student adds a non-long a mātrā where none in correct → false (क → क◌ी)', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'क◌ी' })).toBe(
      false,
    );
  });

  test('family + long ā together (क → खा) → true', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'खा' })).toBe(true);
  });

  test('false mismatch (क vs ग) → false', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'ग' })).toBe(false);
  });

  test('conjunct: exact cluster match (क्त) → true', () => {
    expect(markLetter({ correctAnswer: 'क्त', studentAnswer: 'क्त' })).toBe(
      true,
    );
  });

  test('conjunct: extra ā on cluster (क्त → क्ता) → false', () => {
    expect(markLetter({ correctAnswer: 'क्त', studentAnswer: 'क्ता' })).toBe(
      false,
    );
  });

  test('hardcoded case: आ ↔ हाँ should be equivalent', () => {
    expect(markLetter({ correctAnswer: 'आ', studentAnswer: 'हाँ' })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  markLetter – previously missing consonants accept long ā          */
/* ------------------------------------------------------------------ */
describe('markLetter - base + long ā for previously-uncovered consonants', () => {
  const PREVIOUSLY_UNFAMILIED_CONSONANTS = [
    'ल',
    'म',
    'न',
    'व',
    'ह',
    'य',
    'ङ',
    'ञ',
    'ण',
  ];

  test.each(PREVIOUSLY_UNFAMILIED_CONSONANTS.map((c) => [c, c + LONG_A]))(
    '%s → %s should be marked correct',
    (base, withLongA) => {
      expect(
        markLetter({
          correctAnswer: base,
          studentAnswer: withLongA,
        }),
      ).toBe(true);
    },
  );

  test.each(PREVIOUSLY_UNFAMILIED_CONSONANTS.map((c) => [c, c]))(
    '%s → %s exact match remains correct',
    (base, same) => {
      expect(
        markLetter({
          correctAnswer: base,
          studentAnswer: same,
        }),
      ).toBe(true);
    },
  );
});

/* ------------------------------------------------------------------ */
/*  detectIncorrectEndMatra                                           */
/* ------------------------------------------------------------------ */
describe('detectIncorrectEndMatra', () => {
  test('true when student adds long ā at end', () => {
    expect(
      detectIncorrectEndMatra({ correctAnswer: 'कल', studentAnswer: 'कला' }),
    ).toBe(true);
  });

  test('false when student matches exactly (no extra ā)', () => {
    expect(
      detectIncorrectEndMatra({ correctAnswer: 'कल', studentAnswer: 'कल' }),
    ).toBe(false);
  });

  test('correct already ends with ā, student identical → false', () => {
    expect(
      detectIncorrectEndMatra({ correctAnswer: 'कला', studentAnswer: 'कला' }),
    ).toBe(false);
  });

  test('replace non-ā mātrā with ā → false', () => {
    expect(
      detectIncorrectEndMatra({ correctAnswer: 'की', studentAnswer: 'किया' }),
    ).toBe(false);
  });

  test.each([
    ['कल', 'कला', true],
    ['कमल', 'कमला', true],
    ['कलकल', 'कलकल' + LONG_A, true],
  ])('%s → %s', (correct, student, expected) => {
    expect(
      detectIncorrectEndMatra({
        correctAnswer: correct,
        studentAnswer: student,
      }),
    ).toBe(expected);
  });
});

/* ------------------------------------------------------------------ */
/*  detectIncorrectMiddleMatra                                        */
/* ------------------------------------------------------------------ */
describe('detectIncorrectMiddleMatra', () => {
  test('true when matra inserted between 2nd & 3rd consonant', () => {
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'कलकल',
        studentAnswer: 'कलाकल',
      }),
    ).toBe(true);
  });

  test('false when words identical (no extra matra)', () => {
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'कलकल',
        studentAnswer: 'कलकल',
      }),
    ).toBe(false);
  });

  test('two & three consonant words always false', () => {
    expect(
      detectIncorrectMiddleMatra({ correctAnswer: 'कल', studentAnswer: 'कला' }),
    ).toBe(false);
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'कमल',
        studentAnswer: 'कमाल',
      }),
    ).toBe(false);
  });

  test('four-consonant word with existing matra in target → false', () => {
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'तरबूज',
        studentAnswer: 'तरबूज',
      }),
    ).toBe(false);
  });

  test('middle-mātrā: matra between 1st & 2nd consonant (कालकल) → false', () => {
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'कलकल',
        studentAnswer: 'कालकल',
      }),
    ).toBe(false);
  });
});
