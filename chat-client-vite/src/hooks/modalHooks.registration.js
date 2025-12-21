/**
 * Modal Hooks Registration
 * 
 * This file registers all modal hooks with the registry.
 * To add a new modal type, simply:
 * 1. Create your hook
 * 2. Import it here
 * 3. Register it with registerModalHook() inside registerAllModalHooks()
 * 
 * No need to modify useModalController!
 * 
 * Dependency Injection:
 * - Each factory receives the full dependency container
 * - Factory extracts only what it needs
 * - No rigid contract - can request any dependency
 * 
 * IMPORTANT: Explicit registration eliminates temporal coupling.
 * The function registerAllModalHooks() is called explicitly in useModalController,
 * avoiding the temporal coupling that would exist with side-effect imports.
 */

import { registerModalHook, getRegisteredModals } from './modalRegistry.js';
import { useTaskFormModal } from './useTaskFormModal.js';
import { useContactSuggestionModal } from './useContactSuggestionModal.js';
import { useMessageFlaggingModal } from './useMessageFlaggingModal.js';

/**
 * Register all modal hooks explicitly
 * 
 * This function registers all modal hooks. It should be called explicitly
 * to avoid temporal coupling from side-effect imports.
 * 
 * Explicit registration makes timing predictable:
 * - Registration happens when function is called
 * - No hidden dependency on import order
 * - No temporal coupling
 * 
 * This function is idempotent - safe to call multiple times.
 * If a modal is already registered, it will be skipped.
 * 
 * @returns {void}
 */
export function registerAllModalHooks() {
  // Register all modal hooks
  // Each factory receives the dependency container and extracts what it needs
  // This avoids rigid dependency contracts
  
  // Idempotent: Check if already registered before registering
  const existing = getRegisteredModals().map(m => m.name);
  
  if (!existing.includes('taskFormModal')) {
    registerModalHook('taskFormModal', (deps) => {
      return useTaskFormModal();
    }, []); // No dependencies required
  }

  if (!existing.includes('contactSuggestionModal')) {
    registerModalHook('contactSuggestionModal', (deps) => {
      return useContactSuggestionModal({ 
        messages: deps.messages, 
        setCurrentView: deps.setCurrentView 
      });
    }, ['messages', 'setCurrentView']); // Declares required dependencies
  }

  if (!existing.includes('messageFlaggingModal')) {
    registerModalHook('messageFlaggingModal', (deps) => {
      return useMessageFlaggingModal();
    }, []); // No dependencies required
  }
}

