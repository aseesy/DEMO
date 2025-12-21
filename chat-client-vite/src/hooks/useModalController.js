import { getRegisteredModals } from './modalRegistry.js';
import { useSimpleModals } from './useSimpleModals.js';
import { registerAllModalHooks } from './modalHooks.registration.js';

// Explicit registration to avoid temporal coupling
// This ensures plugins are registered before controller uses them
// No reliance on import order or side-effects
registerAllModalHooks();

/**
 * useModalController - Composition hook for all modals
 * 
 * This hook is truly closed for modification and open for extension.
 * 
 * To add a new modal type:
 * 1. Create your hook (e.g., useNewModal.js)
 * 2. Register it in modalHooks.registration.js
 * 3. That's it! No need to modify this file.
 * 
 * The registry pattern enables the Open-Closed Principle:
 * - Closed for modification: This file doesn't change when adding modals
 * - Open for extension: New modals register themselves via the registry
 * 
 * Dependency Injection avoids rigid contracts:
 * - Controller provides a dependency container
 * - Plugins declare what they need (via dependencies array)
 * - No rigid contract - plugins can request any dependency
 * - Controller doesn't need to know what each plugin needs
 * 
 * All modals are treated consistently:
 * - Simple modals: Objects with { show, setShow } (wiring hidden)
 * - Complex modals: Objects with their specific state/handlers (wiring hidden)
 * 
 * This follows the Principle of Least Astonishment - all modals have the same structure.
 * 
 * @param {Object} options
 * @param {Array} options.messages - Messages array (available in dependency container)
 * @param {Function} options.setCurrentView - View navigation handler (available in dependency container)
 * @param {Object} options.dependencies - Additional dependencies (available in dependency container)
 * @returns {Object} All modal state and handlers, grouped by logical concept
 */
export function useModalController({ messages = [], setCurrentView, ...additionalDeps }) {
  // Simple modals - wiring hidden, returned as objects
  const simpleModals = useSimpleModals();

  // Create dependency container - all available dependencies
  // Plugins can request any of these, controller doesn't need to know which ones
  const dependencyContainer = {
    messages,
    setCurrentView,
    ...additionalDeps, // Allow additional dependencies without modifying controller
  };

  // Complex modals - dynamically discovered via registry, wiring hidden
  const registeredModals = getRegisteredModals();
  const complexModals = {};
  
  // Detect name collisions between simple and complex modals
  // Simple modal names: welcomeModal, profileTaskModal, inviteModal
  const simpleModalNames = Object.keys(simpleModals);
  
  for (const { name, factory, dependencies = [] } of registeredModals) {
    // Check for collision with simple modals
    if (simpleModalNames.includes(name)) {
      throw new Error(
        `Modal name collision detected: "${name}" is already used by a simple modal. ` +
        `Simple modals are: ${simpleModalNames.join(', ')}. ` +
        `Please choose a different name for your complex modal.`
      );
    }
    
    // Note: Duplicate complex modals are prevented at registration time
    // (in registerModalHook), so we don't need to check here
    
    // Factory receives dependency container - it extracts what it needs
    // Controller doesn't need to know what each plugin needs
    complexModals[name] = factory(dependencyContainer);
  }

  // Return all modals as objects - consistent structure for all
  // No mixing of details (booleans) with concepts (objects)
  return {
    ...simpleModals,
    ...complexModals,
  };
}
