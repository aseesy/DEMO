# Run All Tests and Fix Failures

## Overview

Execute the full test suite for the LiaiZen project and systematically fix any failures, ensuring code quality and functionality.

## Steps

1. **Run test suite**
   - **Frontend (React/Vite)**: Navigate to `chat-client-vite` and run `npm test` (or `yarn test`).
   - **Backend (Node.js/Express.js)**: Navigate to `chat-server` and run `npm test` (or `yarn test`).
   - Capture output and identify failures for both unit and integration tests.

2. **Analyze failures**
   - Categorize failures by type: flaky, broken (existing bugs), new failures introduced by recent changes.
   - Prioritize fixes based on criticality and impact on the application.
   - Check if failures are related to recent changes in either the frontend or backend.

3. **Fix issues systematically**
   - Start with the most critical failures.
   - Fix one issue at a time, ensuring a focused approach.
   - Re-run relevant tests (or the full suite) after each fix to verify the resolution and prevent regressions.
   - For backend issues, ensure SQLite database interactions are correctly handled and tested.
   - For frontend issues, verify component rendering and user interactions.
