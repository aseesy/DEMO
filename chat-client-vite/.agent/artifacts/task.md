# Mediator Enhancements Task List

- [ ] Create `src/api` folder and add `userContext.js` Express router.
- [ ] Add PostgreSQL client setup (`src/db.js`).
- [ ] Write migration script `scripts/migrate_user_context.sql`.
- [ ] Extend `src/context/MediatorContext.jsx` to load/store user context.
- [ ] Create UI component `UserContextForm.jsx` for editing context.
- [ ] Create UI component `MediationBanner.jsx` for mediation prompts.
- [ ] Implement `src/utils/mediatorLogic.js` decision function.
- [ ] Update `ChatRoom.jsx` to invoke mediation logic and set flag.
- [ ] Add tests for mediation logic, API endpoints, and UI components.
- [ ] Refactor/remove any obsolete code (e.g., unused imports, old relationship handling).
- [ ] Update documentation and walkthrough.
