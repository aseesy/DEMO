/**
 * Sync Service Module Export Tests
 *
 * Ensures sync service modules are properly exported.
 */

const { describe, it, expect } = require('@jest/globals');

// Mock dependencies before importing
jest.mock('../../../dbSafe', () => ({}));
jest.mock('../../../dbPostgres', () => ({ query: jest.fn() }));
jest.mock('../../infrastructure/database/neo4jClient', () => ({
  isAvailable: jest.fn(() => false),
  runQuery: jest.fn(),
}));

describe('Sync Service Exports', () => {
  it('exports dbSyncValidator functions', () => {
    const sync = require('../../services/sync/index');
    expect(sync).toBeDefined();
    expect(typeof sync.validateCoParentRelationships).toBe('function');
  });

  it('exports relationshipSync functions', () => {
    const sync = require('../../services/sync/index');
    expect(typeof sync.syncRoomMetadata).toBe('function');
    expect(typeof sync.syncAllRelationships).toBe('function');
    expect(typeof sync.startSyncJob).toBe('function');
    expect(typeof sync.stopSyncJob).toBe('function');
  });
});
