/**
 * Modal Registry - Enables Open-Closed Principle for modal hooks
 * 
 * New modal hooks can register themselves without modifying useModalController.
 * This makes useModalController truly "closed for modification" while being
 * "open for extension" through registration.
 * 
 * Uses Dependency Injection to avoid rigid dependency contracts:
 * - Plugins declare what dependencies they need
 * - Controller provides a dependency container
 * - No rigid contract between controller and plugins
 */

/**
 * Registry of modal hook factories
 * Each entry is: { 
 *   name: string, 
 *   factory: (deps) => hookResult,
 *   dependencies: string[] // Optional: list of dependency names this plugin needs
 * }
 */
const modalRegistry = [];

/**
 * Register a modal hook factory
 * 
 * @param {string} name - Name of the modal (e.g., 'taskForm', 'contactSuggestion')
 * @param {Function} factory - Function that receives dependency container and returns hook result
 * @param {string[]} dependencies - Optional: Array of dependency names this plugin needs
 * @throws {Error} If modal with the same name is already registered
 */
export function registerModalHook(name, factory, dependencies = []) {
  // Check if modal with this name is already registered
  const existing = modalRegistry.find(m => m.name === name);
  if (existing) {
    throw new Error(
      `Modal "${name}" is already registered. ` +
      `Each modal must have a unique name. ` +
      `To re-register, clear the registry first.`
    );
  }
  
  modalRegistry.push({ name, factory, dependencies });
}

/**
 * Get all registered modal hooks
 * 
 * @returns {Array} Array of { name, factory, dependencies } objects
 */
export function getRegisteredModals() {
  return [...modalRegistry]; // Return copy to prevent external mutation
}

/**
 * Clear the registry (useful for testing)
 */
export function clearRegistry() {
  modalRegistry.length = 0;
}

