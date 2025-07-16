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

type MarkArgs = { target: string; studentAnswer: string };

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
  static markWord({ target, studentAnswer }: MarkArgs): boolean {
    return studentAnswer
      .trim()
      .split(/\s+/)
      .some((w) => w === target);
  }

  /* alias */
  @LogMethod()
  static markImage({ target, studentAnswer }: MarkArgs): boolean {
    return this.markWord(args);
  }

  @LogMethod()
  static markLetter({ target, studentAnswer }: MarkArgs): boolean {
    const words = studentAnswer.trim().split(/\s+/);
    const cCount = this.consonantCount(target);

    return words.some((w) =>
      cCount === 1
        ? this.markPhoneme(target, w)
        : cCount === 2
          ? this.markConjunct(target, w)
          : false,
    );
  }

  private static markPhoneme(target: string, word: string): boolean {
    if (word === target) return true;

    if (sameFamily(word[0], target[0])) {
      if (word.slice(1) === target.slice(1)) return true;
      if (word.slice(1) === LONG_A && target.slice(1) === '') return true;
    }
    return false;
  }

  private static markConjunct(target: string, word: string): boolean {
    return word === target;
  }

  @LogMethod()
  static detectIncorrectEndMatra({ target, studentAnswer }: MarkArgs): boolean {
    return studentAnswer
      .trim()
      .split(/\s+/)
      .some((w) => w === target + LONG_A);
  }

  @LogMethod()
  static detectIncorrectMiddleMatra({
    target,
    studentAnswer,
  }: MarkArgs): boolean {
    const cleanT = target.normalize('NFC');
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

export const markWord = (args: MarkArgs) => EvaluateAnswer.markWord(args);
export const markImage = (args: MarkArgs) => EvaluateAnswer.markImage(args);
export const markLetter = (args: MarkArgs) => EvaluateAnswer.markLetter(args);
export const detectIncorrectEndMatra = (args: MarkArgs) =>
  EvaluateAnswer.detectIncorrectEndMatra(args);
export const detectIncorrectMiddleMatra = (args: MarkArgs) =>
  EvaluateAnswer.detectIncorrectMiddleMatra(args);
