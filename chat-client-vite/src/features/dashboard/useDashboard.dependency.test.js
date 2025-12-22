/**
 * Dependency Direction Test for useDashboard
 *
 * Tests that function call dependencies point downward (toward lower-level modules).
 * This verifies the Dependency Rule from Clean Architecture.
 *
 * Rule: High-level modules should depend on low-level modules, not the other way around.
 * - useDashboard (high-level ViewModel) should depend on useTasks and useModalControllerDefault (low-level)
 * - useTasks and useModalControllerDefault should NOT depend on useDashboard
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.join(__dirname);
const hooksDir = path.join(__dirname, '..', '..', 'hooks');
const tasksDir = path.join(__dirname, '..', 'tasks');

describe('Dependency Direction Test - useDashboard', () => {
  it('useDashboard imports useTasks (downward dependency)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // useDashboard should import useTasks (downward - correct)
    // Note: useTasks is now in features/tasks/ following package-by-feature pattern
    expect(useDashboardContent).toContain("import { useTasks } from '../tasks/useTasks.js'");
  });

  it('useDashboard imports useModalControllerDefault (downward dependency)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // useDashboard should import useModalControllerDefault (downward - correct)
    expect(useDashboardContent).toContain(
      "import { useModalControllerDefault } from '../../hooks/useModalController.js'"
    );
  });

  it('useTasks does NOT import useDashboard (no upward dependency)', () => {
    // Note: useTasks is now in features/tasks/ following package-by-feature pattern
    const useTasksPath = path.join(tasksDir, 'useTasks.js');

    if (fs.existsSync(useTasksPath)) {
      const useTasksContent = fs.readFileSync(useTasksPath, 'utf-8');

      // useTasks should NOT import useDashboard (upward - incorrect)
      expect(useTasksContent).not.toContain('import.*useDashboard');
      expect(useTasksContent).not.toContain('from.*useDashboard');
      expect(useTasksContent).not.toContain('useDashboard');
    }
  });

  it('useModalController does NOT import useDashboard (no upward dependency)', () => {
    const useModalControllerPath = path.join(hooksDir, 'useModalController.js');

    if (fs.existsSync(useModalControllerPath)) {
      const useModalControllerContent = fs.readFileSync(useModalControllerPath, 'utf-8');

      // useModalController should NOT import useDashboard (upward - incorrect)
      expect(useModalControllerContent).not.toContain('import.*useDashboard');
      expect(useModalControllerContent).not.toContain('from.*useDashboard');
      expect(useModalControllerContent).not.toContain('useDashboard');
    }
  });

  it('useDashboard calls useTasks (downward function call)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // useDashboard should call useTasks (downward - correct)
    expect(useDashboardContent).toMatch(/useTasks\(/);
  });

  it('useDashboard calls useModalControllerDefault (downward function call)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // useDashboard should call useModalControllerDefault (downward - correct)
    expect(useDashboardContent).toMatch(/useModalControllerDefault\(/);
  });

  it('useTasks does NOT call useDashboard (no upward function call)', () => {
    // Note: useTasks is now in features/tasks/ following package-by-feature pattern
    const useTasksPath = path.join(tasksDir, 'useTasks.js');

    if (fs.existsSync(useTasksPath)) {
      const useTasksContent = fs.readFileSync(useTasksPath, 'utf-8');

      // useTasks should NOT call useDashboard (upward - incorrect)
      expect(useTasksContent).not.toMatch(/useDashboard\(/);
    }
  });

  it('useModalController does NOT call useDashboard (no upward function call)', () => {
    const useModalControllerPath = path.join(hooksDir, 'useModalController.js');

    if (fs.existsSync(useModalControllerPath)) {
      const useModalControllerContent = fs.readFileSync(useModalControllerPath, 'utf-8');

      // useModalController should NOT call useDashboard (upward - incorrect)
      expect(useModalControllerContent).not.toMatch(/useDashboard\(/);
    }
  });

  it('verifies dependency hierarchy: useDashboard (high) -> useTasks (low)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // High-level module (useDashboard) depends on low-level module (useTasks)
    const hasDownwardDependency = useDashboardContent.includes('useTasks');
    expect(hasDownwardDependency).toBe(true);
  });

  it('verifies dependency hierarchy: useDashboard (high) -> useModalControllerDefault (low)', () => {
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // High-level module (useDashboard) depends on low-level module (useModalControllerDefault)
    const hasDownwardDependency = useDashboardContent.includes('useModalControllerDefault');
    expect(hasDownwardDependency).toBe(true);
  });

  it('detects no circular dependencies', () => {
    // Read all hook files
    const useDashboardContent = fs.readFileSync(
      path.join(dashboardDir, 'useDashboard.js'),
      'utf-8'
    );

    // Note: useTasks is now in features/tasks/ following package-by-feature pattern
    const useTasksPath = path.join(tasksDir, 'useTasks.js');
    const useModalControllerPath = path.join(hooksDir, 'useModalController.js');

    // Check for circular dependencies
    let hasCircularDependency = false;

    if (fs.existsSync(useTasksPath)) {
      const useTasksContent = fs.readFileSync(useTasksPath, 'utf-8');
      if (useTasksContent.includes('useDashboard')) {
        hasCircularDependency = true;
      }
    }

    if (fs.existsSync(useModalControllerPath)) {
      const useModalControllerContent = fs.readFileSync(useModalControllerPath, 'utf-8');
      if (useModalControllerContent.includes('useDashboard')) {
        hasCircularDependency = true;
      }
    }

    expect(hasCircularDependency).toBe(false);
  });
});
