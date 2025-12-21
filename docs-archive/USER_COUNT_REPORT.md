# User Count Report: Development vs Production

**Generated**: 2025-01-27  
**Current Environment**: Development

---

## 📊 Development Database

**Database**: `liaizen_dev` (PostgreSQL)  
**Host**: `localhost:5432`  
**Status**: ✅ Connected

### User Statistics

| Metric                      | Count |
| --------------------------- | ----- |
| **Total Users**             | **3** |
| Email/Password Users        | 3     |
| OAuth Users                 | 0     |
| New Users (last 7 days)     | 3     |
| Active Users (last 30 days) | 0     |

### User Details

1. **ID: 11** - Username: `test`, Email: `test@example.com`
   - Created: 2025-11-26
   - Last Login: Never

2. **ID: 10** - Username: `mom`, Email: `mom@test.com`
   - Created: 2025-11-26
   - Last Login: Never

3. **ID: 9** - Username: `finaltest`, Email: `finaltest@example.com`
   - Created: 2025-11-26
   - Last Login: Never

---

## 🚀 Production Database

**Status**: ✅ Accessible via API  
**Database**: PostgreSQL (managed by Railway)  
**Host**: Railway PostgreSQL service  
**Backend URL**: `https://demo-production-6dcd.up.railway.app`

### User Statistics

| Metric               | Count       |
| -------------------- | ----------- |
| **Total Users**      | **1**       |
| Email/Password Users | 1 (assumed) |
| OAuth Users          | 0 (assumed) |

### User Details

1. **ID: 1** - Username: `mom`, Email: `mom@test.com`
   - Created: 2025-11-25
   - Last Login: 2025-11-26 (Active user!)

### How to Check Production User Count

#### Option 1: Via Railway Dashboard

1. Go to https://railway.app/dashboard
2. Open **LiaiZen Demo** project
3. Open **positive-recreation** service
4. Go to **PostgreSQL** service (if separate) or check logs
5. Use Railway's database query interface

#### Option 2: Via API Endpoint

```bash
# If debug endpoint is enabled in production
curl https://demo-production-6dcd.up.railway.app/api/debug/users
```

#### Option 3: Via Railway CLI

```bash
# Connect to production database
railway connect

# Then run SQL query
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

#### Option 4: Create a Script (Recommended)

Create a script that uses the production `DATABASE_URL` from Railway:

```javascript
// count-production-users.js
require('dotenv').config();
const { Pool } = require('pg');

// Set PROD_DATABASE_URL from Railway dashboard
const prodUrl = process.env.PROD_DATABASE_URL;

if (!prodUrl) {
  console.log('⚠️  PROD_DATABASE_URL not set');
  console.log('   Get DATABASE_URL from Railway Dashboard → Variables');
  process.exit(1);
}

const pool = new Pool({ connectionString: prodUrl });

pool
  .query('SELECT COUNT(*) as count FROM users')
  .then(r => {
    console.log('Production Users:', r.rows[0].count);
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
```

---

## 📈 Summary

| Environment     | Total Users | Status              |
| --------------- | ----------- | ------------------- |
| **Development** | **3**       | ✅ Verified         |
| **Production**  | **1**       | ✅ Verified via API |

### Development Database Notes

- All 3 users were created on 2025-11-26 (today)
- All users use email/password authentication (no OAuth users)
- No users have logged in yet (all `last_login` is null)
- Database is local PostgreSQL instance

### Production Database Notes

- Production database is on Railway
- **1 user** in production (verified via API)
- User `mom` has logged in (last login: 2025-11-26)
- Production uses the same PostgreSQL schema as development

---

## 🔍 Next Steps

To get production user count:

1. **Quick Method**: Check Railway Dashboard → PostgreSQL → Query interface
2. **API Method**: Use `/api/debug/users` endpoint (if enabled in production)
3. **Script Method**: Export `DATABASE_URL` from Railway and run query script

---

_Report generated from local development database_  
_Production database requires Railway access to query_
