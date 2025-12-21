import { getRegisteredModals } from './modalRegistry.js';
import { useSimpleModals } from './useSimpleModals.js';
import { detectModalCollisions } from './modalCollisionDetector.js';
import { validateDependencies } from './dependencyValidator.js';

/**
 * Composes all modal state and handlers.
 * 
 * Returns simple modals (welcomeModal, profileTaskModal, inviteModal) and
 * complex modals from the provided registry strategy. All modals are returned
 * as objects with consistent structure.
 * 
 * Modal registration happens at the Composition Root (main.jsx).
 * 
 * @param {Object} options
 * @param {Array} [options.messages=[]] - Messages array passed to modal factories
 * @param {Function} options.setCurrentView - View navigation handler passed to modal factories
 * @param {Function} [options.getRegistry=getRegisteredModals] - Registry strategy function that returns array of { name, factory, dependencies }
 * @param {...Object} options.additionalDeps - Additional dependencies passed to modal factories
 * @returns {Object} Modal state and handlers keyed by modal name
 */
export function useModalController({ 
  messages = [], 
  setCurrentView,
  getRegistry = getRegisteredModals,
  ...additionalDeps
}) {
  const simpleModals = useSimpleModals();

  const dependencyContainer = {
    messages,
    setCurrentView,
    ...additionalDeps,
  };
  const registeredModals = getRegistry();
  const complexModals = {};
  const simpleModalNames = Object.keys(simpleModals);
  
  // Detect collisions using pure function
  detectModalCollisions(simpleModalNames, registeredModals);
  
  for (const { name, factory, dependencies = [] } of registeredModals) {
    // Validate dependencies before instantiation
    // This fails fast at the interface, not deep inside the factory
    validateDependencies(dependencies, dependencyContainer, name);
    
    complexModals[name] = factory(dependencyContainer);
  }

  return {
    ...simpleModals,
    ...complexModals,
  };
}
