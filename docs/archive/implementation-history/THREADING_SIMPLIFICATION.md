# Threading Simplification Plan

## Current State
The threading system has multiple layers:
- Use Cases (AutoAssignMessageUseCase, ReplyInThreadUseCase, etc.)
- Repositories (PostgresThreadRepository)
- Analyzers (AIThreadAnalyzer with keyword fallback)
- Redis locking and rate limiting
- Complex message filtering

## Core Functionality That Should Just Work
1. **Create threads** - Users can manually create threads
2. **Auto-assign messages** - Messages automatically get assigned to threads
3. **View threads** - Threads show up in the sidebar
4. **Reply in threads** - Users can reply within a thread
5. **Move messages** - Users can move messages to/from threads

## What to Keep (Essential)
- Basic thread CRUD operations
- Auto-assignment logic (simplified)
- Thread repository for database operations

## What to Simplify
- Remove excessive safeguards if they're preventing basic functionality
- Simplify the analyzer - just make it work, don't optimize prematurely
- Focus on making threads appear and work, not on perfect architecture

## Next Steps
1. Verify threads are being created ✅ (already working)
2. Verify messages are being assigned ✅ (already working)
3. Verify threads show in UI ✅ (already working)
4. Fix any bugs that prevent basic functionality
5. Don't add new features until basic ones work perfectly


