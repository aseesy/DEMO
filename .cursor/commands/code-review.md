# Code Review Checklist

## Overview

Comprehensive checklist for conducting thorough code reviews to ensure quality, security, and maintainability in the LiaiZen project.

## Review Categories

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled appropriately
- [ ] Error handling is robust across frontend (React) and backend (Node.js/Express.js)
- [ ] No obvious bugs or logic errors

### Code Quality

- [ ] Code is readable, well-structured, and follows project conventions
- [ ] Functions/components are small, focused, and adhere to single responsibility principle
- [ ] Variable/function/component names are descriptive
- [ ] No code duplication
- [ ] **Frontend (React)**:
  - [ ] Proper use of React hooks and functional components
  - [ ] Adherence to component structure (`chat-client-vite/src/components/`)
  - [ ] Consistent state management
- [ ] **Backend (Node.js/Express.js)**:
  - [ ] API endpoints are well-defined and consistent
  - [ ] Middleware is used effectively for common concerns (e.g., auth, logging)
  - [ ] Database interactions (SQLite) are efficient and secure
- [ ] **UI/UX**:
  - [ ] Complies with the design system (`/prompts/design_system.md`)
  - [ ] Passes design critique heuristics (`/prompts/design_critic.md`)
  - [ ] Uses Tailwind CSS classes and design tokens correctly (e.g., `bg-teal-dark` instead of hex codes)
  - [ ] Mobile-first responsive design implemented
  - [ ] Accessibility (WCAG 2.1 AA) considerations met (labels, focus states, keyboard navigation)

### Security

- [ ] No obvious security vulnerabilities
- [ ] Input validation is present and comprehensive on both client and server
- [ ] Sensitive data is handled properly (encryption, masking)
- [ ] No hardcoded secrets
- [ ] Authentication and authorization mechanisms are robust and correctly implemented
