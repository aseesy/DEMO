# Database Migration Strategy: SQLite to PostgreSQL

**Date**: 2025-01-05  
**Status**: Documentation Complete  
**Priority**: High

---

## Overview

LiaiZen currently uses SQLite for development and needs to migrate to PostgreSQL for production. This document outlines the migration strategy, process, and verification steps.

---

## Current State

### Database Systems

1. **SQLite** (`chat-server/chat.db`)
   - Used for: Development, local testing
   - Location: Local file system
   - Limitations: Single connection, no concurrent writes, not scalable

2. **PostgreSQL** (Target)
   - Used for: Production (Railway)
   - Location: Railway managed database
   - Benefits: Concurrent connections, ACID compliance, scalability

### Migration Status

- ✅ **Migration scripts exist**: 52 migration files in `chat-server/migrations/`
- ✅ **PostgreSQL schema defined**: `001_initial_schema.sql` uses PostgreSQL syntax
- ⚠️ **Current usage unclear**: Need to verify which database is actually being used

---

## Migration Strategy

### Phase 1: Assessment (Current)

**Goal**: Understand current database usage

**Tasks**:
1. ✅ Review migration files (52 migrations found)
2. ✅ Identify PostgreSQL-specific features used
3. ⚠️ Verify which database is actually connected in production
4. ⚠️ Check for SQLite-specific code that needs updating

**Deliverables**:
- Database usage report
- Compatibility assessment
- Migration readiness checklist

### Phase 2: Preparation

**Goal**: Prepare codebase for PostgreSQL-only operation

**Tasks**:
1. **Update database connection logic**
   - Remove SQLite fallback
   - Ensure PostgreSQL connection is required
   - Update connection pooling settings

2. **Review SQL compatibility**
   - Check for SQLite-specific syntax
   - Update queries to use PostgreSQL syntax
   - Test with PostgreSQL

3. **Update environment variables**
   - Document required `DATABASE_URL` format
   - Ensure production uses PostgreSQL connection string
   - Update development setup instructions

**Deliverables**:
- Updated database connection code
- SQL compatibility fixes
- Environment variable documentation

### Phase 3: Data Migration (If Needed)

**Goal**: Migrate existing SQLite data to PostgreSQL (if any exists)

**Tasks**:
1. **Export SQLite data**
   - Create export script
   - Export all tables to CSV/JSON
   - Verify data integrity

2. **Import to PostgreSQL**
   - Create import script
   - Map SQLite types to PostgreSQL types
   - Handle foreign key constraints

3. **Verify migration**
   - Compare record counts
   - Spot-check data integrity
   - Test application functionality

**Deliverables**:
- Export script
- Import script
- Migration verification report

### Phase 4: Deployment

**Goal**: Deploy PostgreSQL to production

**Tasks**:
1. **Production database setup**
   - Create PostgreSQL database on Railway
   - Run all migrations
   - Verify schema

2. **Update application**
   - Deploy updated code
   - Verify connection
   - Monitor for errors

3. **Rollback plan**
   - Document rollback steps
   - Test rollback procedure
   - Prepare emergency contacts

**Deliverables**:
- Production database ready
- Application deployed
- Monitoring in place

---

## Migration Process

### Step 1: Verify Current State

```bash
# Check which database is configured
cd chat-server
grep -r "DATABASE_URL" .env* config.js database.js

# Check migration status
npm run migrate:status

# Verify PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### Step 2: Review Migration Files

All migrations are in `chat-server/migrations/`:
- `000_create_migrations_table.sql` - Migration tracking
- `001_initial_schema.sql` - Base schema (PostgreSQL)
- `002-047_*.sql` - Feature migrations

**Key Observations**:
- ✅ All migrations use PostgreSQL syntax
- ✅ Foreign keys properly defined
- ✅ Indexes created for performance
- ✅ Data integrity constraints in place

### Step 3: Update Database Connection

**Current**: `chat-server/database.js` (facade)
**Location**: `chat-server/src/infrastructure/initialization/databaseInit.js`

**Required Changes**:
1. Remove SQLite support
2. Require PostgreSQL connection
3. Add connection validation
4. Update error messages

### Step 4: Test Migration

```bash
# Run migrations on test database
npm run migrate

# Verify schema
npm run db:validate

# Run tests
npm test
```

### Step 5: Deploy

```bash
# Production deployment (Railway)
# Migrations run automatically on deploy
# Or manually:
npm run migrate
```

---

## Verification Checklist

### Pre-Migration

- [ ] All migrations reviewed
- [ ] PostgreSQL connection tested
- [ ] SQL compatibility verified
- [ ] Environment variables configured
- [ ] Backup created (if needed)

### During Migration

- [ ] Migrations run successfully
- [ ] Schema validated
- [ ] Data integrity checked
- [ ] Application starts correctly
- [ ] Basic functionality tested

### Post-Migration

- [ ] All tests passing
- [ ] Production monitoring active
- [ ] Performance acceptable
- [ ] No errors in logs
- [ ] Rollback plan ready

---

## Rollback Plan

If migration fails:

1. **Immediate**: Revert code deployment
2. **Database**: Restore from backup (if needed)
3. **Verify**: Test application functionality
4. **Investigate**: Review logs and errors
5. **Fix**: Address issues before retry

---

## Environment Variables

### Required

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Or individual components
PGHOST=host
PGPORT=5432
PGDATABASE=database
PGUSER=user
PGPASSWORD=password
```

### Development

```env
# Local PostgreSQL
DATABASE_URL=postgresql://localhost:5432/liaizen_dev
```

### Production (Railway)

```env
# Railway provides DATABASE_URL automatically
# No manual configuration needed
```

---

## Migration Scripts

### Check Migration Status

```bash
cd chat-server
npm run migrate:status
```

### Run Migrations

```bash
cd chat-server
npm run migrate
```

### Validate Schema

```bash
cd chat-server
npm run db:validate
```

### Backup Database

```bash
cd chat-server
npm run db:backup
```

---

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution**: Check if migration was partially applied. Use `migrate:status` to verify.

### Issue: Foreign key constraint violations

**Solution**: Ensure migrations run in order. Check migration dependencies.

### Issue: Connection timeout

**Solution**: Increase connection pool size. Check network connectivity.

### Issue: Type mismatches

**Solution**: Review SQLite to PostgreSQL type mappings. Update migration scripts.

---

## Next Steps

1. **Immediate**: Verify current database usage in production
2. **Short-term**: Update connection logic to require PostgreSQL
3. **Medium-term**: Test full migration process
4. **Long-term**: Deploy to production

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)
- Migration files: `chat-server/migrations/`
- Database initialization: `chat-server/src/infrastructure/initialization/databaseInit.js`

---

**Status**: Documentation complete. Ready for implementation.

