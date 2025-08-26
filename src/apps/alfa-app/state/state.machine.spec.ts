// src/apps/alfa-app/state/state.machine.spec.ts
import { createActor } from 'xstate';

// ---- Mock evaluation utils so tests are deterministic ----
// Correct iff studentAnswer === '✅'. No special matra detection.
jest.mock('./evaluate-answer.utils', () => ({
  markWord: jest.fn(
    ({ studentAnswer }: { studentAnswer: string }) => studentAnswer === '✅',
  ),
  markLetter: jest.fn(
    ({ studentAnswer }: { studentAnswer: string }) => studentAnswer === '✅',
  ),
  markImage: jest.fn(
    ({ studentAnswer }: { studentAnswer: string }) => studentAnswer === '✅',
  ),
  detectIncorrectEndMatra: jest.fn(() => false),
  detectIncorrectMiddleMatra: jest.fn(() => false),
}));

// For incorrect answers, pretend there are three wrong letters to step through.
jest.mock('./identify-wrong-characters.utils', () => ({
  identifyWrongCharacters: jest.fn(
    ({ studentAnswer }: { correctAnswer: string; studentAnswer: string }) =>
      studentAnswer === '✅' ? [] : ['x', 'y', 'z'],
  ),
}));

import { lessonMachine } from './state.machine';

type AnswerEvent = {
  type: 'ANSWER';
  correctAnswer: string;
  studentAnswer: string;
};

const answer = (correct: string, student: string): AnswerEvent => ({
  type: 'ANSWER',
  correctAnswer: correct,
  studentAnswer: student,
});

const CORRECT = '✅';
const WRONG = '❌';

function start() {
  return createActor(lessonMachine).start();
}

describe('lessonMachine', () => {
  it('starts in "word" with clean previous* fields', () => {
    const actor = start();
    const snap = actor.getSnapshot();

    expect(snap.value).toBe('word');
    expect(snap.context.previousAnswerStatus).toBeNull();
    expect(snap.context.previousCorrectAnswer).toBeNull();
    expect(snap.context.previousStudentAnswer).toBeNull();

    actor.stop();
  });

  describe('transitions from "word"', () => {
    it('correct ANSWER → complete (final)', () => {
      const actor = start();

      actor.send(answer('शहद', CORRECT));
      const snap = actor.getSnapshot();

      expect(snap.value).toBe('complete');
      expect(snap.context.previousAnswerStatus).toBe(true);
      expect(snap.context.previousCorrectAnswer).toBe('शहद');
      expect(snap.context.previousStudentAnswer).toBe(CORRECT);

      actor.stop();
    });

    it('incorrect ANSWER → letter', () => {
      const actor = start();

      actor.send(answer('शहद', WRONG));
      const snap = actor.getSnapshot();

      expect(snap.value).toBe('letter');
      // wrongCharacters are mocked to 3 for incorrect answers
      expect(Array.isArray(snap.context.wrongCharacters)).toBe(true);
      expect(snap.context.wrongCharacters.length).toBe(3);
      expect(snap.context.previousAnswerStatus).toBe(false);
      expect(snap.context.previousCorrectAnswer).toBe('शहद');
      expect(snap.context.previousStudentAnswer).toBe(WRONG);

      actor.stop();
    });
  });

  describe('"letter" → "image" and back via "letterImage"', () => {
    it('letter incorrect → image; image correct → letterImage', () => {
      const actor = start();

      // word → letter (populate wrongCharacters = ['x','y','z'])
      actor.send(answer('शहद', WRONG));
      expect(actor.getSnapshot().value).toBe('letter');

      // letter → image (incorrect letter)
      actor.send(answer('x', WRONG));
      expect(actor.getSnapshot().value).toBe('image');
      expect(actor.getSnapshot().context.previousAnswerStatus).toBe(false);

      // image → letterImage (correct image)
      actor.send(answer('x', CORRECT));
      expect(actor.getSnapshot().value).toBe('letterImage');
      expect(actor.getSnapshot().context.previousAnswerStatus).toBe(true);

      actor.stop();
    });

    it('letterImage correct drops first wrong char → letter; then progresses until last letter → word', () => {
      const actor = start();

      // Setup to letterImage:
      actor.send(answer('शहद', WRONG)); // word -> letter (wrongChars = 3)
      actor.send(answer('x', WRONG)); // letter -> image
      actor.send(answer('x', CORRECT)); // image -> letterImage
      let snap = actor.getSnapshot();
      expect(snap.value).toBe('letterImage');
      expect(snap.context.wrongCharacters.length).toBe(3);

      // letterImage correct -> letter (dropFirstWrongCharacter)
      actor.send(answer('x', CORRECT));
      snap = actor.getSnapshot();
      expect(snap.value).toBe('letter');
      expect(snap.context.wrongCharacters.length).toBe(2);

      // letter correct (not last) -> letter (reenter), drop first again
      actor.send(answer('y', CORRECT));
      snap = actor.getSnapshot();
      expect(snap.value).toBe('letter');
      expect(snap.context.wrongCharacters.length).toBe(1);

      // letter correct (last) -> word
      actor.send(answer('z', CORRECT));
      snap = actor.getSnapshot();
      expect(snap.value).toBe('word');
      expect(snap.context.wrongCharacters.length).toBe(0);
      expect(snap.context.previousAnswerStatus).toBe(true);
      expect(snap.context.previousStudentAnswer).toBe(CORRECT);

      actor.stop();
    });
  });

  describe('persistEventData action', () => {
    it('captures the last ANSWER payload on every taken transition', () => {
      const actor = start();

      // incorrect: word -> letter
      actor.send(answer('शहद', WRONG));
      let snap = actor.getSnapshot();
      expect(snap.context.previousCorrectAnswer).toBe('शहद');
      expect(snap.context.previousStudentAnswer).toBe(WRONG);

      // correct: letter -> image
      actor.send(answer('x', WRONG)); // move to image
      actor.send(answer('x', CORRECT)); // image -> letterImage
      snap = actor.getSnapshot();
      expect(snap.context.previousCorrectAnswer).toBe('x');
      expect(snap.context.previousStudentAnswer).toBe(CORRECT);

      actor.stop();
    });
  });
});
