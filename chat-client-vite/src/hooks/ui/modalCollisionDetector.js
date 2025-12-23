/**
 * Pure function for detecting modal name collisions.
 * 
 * @param {Array<string>} simpleModalNames - Names of simple modals
 * @param {Array<Object>} registeredModals - Array of { name, factory, dependencies }
 * @throws {Error} If a registered modal name collides with a simple modal name
 */
export function detectModalCollisions(simpleModalNames, registeredModals) {
  for (const { name } of registeredModals) {
    if (simpleModalNames.includes(name)) {
      throw new Error(
        `Modal name collision detected: "${name}" is already used by a simple modal. ` +
        `Simple modals are: ${simpleModalNames.join(', ')}. ` +
        `Please choose a different name for your complex modal.`
      );
    }
  }
}

