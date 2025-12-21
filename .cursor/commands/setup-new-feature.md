# Setup New Feature

## Overview

Systematically set up a new feature for the LiaiZen project, from initial planning through to implementation structure.

## Steps

1. **Define requirements**
   - Clarify feature scope and goals.
   - Identify user stories and acceptance criteria.
   - Plan technical approach, considering impact on React frontend and Node.js backend.

2. **Create feature branch**
   - Branch from `main` or `develop`.
   - Set up local development environment (ensure Node.js, npm/yarn, and SQLite are configured).
   - Configure any new dependencies for either `chat-client-vite` or `chat-server` (using `npm install`).

3. **Plan architecture**
   - Design data models (for SQLite) and API contracts (Node.js/Express.js routes).
   - Plan UI components and flow for React (`chat-client-vite/src/components/`), adhering to the design system.
   - Consider testing strategy: unit tests for React components/hooks, integration tests for API endpoints, end-to-end tests for critical flows.
   - Plan for Socket.io integration if real-time functionality is required.

## Feature Setup Checklist

- [ ] Requirements documented (scope, goals, user stories, acceptance criteria)
- [ ] Technical approach planned (including frontend/backend interaction, data flow)
- [ ] Feature branch created and named appropriately
- [ ] Local development environment ready (dependencies installed, services running)
- [ ] Data models and API contracts designed
- [ ] UI components and flow planned (adheres to design system and best practices)
- [ ] Initial testing strategy considered
