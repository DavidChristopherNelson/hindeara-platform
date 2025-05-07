import { createActor, SnapshotFrom } from 'xstate';
import { lessonMachine } from './state.machine';

function startMachine(snapshot?: SnapshotFrom<typeof lessonMachine>) {
  return createActor(
    lessonMachine,
    snapshot ? { snapshot } : undefined,
  ).start();
}

describe('lessonMachine', () => {
  it('starts in the "word" state with index 0', () => {
    const actor = startMachine();
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('word');
    expect(snap.context.index).toBe(0);
  });

  describe('top‑level transitions from "word"', () => {
    it('CORRECT_ANSWER → complete (final)', () => {
      const actor = startMachine();
      actor.send({ type: 'CORRECT_ANSWER' });
      expect(actor.getSnapshot().value).toBe('complete');
    });

    it('INCORRECT_ANSWER → letter (index stays 0)', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' });
      const snap = actor.getSnapshot();
      expect(snap.value).toBe('letter');
      expect(snap.context.index).toBe(0);
    });

    it('START_LESSON is self‑loop to "word"', () => {
      const actor = startMachine();
      actor.send({ type: 'START_LESSON' });
      expect(actor.getSnapshot().value).toBe('word');
    });
  });

  describe('"letter" state', () => {
    it('INCORRECT_ANSWER → picture', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' }); // word -> letter
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      expect(actor.getSnapshot().value).toBe('picture');
    });

    it('CORRECT_ANSWER increments index until last letter then resets', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' }); // word -> letter (index 0)

      // first correct answer (index 0 -> 1)
      actor.send({ type: 'CORRECT_ANSWER' });
      let snap = actor.getSnapshot();
      expect(snap.value).toBe('letter');
      expect(snap.context.index).toBe(1);

      // second correct answer (index 1 -> 2)
      actor.send({ type: 'CORRECT_ANSWER' });
      snap = actor.getSnapshot();
      expect(snap.value).toBe('letter');
      expect(snap.context.index).toBe(2);

      // third correct answer (index 2 is last; guard true)
      actor.send({ type: 'CORRECT_ANSWER' });
      snap = actor.getSnapshot();
      expect(snap.value).toBe('word'); // back to word
      expect(snap.context.index).toBe(0); // resetIndex action
    });
  });

  describe('"picture" and "letterPicture" loop', () => {
    it('picture CORRECT_ANSWER → letterPicture', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' }); // word -> letter
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      actor.send({ type: 'CORRECT_ANSWER' }); // picture -> letterPicture
      expect(actor.getSnapshot().value).toBe('letterPicture');
    });

    it('letterPicture INCORRECT_ANSWER → picture', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' }); // word -> letter
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      actor.send({ type: 'CORRECT_ANSWER' }); // picture -> letterPicture
      actor.send({ type: 'INCORRECT_ANSWER' }); // back to picture
      expect(actor.getSnapshot().value).toBe('picture');
    });

    it('letterPicture CORRECT_ANSWER loops until last letter, then → word', () => {
      const actor = startMachine();
      actor.send({ type: 'INCORRECT_ANSWER' }); // word -> letter
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      actor.send({ type: 'CORRECT_ANSWER' }); // picture -> letterPicture (index 0)
      actor.send({ type: 'CORRECT_ANSWER' }); // letterPicture -> letter (index 1)
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      actor.send({ type: 'CORRECT_ANSWER' }); // picture -> letterPicture (index 1)
      actor.send({ type: 'CORRECT_ANSWER' }); // letterPicture -> letter (index 2)
      actor.send({ type: 'INCORRECT_ANSWER' }); // letter -> picture
      actor.send({ type: 'CORRECT_ANSWER' }); // picture -> letterPicture (index 2)
      actor.send({ type: 'CORRECT_ANSWER' }); // letterPicture -> word (guard true)
      const snap = actor.getSnapshot();
      expect(snap.value).toBe('word');
      expect(snap.context.index).toBe(0);
    });
  });
});
