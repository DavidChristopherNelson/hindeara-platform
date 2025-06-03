// src/hindeara-platform/app-events/app-events.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppEventsController } from './app-events.controller';
import { AppEventsService } from './app-events.service';
import { NotFoundException } from '@nestjs/common';

/* ---- tiny stub types – no decorators, no imports ---- */
interface StubAppEvent {
  id: number;
  recording: string;
  uiData: string;
  isComplete: boolean;
  createdAt: Date;
  user: { id: number };
  app: { id: number };
}

describe('AppEventsController', () => {
  let controller: AppEventsController;

  const mockAppEvent: StubAppEvent = {
    id: 1,
    recording: 'test-recording',
    uiData: 'test-ui-data',
    isComplete: true,
    createdAt: new Date(),
    user: { id: 1 },
    app: { id: 1 },
  };

  /* ---------- mocked service ---------- */
  const mockAppEventsService = {
    findAll: jest.fn().mockResolvedValue([] as StubAppEvent[]),
    findOne: jest.fn().mockResolvedValue(null as StubAppEvent | null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppEventsController],
      providers: [
        { provide: AppEventsService, useValue: mockAppEventsService },
      ],
    }).compile();

    controller = module.get<AppEventsController>(AppEventsController);
  });

  afterEach(() => jest.clearAllMocks());

  /* ---------- tests ---------- */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns an array of events', async () => {
      mockAppEventsService.findAll.mockResolvedValue([mockAppEvent]);

      const result = await controller.findAll();

      expect(result).toEqual([mockAppEvent]);
      expect(mockAppEventsService.findAll).toHaveBeenCalled();
    });

    it('returns an empty array when none exist', async () => {
      mockAppEventsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(mockAppEventsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns an event when it exists', async () => {
      mockAppEventsService.findOne.mockResolvedValue(mockAppEvent);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockAppEvent);
      expect(mockAppEventsService.findOne).toHaveBeenCalledWith(1);
    });

    it('returns null when it does not exist', async () => {
      mockAppEventsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(result).toBeNull();
      expect(mockAppEventsService.findOne).toHaveBeenCalledWith(999);
    });

    it('throws for NaN id', async () => {
      await expect(controller.findOne(NaN)).rejects.toThrow(NotFoundException);
    });
  });
});
