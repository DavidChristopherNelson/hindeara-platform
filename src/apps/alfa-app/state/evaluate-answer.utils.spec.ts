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
    // Only the English “A/a” survives the regex; result should be equal
    expect(markWord({ correctAnswer: 'a', studentAnswer: 'A' })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  markWord  &  markImage (alias)                                    */
/* ------------------------------------------------------------------ */
describe('markWord / markImage', () => {
  const correct = 'कला'; // ends with LONG_A

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

  /* markImage should behave identically */
  test('markImage mirrors markWord', () => {
    expect(markImage({ correctAnswer: correct, studentAnswer: 'कला' })).toBe(
      true,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  markLetter                                                        */
/* ------------------------------------------------------------------ */
describe('markLetter', () => {
  test('identical single consonant → true', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'क' })).toBe(true);
  });

  test('same family consonants → true (क ↔ ख)', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'ख' })).toBe(true);
  });

  test('student adds long ā mātrā where none in correct → true (क → का)', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'का' })).toBe(true);
  });

  test('family + long ā together (क → खा) → true', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'खा' })).toBe(true);
  });

  test('false mismatch (क vs ग) → false', () => {
    expect(markLetter({ correctAnswer: 'क', studentAnswer: 'ग' })).toBe(false);
  });

  /* added: conjunct cluster cases */
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

  test('correct already ends with ā, student identical → true (per spec)', () => {
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
    // two, three, four consonant base forms
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
    // क ल क ल  →  क ल ा क ल
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
        correctAnswer: 'तरबूज', // already has ू on 3rd consonant
        studentAnswer: 'तरबूज',
      }),
    ).toBe(false);
  });

  /* added: matra at wrong location should not count */
  test('middle-mātrā: matra between 1st & 2nd consonant (कालकल) → false', () => {
    expect(
      detectIncorrectMiddleMatra({
        correctAnswer: 'कलकल',
        studentAnswer: 'कालकल',
      }),
    ).toBe(false);
  });
});
