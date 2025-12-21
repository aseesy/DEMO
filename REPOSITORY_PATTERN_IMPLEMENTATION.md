# Repository Pattern Implementation Plan

**Goal**: Achieve DIP compliance by abstracting data access from business logic

## Current Violations

1. **BaseService directly depends on PostgreSQL** (line 19)
2. **18 direct `require('dbPostgres')` in services**
3. **70+ SQL queries in business logic**

## Implementation Strategy

### Phase 1: Create Repository Interfaces
- Define abstractions for main entities
- Focus on entities used by services: User, Room, Task, Contact, PairingSession, Invitation

### Phase 2: Implement PostgreSQL Repositories
- Move SQL queries from services to repositories
- Implement interface methods

### Phase 3: Refactor BaseService
- Accept repository in constructor
- Remove direct database dependency
- Maintain backward compatibility during transition

### Phase 4: Update Services
- Inject repositories via constructor
- Replace direct SQL with repository methods
- One service at a time

### Phase 5: Dependency Injection
- Wire up repositories at application startup
- Remove all direct `require('dbPostgres')` from services

## Repository Interfaces to Create

1. `IUserRepository` - User data access
2. `IRoomRepository` - Room data access
3. `ITaskRepository` - Task data access
4. `IContactRepository` - Contact data access
5. `IPairingSessionRepository` - Pairing session data access
6. `IInvitationRepository` - Invitation data access
7. `IGenericRepository` - Generic CRUD operations (for BaseService)

## Files to Create

```
src/repositories/
├── interfaces/
│   ├── IGenericRepository.js
│   ├── IUserRepository.js
│   ├── IRoomRepository.js
│   ├── ITaskRepository.js
│   ├── IContactRepository.js
│   ├── IPairingSessionRepository.js
│   └── IInvitationRepository.js
├── postgres/
│   ├── PostgresGenericRepository.js
│   ├── PostgresUserRepository.js
│   ├── PostgresRoomRepository.js
│   ├── PostgresTaskRepository.js
│   ├── PostgresContactRepository.js
│   ├── PostgresPairingSessionRepository.js
│   └── PostgresInvitationRepository.js
└── index.js
```

## Migration Approach

1. **Add, don't replace** - New repositories work alongside old code
2. **Gradual migration** - One service at a time
3. **Backward compatible** - Old code continues to work
4. **Test-driven** - Ensure existing tests still pass

