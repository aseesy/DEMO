/**
 * Unit Tests for ArchiveThreadUseCase
 * Tests thread archival with cascade support
 */

const { ArchiveThreadUseCase } = require('../ArchiveThreadUseCase');
const { eventEmitter } = require('../../../../core/events/DomainEventEmitter');
const { THREAD_ARCHIVED } = require('../../../../core/events/ThreadEvents');

// Mock dependencies
jest.mock('../../../../core/events/DomainEventEmitter');
jest.mock('../../../../core/events/ThreadEvents', () => ({
  THREAD_ARCHIVED: 'ThreadArchived',
}));
jest.mock('../../../../../dbPostgres', () => ({
  query: jest.fn(),
}));

const dbPostgres = require('../../../../../dbPostgres');

describe('ArchiveThreadUseCase', () => {
  let useCase;
  let mockThreadRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    eventEmitter.emit = jest.fn();
    dbPostgres.query.mockResolvedValue({ rows: [] });

    // Create mock repository
    mockThreadRepository = {
      findById: jest.fn(),
      archive: jest.fn(),
    };

    // Create use case instance
    useCase = new ArchiveThreadUseCase(mockThreadRepository);
  });

  describe('execute', () => {
    const validParams = {
      threadId: 'thread-123',
      archived: true,
      cascade: true,
    };

    const mockThread = {
      id: 'thread-123',
      room_id: 'room-456',
      title: 'Test Thread',
      is_archived: 0,
    };

    it('should successfully archive thread without cascade', async () => {
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);

      const result = await useCase.execute({
        threadId: 'thread-123',
        archived: true,
        cascade: false,
      });

      expect(mockThreadRepository.findById).toHaveBeenCalledWith('thread-123');
      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-123', true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(THREAD_ARCHIVED, {
        threadId: 'thread-123',
        roomId: 'room-456',
        archived: true,
        cascade: false,
        affectedThreadIds: ['thread-123'],
      });

      expect(result).toEqual({
        success: true,
        threadId: 'thread-123',
        archived: true,
        affectedThreadIds: ['thread-123'],
      });
    });

    it('should archive thread with cascade to sub-threads', async () => {
      const subThread1 = { id: 'thread-456', title: 'Sub Thread 1', depth: 1 };
      const subThread2 = { id: 'thread-789', title: 'Sub Thread 2', depth: 2 };

      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);

      // Mock recursive CTE query for sub-threads
      dbPostgres.query.mockResolvedValueOnce({
        rows: [subThread1, subThread2],
      });

      const result = await useCase.execute(validParams);

      expect(mockThreadRepository.archive).toHaveBeenCalledTimes(3); // Main thread + 2 sub-threads
      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-123', true);
      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-456', true);
      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-789', true);

      expect(eventEmitter.emit).toHaveBeenCalledWith(THREAD_ARCHIVED, {
        threadId: 'thread-123',
        roomId: 'room-456',
        archived: true,
        cascade: true,
        affectedThreadIds: ['thread-123', 'thread-456', 'thread-789'],
      });

      expect(result.affectedThreadIds).toEqual(['thread-123', 'thread-456', 'thread-789']);
    });

    it('should unarchive thread', async () => {
      const archivedThread = { ...mockThread, is_archived: 1 };
      mockThreadRepository.findById.mockResolvedValue(archivedThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);

      const result = await useCase.execute({
        threadId: 'thread-123',
        archived: false,
        cascade: false,
      });

      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-123', false);
      expect(result.archived).toBe(false);
    });

    it('should not cascade when unarchiving', async () => {
      const archivedThread = { ...mockThread, is_archived: 1 };
      mockThreadRepository.findById.mockResolvedValue(archivedThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);

      // Even if cascade=true, it should only unarchive the main thread
      const result = await useCase.execute({
        threadId: 'thread-123',
        archived: false,
        cascade: true,
      });

      expect(mockThreadRepository.archive).toHaveBeenCalledTimes(1);
      expect(mockThreadRepository.archive).toHaveBeenCalledWith('thread-123', false);
      expect(result.affectedThreadIds).toEqual(['thread-123']);
    });

    it('should throw error if thread not found', async () => {
      mockThreadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validParams)).rejects.toThrow('Thread not found: thread-123');
      expect(mockThreadRepository.archive).not.toHaveBeenCalled();
    });

    it('should handle empty sub-threads list', async () => {
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);
      dbPostgres.query.mockResolvedValueOnce({ rows: [] }); // No sub-threads

      const result = await useCase.execute(validParams);

      expect(mockThreadRepository.archive).toHaveBeenCalledTimes(1);
      expect(result.affectedThreadIds).toEqual(['thread-123']);
    });

    it('should exclude already archived sub-threads from cascade', async () => {
      // The recursive query filters by is_archived = 0, so archived threads won't be returned
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockThreadRepository.archive.mockResolvedValue(undefined);
      dbPostgres.query.mockResolvedValueOnce({ rows: [] }); // No unarchived sub-threads

      const result = await useCase.execute(validParams);

      expect(mockThreadRepository.archive).toHaveBeenCalledTimes(1);
      expect(result.affectedThreadIds).toEqual(['thread-123']);
    });
  });
});

