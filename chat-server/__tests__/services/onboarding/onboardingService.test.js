/* eslint-env jest */
/**
 * Onboarding Service Tests
 */

const { OnboardingService } = require('../../../src/services/onboarding/onboardingService');

describe('OnboardingService', () => {
  let service;
  let mockDbSafe;

  beforeEach(() => {
    service = new OnboardingService();

    // Create mock dbSafe
    mockDbSafe = {
      safeSelect: jest.fn(),
      safeUpdate: jest.fn(),
      safeInsert: jest.fn(),
      parseResult: jest.fn(result => result),
    };

    service.setDbSafe(mockDbSafe);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserHasCoParent', () => {
    it('should return true if user has completed pairing session as initiator', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'pairing_sessions') {
          return [{ initiator_id: 1, invitee_id: 2, status: 'completed' }];
        }
        return [];
      });

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(true);
      expect(mockDbSafe.safeSelect).toHaveBeenCalledWith('pairing_sessions', {
        status: 'completed',
      });
    });

    it('should return true if user has completed pairing session as invitee', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'pairing_sessions') {
          return [{ initiator_id: 2, invitee_id: 1, status: 'completed' }];
        }
        return [];
      });

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(true);
    });

    it('should return true if user is in a 2-person room', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'pairing_sessions') return [];
        if (table === 'room_members' && conditions.user_id) {
          return [{ room_id: 'room-123', user_id: 1 }];
        }
        if (table === 'room_members' && conditions.room_id) {
          return [
            { room_id: 'room-123', user_id: 1 },
            { room_id: 'room-123', user_id: 2 },
          ];
        }
        if (table === 'contacts') return [];
        return [];
      });

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(true);
    });

    it('should return true if user has co-parent contact', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'pairing_sessions') return [];
        if (table === 'room_members') return [];
        if (table === 'contacts') {
          return [{ user_id: 1, relationship: 'My Co-Parent' }];
        }
        return [];
      });

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(true);
    });

    it('should return false if no co-parent connection exists', async () => {
      mockDbSafe.safeSelect.mockResolvedValue([]);

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(false);
    });

    it('should return false if dbSafe is not initialized', async () => {
      const uninitializedService = new OnboardingService();

      const result = await uninitializedService.checkUserHasCoParent(1);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const result = await service.checkUserHasCoParent(1);

      expect(result).toBe(false);
    });
  });

  describe('autoCompleteOnboardingTasks', () => {
    const mockUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      address: null,
      communication_style: null,
      communication_triggers: null,
      communication_goals: null,
    };

    it('should auto-complete "Complete Your Profile" when 2+ fields filled', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [mockUser];
        if (table === 'contacts') return [];
        if (table === 'tasks') {
          return [{ id: 1, title: 'Complete Your Profile', status: 'open' }];
        }
        return [];
      });
      mockDbSafe.safeUpdate.mockResolvedValue({ rowCount: 1 });

      await service.autoCompleteOnboardingTasks(1);

      expect(mockDbSafe.safeUpdate).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({ status: 'completed' }),
        { id: 1 }
      );
    });

    it('should auto-complete "Add Your Co-parent" when co-parent contact exists', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [mockUser];
        if (table === 'contacts') {
          return [{ user_id: 1, relationship: 'My Co-Parent' }];
        }
        if (table === 'tasks') {
          return [{ id: 2, title: 'Add Your Co-parent', status: 'open' }];
        }
        return [];
      });
      mockDbSafe.safeUpdate.mockResolvedValue({ rowCount: 1 });

      await service.autoCompleteOnboardingTasks(1);

      expect(mockDbSafe.safeUpdate).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({ status: 'completed' }),
        { id: 2 }
      );
    });

    it('should auto-complete "Add Your Children" when child contact exists', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [mockUser];
        if (table === 'contacts') {
          return [{ user_id: 1, relationship: 'My Child' }];
        }
        if (table === 'tasks') {
          return [{ id: 3, title: 'Add Your Children', status: 'open' }];
        }
        return [];
      });
      mockDbSafe.safeUpdate.mockResolvedValue({ rowCount: 1 });

      await service.autoCompleteOnboardingTasks(1);

      expect(mockDbSafe.safeUpdate).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({ status: 'completed' }),
        { id: 3 }
      );
    });

    it('should not complete tasks if conditions not met', async () => {
      const incompleteUser = {
        ...mockUser,
        first_name: null,
        last_name: null,
        email: 'test@example.com', // Only 1 field filled
      };

      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [incompleteUser];
        if (table === 'contacts') return [];
        if (table === 'tasks') {
          return [{ id: 1, title: 'Complete Your Profile', status: 'open' }];
        }
        return [];
      });

      await service.autoCompleteOnboardingTasks(1);

      expect(mockDbSafe.safeUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing if user not found', async () => {
      mockDbSafe.safeSelect.mockResolvedValue([]);

      await service.autoCompleteOnboardingTasks(999);

      expect(mockDbSafe.safeUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.autoCompleteOnboardingTasks(1)).resolves.toBeUndefined();
    });
  });

  describe('backfillOnboardingTasks', () => {
    it('should create missing onboarding tasks', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [{ id: 1 }];
        if (table === 'pairing_sessions') return [];
        if (table === 'room_members') return [];
        if (table === 'contacts') return [];
        if (table === 'tasks') return []; // No existing tasks
        return [];
      });
      mockDbSafe.safeInsert.mockResolvedValue({ id: 1 });

      await service.backfillOnboardingTasks(1);

      // Should create 3 onboarding tasks
      expect(mockDbSafe.safeInsert).toHaveBeenCalledTimes(3);
      expect(mockDbSafe.safeInsert).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({
          user_id: 1,
          title: 'Complete Your Profile',
          category: 'onboarding',
        })
      );
    });

    it('should not create duplicate tasks', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [{ id: 1 }];
        if (table === 'pairing_sessions') return [];
        if (table === 'room_members') return [];
        if (table === 'contacts') return [];
        if (table === 'tasks') {
          return [
            { title: 'Complete Your Profile', status: 'open' },
            { title: 'Invite Your Co-Parent', status: 'open' },
            { title: 'Add Your Children', status: 'open' },
          ];
        }
        return [];
      });

      await service.backfillOnboardingTasks(1);

      expect(mockDbSafe.safeInsert).not.toHaveBeenCalled();
    });

    it('should mark co-parent task as completed if co-parent exists', async () => {
      mockDbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'users') return [{ id: 1 }];
        if (table === 'pairing_sessions') {
          return [{ initiator_id: 1, invitee_id: 2, status: 'completed' }];
        }
        if (table === 'room_members') return [];
        if (table === 'contacts') return [];
        if (table === 'tasks') return [];
        return [];
      });
      mockDbSafe.safeInsert.mockResolvedValue({ id: 1 });

      await service.backfillOnboardingTasks(1);

      // Check that Invite Your Co-Parent task was created as completed
      expect(mockDbSafe.safeInsert).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({
          title: 'Invite Your Co-Parent',
          status: 'completed',
          completed_at: expect.any(String),
        })
      );
    });

    it('should do nothing if user not found', async () => {
      mockDbSafe.safeSelect.mockResolvedValue([]);

      await service.backfillOnboardingTasks(999);

      expect(mockDbSafe.safeInsert).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.backfillOnboardingTasks(1)).resolves.toBeUndefined();
    });
  });

  describe('setDbSafe', () => {
    it('should set the dbSafe instance', () => {
      const newService = new OnboardingService();
      const mockDb = { safeSelect: jest.fn() };

      newService.setDbSafe(mockDb);

      expect(newService.dbSafe).toBe(mockDb);
    });
  });
});
