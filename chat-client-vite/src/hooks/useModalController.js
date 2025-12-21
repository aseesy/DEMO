import { getRegisteredModals } from './modalRegistry.js';
import { useSimpleModals } from './useSimpleModals.js';

/**
 * Composes all modal state and handlers.
 * 
 * Returns simple modals (welcomeModal, profileTaskModal, inviteModal) and
 * complex modals registered via the modal registry. All modals are returned
 * as objects with consistent structure.
 * 
 * Modal registration happens at the Composition Root (main.jsx).
 * 
 * @param {Object} options
 * @param {Array} [options.messages=[]] - Messages array passed to modal factories
 * @param {Function} options.setCurrentView - View navigation handler passed to modal factories
 * @param {...Object} options.additionalDeps - Additional dependencies passed to modal factories
 * @returns {Object} Modal state and handlers keyed by modal name
 */
export function useModalController({ messages = [], setCurrentView, ...additionalDeps }) {
  const simpleModals = useSimpleModals();

  const dependencyContainer = {
    messages,
    setCurrentView,
    ...additionalDeps,
  };

  const registeredModals = getRegisteredModals();
  const complexModals = {};
  const simpleModalNames = Object.keys(simpleModals);
  
  for (const { name, factory, dependencies = [] } of registeredModals) {
    if (simpleModalNames.includes(name)) {
      throw new Error(
        `Modal name collision detected: "${name}" is already used by a simple modal. ` +
        `Simple modals are: ${simpleModalNames.join(', ')}. ` +
        `Please choose a different name for your complex modal.`
      );
    }
    
    complexModals[name] = factory(dependencyContainer);
  }

  return {
    ...simpleModals,
    ...complexModals,
  };
}
