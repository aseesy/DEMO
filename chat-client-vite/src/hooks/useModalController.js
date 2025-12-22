import { useSimpleModals } from './useSimpleModals.js';
import { detectModalCollisions } from './modalCollisionDetector.js';
import { validateDependencies } from './dependencyValidator.js';
import { getRegisteredModals } from './modalRegistry.js';

/**
 * Composes all modal state and handlers.
 * 
 * Returns simple modals (welcomeModal, profileTaskModal, inviteModal) and
 * complex modals from the provided registry strategy. All modals are returned
 * as objects with consistent structure.
 * 
 * Modal registration happens at the Composition Root (main.jsx).
 * 
 * IMPORTANT: This function requires getRegistry to be passed explicitly.
 * For default behavior, use useModalControllerDefault or createModalController.
 * 
 * @param {Object} options
 * @param {Array} [options.messages=[]] - Messages array passed to modal factories
 * @param {Function} options.setCurrentView - View navigation handler passed to modal factories
 * @param {Function} options.getRegistry - Registry strategy function that returns array of { name, factory, dependencies }
 * @param {Object} [options.dependencies={}] - Explicit dependency object passed to modal factories (no blind spread)
 * @returns {Object} Modal state and handlers keyed by modal name
 */
export function useModalController({ 
  messages = [], 
  setCurrentView,
  getRegistry,
  dependencies = {},
}) {
  if (!getRegistry || typeof getRegistry !== 'function') {
    throw new Error(
      'useModalController requires getRegistry function to be passed explicitly. ' +
      'This ensures the controller is decoupled from the global registry. ' +
      'Use useModalControllerDefault or createModalController() to get a pre-configured instance.'
    );
  }

  const simpleModals = useSimpleModals();

  // Explicit dependency contract - no blind spread
  const dependencyContainer = {
    messages,
    setCurrentView,
    ...dependencies, // Explicit object, not rest parameter
  };
  const registeredModals = getRegistry();
  const complexModals = {};
  const simpleModalNames = Object.keys(simpleModals);
  
  // Detect collisions using pure function
  detectModalCollisions(simpleModalNames, registeredModals);
  
  for (const { name, factory, dependencies: requiredDeps = [] } of registeredModals) {
    // Validate dependencies before instantiation
    // This fails fast at the interface, not deep inside the factory
    validateDependencies(requiredDeps, dependencyContainer, name);
    
    complexModals[name] = factory(dependencyContainer);
  }

  // Extract handlers to flat structure to prevent reaching inside objects
  // This maintains data abstraction - consumers don't know about internal structure
  
  // Extract task form handlers (prevents reaching inside taskFormModal)
  const taskFormHandlers = complexModals.taskFormModal ? {
    taskFormMode: complexModals.taskFormModal.taskFormMode,
    setTaskFormMode: complexModals.taskFormModal.setTaskFormMode,
    aiTaskDetails: complexModals.taskFormModal.aiTaskDetails,
    setAiTaskDetails: complexModals.taskFormModal.setAiTaskDetails,
    isGeneratingTask: complexModals.taskFormModal.isGeneratingTask,
    setIsGeneratingTask: complexModals.taskFormModal.setIsGeneratingTask,
  } : {};

  // Extract modal control handlers (prevents reaching inside modal objects)
  // Simple modals expose .setShow, but we abstract this to flat handlers
  const modalControlHandlers = {
    setShowWelcomeModal: simpleModals.welcomeModal?.setShow || (() => {}),
    setShowProfileTaskModal: simpleModals.profileTaskModal?.setShow || (() => {}),
    setShowInviteModal: simpleModals.inviteModal?.setShow || (() => {}),
  };

  return {
    ...simpleModals,
    ...complexModals,
    // Flat handlers for task operations (prevents reaching inside taskFormModal)
    ...taskFormHandlers,
    // Flat handlers for modal control (prevents reaching inside modal objects)
    ...modalControlHandlers,
  };
}

/**
 * Factory function that creates useModalController with default registry
 * This is the recommended way to use useModalController in production code.
 * 
 * @param {Function} [getRegistry=getRegisteredModals] - Optional registry function
 * @returns {Function} useModalController function with registry injected
 */
export function createModalController(getRegistry = getRegisteredModals) {
  return function useModalControllerWithRegistry(options) {
    return useModalController({
      ...options,
      getRegistry,
    });
  };
}

/**
 * Default useModalController with global registry injected
 * This is exported for convenience in production code.
 * For testing, use createModalController() with a test registry.
 */
export const useModalControllerDefault = createModalController();
