/**
 * Data Abstraction Violation Detection Tests
 *
 * Detects if modules know about the innards of objects they manipulate.
 *
 * Principle: A module should not know about the internal structure of objects.
 * It should only interact through the object's public interface.
 *
 * Violations:
 * - Accessing nested properties (obj.prop.subprop)
 * - Reaching inside objects to extract values
 * - Knowing about internal data structures
 * - Direct property access instead of methods
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.join(__dirname);
const hooksDir = path.join(__dirname, '..', '..', 'hooks');
const srcDir = path.join(__dirname, '..', '..');

describe('Data Abstraction Violation Detection', () => {
  describe('useDashboard - Object Internals Access', () => {
    it('useDashboard does NOT reach inside taskFormModal (uses flat interface from useModalController)', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // Should NOT reach inside taskFormModal - useModalController returns these flattened
      const reachesInsideTaskFormModal =
        /taskFormModal\.(setTaskFormMode|setAiTaskDetails|setIsGeneratingTask|taskFormMode|aiTaskDetails|isGeneratingTask)/.test(
          useDashboardContent
        );

      expect(reachesInsideTaskFormModal).toBe(false);
    });

    it('detects if useDashboard reaches inside modal objects', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      const reachesInsideModals =
        /(welcomeModal|profileTaskModal|inviteModal)\.(setShow|show)/.test(useDashboardContent);

      if (reachesInsideModals) {
        console.warn('useDashboard reaches inside modal objects - consider abstraction');
      }
    });

    it('detects if useDashboard knows about task object structure', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      const knowsTaskStructure =
        /(task|editingTask)\.(id|title|status|description|priority|due_date|assigned_to|related_people)/.test(
          useDashboardContent
        );

      expect(knowsTaskStructure).toBe(false);
    });

    it('detects if useDashboard exposes raw data structures', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      const exposesRawData =
        /return\s*\{[^}]*\btasks\s*[,:]/m.test(useDashboardContent) &&
        /return\s*\{[^}]*\btaskState\s*[,:]/m.test(useDashboardContent);

      if (exposesRawData) {
        console.warn('useDashboard exposes both raw data and abstracted interface - violation');
      }
    });
  });

  describe('DashboardView - Object Internals Access', () => {
    it('detects if DashboardView knows about taskState internal structure', () => {
      const dashboardViewPath = path.join(dashboardDir, 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        const knowsTaskStateStructure =
          /const\s*\{\s*(tasks|isLoadingTasks|taskSearch|taskFilter)\s*[,}]/m.test(
            dashboardViewContent
          );

        if (knowsTaskStateStructure) {
          console.warn('DashboardView knows about taskState structure - verify abstraction');
        }
      }
    });

    it('detects if DashboardView uses array methods directly on tasks', () => {
      const dashboardViewPath = path.join(dashboardDir, 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        const usesArrayMethods =
          /tasks\.(map|filter|find|reduce|forEach|length|push|pop|slice|splice)/.test(
            dashboardViewContent
          );

        if (usesArrayMethods) {
          console.warn('DashboardView uses array methods directly - knows tasks is an array');
        }
      }
    });

    it('detects if DashboardView knows about task object structure', () => {
      const dashboardViewPath = path.join(dashboardDir, 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        const knowsTaskStructure =
          /task\.(id|title|status|description|priority|due_date|assigned_to|related_people|type|created_at|updated_at)/.test(
            dashboardViewContent
          );

        if (knowsTaskStructure) {
          console.warn('DashboardView knows about task object structure - violation');
        }
      }
    });
  });

  describe('ChatRoom - Object Internals Access', () => {
    it('detects if ChatRoom reaches inside dashboardProps', () => {
      const chatRoomPath = path.join(srcDir, 'ChatRoom.jsx');

      if (fs.existsSync(chatRoomPath)) {
        const chatRoomContent = fs.readFileSync(chatRoomPath, 'utf-8');

        const reachesInsideDashboardProps =
          /dashboardProps\.(tasks|isLoadingTasks|showTaskForm|editingTask|taskFormData|welcomeModal|profileTaskModal|inviteModal|taskFormModal)/.test(
            chatRoomContent
          );

        if (reachesInsideDashboardProps) {
          console.warn('ChatRoom reaches inside dashboardProps - violation');
        }
      }
    });

    it('detects if ChatRoom reaches inside modal objects', () => {
      const chatRoomPath = path.join(srcDir, 'ChatRoom.jsx');

      if (fs.existsSync(chatRoomPath)) {
        const chatRoomContent = fs.readFileSync(chatRoomPath, 'utf-8');

        const reachesInsideModals =
          /(taskFormModal|welcomeModal|profileTaskModal|inviteModal)\.(taskFormMode|setTaskFormMode|aiTaskDetails|setAiTaskDetails|isGeneratingTask|setIsGeneratingTask|show|setShow)/.test(
            chatRoomContent
          );

        if (reachesInsideModals) {
          console.warn('ChatRoom reaches inside modal objects - violation');
        }
      }
    });
  });

  describe('General Violation Patterns', () => {
    it('detects nested property access patterns', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      const deepNesting = /\.\w+\.\w+\.\w+/.test(useDashboardContent);

      if (deepNesting) {
        console.warn('Deep nested property access detected - may indicate internals knowledge');
      }
    });

    it('detects direct state manipulation', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      const directStateManipulation = /\.\w+\s*=\s*[^=]/.test(useDashboardContent);

      if (directStateManipulation) {
        console.warn('Direct state manipulation detected - should use methods');
      }
    });
  });
});
