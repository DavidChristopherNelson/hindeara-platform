// src/apps/alfa-app/state/evaluate-answer.utils.ts
import { LogMethod } from 'src/common/decorators/log-method.decorator';

/* ───────── constants ───────── */
const CONSONANT_SET = new Set('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'.split(''));

const VOWEL_MATRA_SET = new Set(
  'ा ि ी ु ू ृ ॄ े ै ो ौ ॢ ॣ'.replace(/\s+/g, '').split(''),
);

const LONG_A = 'ा';

const FAMILIES: string[][] = [
  ['क', 'ख', 'क़', 'ख़'],
  ['ग', 'घ', 'ग़'],
  ['च', 'छ'],
  ['ज', 'झ', 'ज़'],
  ['ट', 'ठ', 'त', 'थ'],
  ['ड', 'ढ', 'द', 'ध'],
  ['प', 'फ', 'फ़'],
  ['ब', 'भ'],
  ['श', 'ष', 'स'],
  ['र', 'ड़', 'ढ़'],
];

const CONSONANT_TO_FAMILY = new Map<string, number>();
FAMILIES.forEach((fam, i) =>
  fam.forEach((ch) => CONSONANT_TO_FAMILY.set(ch, i)),
);
const sameFamily = (a: string, b: string) =>
  CONSONANT_TO_FAMILY.get(a) === CONSONANT_TO_FAMILY.get(b);

type MarkArgs = { correctAnswer: string; studentAnswer: string };

/* ───────── utility class ───────── */
class EvaluateAnswer {
  /* helpers */
  private static isConsonant = (ch: string) => CONSONANT_SET.has(ch);

  private static consonantCount(word: string): number {
    let c = 0;
    for (const ch of [...word.normalize('NFC')]) {
      if (this.isConsonant(ch)) c++;
    }
    return c;
  }

  /* public APIs --------------------------------------------------- */

  @LogMethod()
  static markWord({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    return studentAnswer
      .trim()
      .split(/\s+/)
      .some((w) => w === correctAnswer);
  }

  /* alias */
  @LogMethod()
  static markImage({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    return this.markWord({ correctAnswer, studentAnswer });
  }

  @LogMethod()
  static markLetter({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const words = studentAnswer.trim().split(/\s+/);
    const cCount = this.consonantCount(correctAnswer);

    return words.some((w) =>
      cCount === 1
        ? this.markPhoneme(correctAnswer, w)
        : cCount === 2
          ? this.markConjunct(correctAnswer, w)
          : false,
    );
  }

  private static markPhoneme(correctAnswer: string, word: string): boolean {
    if (word === correctAnswer) return true;

    if (sameFamily(word[0], correctAnswer[0])) {
      if (word.slice(1) === correctAnswer.slice(1)) return true;
      if (word.slice(1) === LONG_A && correctAnswer.slice(1) === '')
        return true;
    }
    return false;
  }

  private static markConjunct(correctAnswer: string, word: string): boolean {
    return word === correctAnswer;
  }

  @LogMethod()
  static detectIncorrectEndMatra({
    correctAnswer,
    studentAnswer,
  }: MarkArgs): boolean {
    return studentAnswer
      .trim()
      .split(/\s+/)
      .some((w) => w === correctAnswer + LONG_A);
  }

  @LogMethod()
  static detectIncorrectMiddleMatra({
    correctAnswer,
    studentAnswer,
  }: MarkArgs): boolean {
    const cleanT = correctAnswer.normalize('NFC');
    const cleanS = studentAnswer.normalize('NFC');

    if (this.consonantCount(cleanT) !== 4) return false;
    if (cleanT.includes('\u094D')) return false;
    if (this.consonantCount(cleanS) !== 4) return false;
    if (cleanS.includes('\u094D')) return false;

    const hasMatraBetween = (word: string) => {
      const chars = [...word];
      const idx = chars
        .map((ch, i) => (this.isConsonant(ch) ? i : -1))
        .filter((i) => i !== -1);

      const between = chars.slice(idx[1] + 1, idx[2]);
      return between.some((ch) => VOWEL_MATRA_SET.has(ch));
    };

    return !hasMatraBetween(cleanT) && hasMatraBetween(cleanS);
  }
}

export type { MarkArgs };
export const markWord = (args: MarkArgs) => EvaluateAnswer.markWord(args);
export const markImage = (args: MarkArgs) => EvaluateAnswer.markImage(args);
export const markLetter = (args: MarkArgs) => EvaluateAnswer.markLetter(args);
export const detectIncorrectEndMatra = (args: MarkArgs) =>
  EvaluateAnswer.detectIncorrectEndMatra(args);
export const detectIncorrectMiddleMatra = (args: MarkArgs) =>
  EvaluateAnswer.detectIncorrectMiddleMatra(args);
