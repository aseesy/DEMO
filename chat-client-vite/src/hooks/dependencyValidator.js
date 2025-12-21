/**
 * Validates that all required dependencies are present in the container
 * before factory instantiation.
 * 
 * @param {Array<string>} requiredDependencies - List of required dependency names
 * @param {Object} dependencyContainer - Container with available dependencies
 * @param {string} modalName - Name of the modal (for error messages)
 * @throws {Error} If required dependencies are missing
 */
export function validateDependencies(requiredDependencies, dependencyContainer, modalName) {
  const missing = [];

  for (const depName of requiredDependencies) {
    if (!(depName in dependencyContainer)) {
      missing.push(depName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required dependencies for modal "${modalName}": ${missing.join(', ')}. ` +
      `Available dependencies: ${Object.keys(dependencyContainer).join(', ')}. ` +
      `Please provide all required dependencies before instantiating the modal.`
    );
  }
}

