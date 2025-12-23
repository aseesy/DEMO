/**
 * UI Hooks - Modal system and UI infrastructure
 * @module hooks/ui
 */

export { useModalController } from './useModalController.js';
export { useSimpleModals, useSimpleModal } from './useSimpleModals.js';
export { registerModalHook, getRegisteredModals, clearRegistry } from './modalRegistry.js';
export { detectModalCollisions } from './modalCollisionDetector.js';
export { registerAllModalHooks } from './modalHooks.registration.js';
export { validateDependencies } from './dependencyValidator.js';
export { useToast } from './useToast.js';
