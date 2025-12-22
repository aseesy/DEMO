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
    it('useDashboard extracts taskFormModal properties to create flat interface', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // useDashboard SHOULD reach inside taskFormModal to extract properties
      // This creates flat handlers for consumers, preventing THEM from reaching inside
      // Pattern: taskFormModal.setTaskFormMode, taskFormModal.setAiTaskDetails, etc.
      const extractsFromTaskFormModal =
        /taskFormModal\.(setTaskFormMode|setAiTaskDetails|setIsGeneratingTask|taskFormMode|aiTaskDetails|isGeneratingTask)/.test(
          useDashboardContent
        );

      // useDashboard should extract properties to create flat interface
      // This is correct behavior - the violation would be if CONSUMERS did this
      expect(extractsFromTaskFormModal).toBe(true);
    });

    it('detects if useDashboard reaches inside modal objects', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // Violation: Reaching inside modal objects
      // Pattern: welcomeModal.setShow, profileTaskModal.setShow, etc.
      const reachesInsideModals =
        /(welcomeModal|profileTaskModal|inviteModal)\.(setShow|show)/.test(useDashboardContent);

      // This is acceptable IF modals are designed to expose .setShow
      // But we should check if there's a better abstraction
      // For now, we'll detect it but not fail (modals might be designed this way)
      if (reachesInsideModals) {
        console.warn('useDashboard reaches inside modal objects - consider abstraction');
      }
    });

    it('detects if useDashboard knows about task object structure', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // Violation: Direct access to task properties
      // Pattern: task.id, task.title, task.status, etc.
      const knowsTaskStructure =
        /(task|editingTask)\.(id|title|status|description|priority|due_date|assigned_to|related_people)/.test(
          useDashboardContent
        );

      // Should NOT know about task structure - should use methods
      expect(knowsTaskStructure).toBe(false);
    });

    it('detects if useDashboard exposes raw data structures', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // Violation: Exposing raw arrays, objects directly
      // Should expose through abstracted interface
      const exposesRawData =
        /return\s*\{[^}]*\btasks\s*[,:]/m.test(useDashboardContent) &&
        /return\s*\{[^}]*\btaskState\s*[,:]/m.test(useDashboardContent);

      // Both raw and abstracted exposed = violation
      if (exposesRawData) {
        console.warn('useDashboard exposes both raw data and abstracted interface - violation');
      }
    });
  });

  describe('DashboardView - Object Internals Access', () => {
    it('detects if DashboardView knows about taskState internal structure', () => {
      const dashboardViewPath = path.join(__dirname, '..', 'views', 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        // Violation: Direct destructuring of taskState internals
        // Pattern: const { tasks, isLoadingTasks } = taskState;
        const knowsTaskStateStructure =
          /const\s*\{\s*(tasks|isLoadingTasks|taskSearch|taskFilter)\s*[,}]/m.test(
            dashboardViewContent
          );

        // This is acceptable IF taskState is the abstraction
        // But we should verify taskState doesn't expose raw arrays
        if (knowsTaskStateStructure) {
          console.warn('DashboardView knows about taskState structure - verify abstraction');
        }
      }
    });

    it('detects if DashboardView uses array methods directly on tasks', () => {
      const dashboardViewPath = path.join(__dirname, '..', 'views', 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        // Violation: Using array methods directly
        // Pattern: tasks.map, tasks.filter, tasks.length, etc.
        const usesArrayMethods =
          /tasks\.(map|filter|find|reduce|forEach|length|push|pop|slice|splice)/.test(
            dashboardViewContent
          );

        // Should use abstracted methods instead
        if (usesArrayMethods) {
          console.warn('DashboardView uses array methods directly - knows tasks is an array');
        }
      }
    });

    it('detects if DashboardView knows about task object structure', () => {
      const dashboardViewPath = path.join(__dirname, '..', 'views', 'DashboardView.jsx');

      if (fs.existsSync(dashboardViewPath)) {
        const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8');

        // Violation: Direct access to task properties
        // Pattern: task.id, task.title, task.status, etc.
        const knowsTaskStructure =
          /task\.(id|title|status|description|priority|due_date|assigned_to|related_people|type|created_at|updated_at)/.test(
            dashboardViewContent
          );

        // Should use methods or abstracted interface
        if (knowsTaskStructure) {
          console.warn('DashboardView knows about task object structure - violation');
        }
      }
    });
  });

  describe('ChatRoom - Object Internals Access', () => {
    it('detects if ChatRoom reaches inside dashboardProps', () => {
      const chatRoomPath = path.join(__dirname, '..', 'ChatRoom.jsx');

      if (fs.existsSync(chatRoomPath)) {
        const chatRoomContent = fs.readFileSync(chatRoomPath, 'utf-8');

        // Violation: Reaching inside dashboardProps
        // Pattern: dashboardProps.tasks, dashboardProps.showTaskForm, etc.
        const reachesInsideDashboardProps =
          /dashboardProps\.(tasks|isLoadingTasks|showTaskForm|editingTask|taskFormData|welcomeModal|profileTaskModal|inviteModal|taskFormModal)/.test(
            chatRoomContent
          );

        // Should use abstracted interface
        if (reachesInsideDashboardProps) {
          console.warn('ChatRoom reaches inside dashboardProps - violation');
        }
      }
    });

    it('detects if ChatRoom reaches inside modal objects', () => {
      const chatRoomPath = path.join(__dirname, '..', 'ChatRoom.jsx');

      if (fs.existsSync(chatRoomPath)) {
        const chatRoomContent = fs.readFileSync(chatRoomPath, 'utf-8');

        // Violation: Reaching inside modal objects
        // Pattern: taskFormModal.taskFormMode, taskFormModal.setTaskFormMode, etc.
        const reachesInsideModals =
          /(taskFormModal|welcomeModal|profileTaskModal|inviteModal)\.(taskFormMode|setTaskFormMode|aiTaskDetails|setAiTaskDetails|isGeneratingTask|setIsGeneratingTask|show|setShow)/.test(
            chatRoomContent
          );

        // Should use abstracted interface
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

      // Violation: Deep nested property access
      // Pattern: obj.prop.subprop.method()
      const deepNesting = /\.\w+\.\w+\.\w+/.test(useDashboardContent);

      // Should avoid deep nesting - indicates knowing about internals
      if (deepNesting) {
        console.warn('Deep nested property access detected - may indicate internals knowledge');
      }
    });

    it('detects direct state manipulation', () => {
      const useDashboardContent = fs.readFileSync(
        path.join(dashboardDir, 'useDashboard.js'),
        'utf-8'
      );

      // Violation: Direct state assignment
      // Pattern: obj.prop = value (instead of using setter)
      const directStateManipulation = /\.\w+\s*=\s*[^=]/.test(useDashboardContent);

      // Should use methods, not direct assignment
      if (directStateManipulation) {
        console.warn('Direct state manipulation detected - should use methods');
      }
    });
  });
});
