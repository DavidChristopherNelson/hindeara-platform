// src/apps/alfa-app/state/evaluate-answer.utils.ts
import { LogMethod } from 'src/common/decorators/log-method.decorator';

/* ───────── constants ───────── */
const CONSONANT_SET = new Set(
  'अआइईउऊऋॠऌॡएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहabcdefghijklmnopqrstuvwxyz'.split(
    '',
  ),
);

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
  ['य', 'ए', 'ऐ'],
  ['ओ', 'औ'],
  ['अ', 'आ'],
  ['इ', 'ई'],
  ['उ', 'ऊ'],
  ['ऋ', 'ॠ'],
  ['ऌ', 'ॡ'],
  ['ड', 'ड़'],
  ['ङ'],
  ['ञ'],
  ['ण'],
  ['न'],
  ['म'],
  ['ल'],
  ['व'],
  ['ह'],
];

const CHARACTER_TO_FAMILY = new Map<string, number>();
FAMILIES.forEach((fam, i) =>
  fam.forEach((ch) => CHARACTER_TO_FAMILY.set(ch, i)),
);
const sameFamily = (a: string, b: string) => {
  const famA = CHARACTER_TO_FAMILY.get(a);
  const famB = CHARACTER_TO_FAMILY.get(b);
  return famA !== undefined && famB !== undefined && famA === famB;
};

type MarkArgs = { correctAnswer: string; studentAnswer: string };

const MATRAS = new Set([
  "ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ",
]);

function splitWord(word: string): string[] {
  // Properly split Hindi text into Unicode characters
  return Array.from(word);
}

function isMatra(char: string): boolean {
  return MATRAS.has(char);
}

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

  private static clean(str: string): string {
    return str
      .normalize('NFC')
      .trim()
      .replace(/[^\p{L}\p{M}]/gu, '')
      .toLocaleLowerCase();
  }

  /* public APIs --------------------------------------------------- */

  @LogMethod()
  static markWord({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const cleanedCorrectAnswer = this.clean(correctAnswer);
    const splitStudentAnswer = studentAnswer.split(/\s+/);

    const isEquivalent = (a: string, b: string) => a === b || sameFamily(a, b);

    return splitStudentAnswer.some((w) => {
      const cleanedW = this.clean(w);
      if (cleanedW === cleanedCorrectAnswer) return true;

      // Hard coding some common transcription engine mistakes.
      if (cleanedCorrectAnswer === 'ईख' && cleanedW === 'एक') return true;
      if (cleanedCorrectAnswer === 'दरवाज़ा' && cleanedW === 'दरवाजा')
        return true;
      if (correctAnswer === 'हथौड़ा' && studentAnswer === 'हथौड़ी') return true;
      if (correctAnswer === 'हथौड़ी' && studentAnswer === 'हथौड़ा') return true;
      if (correctAnswer === 'और' && studentAnswer === 'ओर') return true;
      if (correctAnswer === 'ओर' && studentAnswer === 'और') return true;
      if (correctAnswer === 'पढ़' && studentAnswer === 'पड़') return true;
      if (correctAnswer === 'पड़' && studentAnswer === 'पढ़') return true;
      if (correctAnswer === 'गए' && studentAnswer === 'गये') return true;
      if (correctAnswer === 'गये' && studentAnswer === 'गए') return true;
      if (correctAnswer === 'डर' && studentAnswer === 'दर') return true;
      if (correctAnswer === 'दर' && studentAnswer === 'डर') return true;
      if (correctAnswer === 'एक' && studentAnswer === '1') return true;
      if (correctAnswer === 'एक' && studentAnswer === 'एकाएक') return true;
      if (correctAnswer === 'दो' && studentAnswer === '2') return true;
      if (correctAnswer === 'तीन' && studentAnswer === '3') return true;
      if (correctAnswer === 'चार' && studentAnswer === '4') return true;
      if (correctAnswer === 'पाँच' && studentAnswer === '5') return true;
      if (correctAnswer === 'छह' && studentAnswer === '6') return true;
      if (correctAnswer === 'सात' && studentAnswer === '7') return true;
      if (correctAnswer === 'आठ' && studentAnswer === '8') return true;
      if (correctAnswer === 'नौ' && studentAnswer === '9') return true;
      if (correctAnswer === 'दस' && studentAnswer === '10') return true;
      if (correctAnswer === 'बीस' && studentAnswer === '20') return true;
      if (correctAnswer === 'तीस' && studentAnswer === '30') return true;
      if (correctAnswer === 'चालीस' && studentAnswer === '40') return true;
      if (correctAnswer === 'पचास' && studentAnswer === '50') return true;
      if (correctAnswer === 'साठ' && studentAnswer === '60') return true;
      if (correctAnswer === 'सत्तर' && studentAnswer === '70') return true;
      if (correctAnswer === 'अस्सी' && studentAnswer === '80') return true;
      if (correctAnswer === 'नब्बे' && studentAnswer === '90') return true;
      if (correctAnswer === 'सौ' && studentAnswer === '100') return true;
      if (correctAnswer === 'चख' && studentAnswer === 'चकाचक') return true;
      if (correctAnswer === 'ठप' && studentAnswer === 'थपाथप') return true;
      if (correctAnswer === 'तन' && studentAnswer === 'टनाटन') return true;
      if (correctAnswer === 'फट' && studentAnswer === 'फटाफट') return true;
      if (correctAnswer === 'भर' && studentAnswer === 'बराबर') return true;
      if (correctAnswer === 'हट' && studentAnswer === 'हताहत') return true;
      if (correctAnswer === 'गुण' && studentAnswer === 'गुन') return true;
      if (correctAnswer === 'गुण' && studentAnswer === 'गुड़') return true;
      if (correctAnswer === 'गुण' && studentAnswer === 'गुर') return true;
      if (correctAnswer === 'गुण' && studentAnswer === 'गुड') return true;
      if (correctAnswer === 'नहीं' && studentAnswer === 'नई') return true;
      if (correctAnswer === 'नई' && studentAnswer === 'नहीं') return true;
      if (correctAnswer === 'बच' && studentAnswer === 'बच्च') return true;
      if (correctAnswer === 'हाँ' && studentAnswer === 'हां') return true;
      if (correctAnswer === 'भय' && studentAnswer === 'भाई') return true;
      if (correctAnswer === 'ऊन' && studentAnswer === 'उन') return true;
      if (correctAnswer === 'उन' && studentAnswer === 'ऊन') return true;
      // Schwa deletion: ignore trailing long ā (ा) in correctAnswer
      if (
        cleanedCorrectAnswer.endsWith(LONG_A) &&
        cleanedW === cleanedCorrectAnswer.slice(0, -1)
      ) {
        return true;
      }

      // Match words that have characters in the same family in the same position.
      // Also allow for the student to prepend some characters to the student answer.
      if (cleanedW.length >= cleanedCorrectAnswer.length) {
        const offset = cleanedW.length - cleanedCorrectAnswer.length;
        for (let i = 0; i < cleanedCorrectAnswer.length; i++) {
          if (!isEquivalent(cleanedW[i + offset], cleanedCorrectAnswer[i])) {
            return false;
          }
        }
        return true;
      }

      return false;
    });
  }

  @LogMethod()
  static markImage({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const cleanedExampleWord = this.clean(correctAnswer);
    const cleanedExampleChars = splitWord(cleanedExampleWord);

    const splitStudentAnswer = studentAnswer.split(/\s+/);
    for (const studentWord of splitStudentAnswer) {
      const cleanedStudentWord = this.clean(studentWord)
      const cleanedStudentChars = splitWord(cleanedStudentWord);
      if (cleanedExampleChars.length === 0 || cleanedStudentChars.length === 0) {
        continue;
      }
      if (cleanedExampleChars[0] !== cleanedStudentChars[0]) continue;
      if (cleanedExampleChars.length > 1 && isMatra(cleanedExampleChars[1])) {
        if (!(cleanedStudentChars.length > 1 && cleanedStudentChars[1] === cleanedExampleChars[1])) {
          continue;
        }
      }
      return true;
    }
    return false;
  }

  @LogMethod()
  static markLetter({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const cleanedCorrectAnswer = this.clean(correctAnswer);
    const words = studentAnswer.trim().split(/\s+/);
    const cCount = this.consonantCount(cleanedCorrectAnswer);

    return words.some((w) => {
      const cleaned = this.clean(w);
      // Hard coding some common transcription engine mistakes.
      if (cleanedCorrectAnswer === 'म' && cleaned === 'माँ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ह' && cleaned === 'हां') {
        return true;
      }
      if (cleanedCorrectAnswer === 'औ' && cleaned === 'ओह') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ओ' && cleaned === 'ओह') {
        return true;
      }
      if (cleanedCorrectAnswer === 'आ' && cleaned === 'हाँ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'आ' && cleaned === 'हां') {
        return true;
      }
      if (cleanedCorrectAnswer === 'आ' && cleaned === 'का') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ा' && cleaned === 'आ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ा' && cleaned === 'हाँ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ा' && cleaned === 'हां') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ा' && cleaned === 'का') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ि' && cleaned === 'इ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ी' && cleaned === 'ई') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ु' && cleaned === 'उ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ू' && cleaned === 'ऊ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ृ' && cleaned === 'ऋ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'े' && cleaned === 'ए') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ै' && cleaned === 'ऐ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ो' && cleaned === 'ओ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ौ' && cleaned === 'औ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ओ' && cleaned === 'आओ') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ऋ' && cleaned === 'री') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ऋ' && cleaned === 'रि') {
        return true;
      }
      if (cleanedCorrectAnswer === 'श' && cleaned === 'शाह') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ष' && cleaned === 'शाह') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ा' && cleaned === 'बड़ा') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ी' && cleaned === 'बड़ी') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ए' && cleaned === 'ऐसे') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ब' && cleaned === 'वाह') {
        return true;
      }
      if (cleanedCorrectAnswer === 'ख' && cleaned === 'हाँ ') {
        return true;
      }

      if (cCount === 1) {
        return this.markPhoneme(cleanedCorrectAnswer, cleaned);
      } else if (cCount === 2) {
        return this.markConjunct(cleanedCorrectAnswer, cleaned);
      } else {
        return false;
      }
    });
  }

  @LogMethod()
  private static markPhoneme(correctAnswer: string, word: string): boolean {
    if (!word || !correctAnswer) return false;
    if (word === correctAnswer) return true;

    const baseMatches =
      word[0] === correctAnswer[0] || sameFamily(word[0], correctAnswer[0]);

    if (baseMatches) {
      if (word.slice(1) === correctAnswer.slice(1)) return true;
      if (word.slice(1) === LONG_A && correctAnswer.slice(1) === '')
        return true;
    }
    return false;
  }

  @LogMethod()
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
