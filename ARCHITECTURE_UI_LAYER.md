# UI Layer Architecture Principle

## Principle

**React components/hooks (`ui/` or `features/`) can:**

- ✅ Import from **Application layer** (services, business logic)
- ✅ Import from **Adapters** (via composition root)

**React components/hooks should NOT:**

- ❌ Contain **business rules**
- ❌ Contain **business logic**
- ❌ Perform **data validation** (beyond UI validation)
- ❌ Perform **business calculations**
- ❌ Make **business decisions**

## Architecture Layers

```
┌─────────────────────────────────────┐
│   UI Layer (React Components/Hooks) │
│   - Can import Application + Adapters│
│   - NO business rules                │
└──────────────┬──────────────────────┘
               │ imports
               ▼
┌─────────────────────────────────────┐
│   Application Layer (Services)      │
│   - Business logic                   │
│   - Business rules                   │
│   - Validation                      │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│   Adapters (Composition Root)        │
│   - API clients                     │
│   - Storage adapters                │
│   - Socket adapters                 │
└─────────────────────────────────────┘
```

## Current Violations

### 🟡 Violation #1: `useContactsApi.js`

**Location**: `chat-client-vite/src/features/contacts/model/useContactsApi.js`

**Issue**: Contains data transformation logic (business rule) directly in the hook.

**Lines 38-54**:

```javascript
// Transform relationship fields from backend format to display format
const transformedContacts = (data.contacts || []).map(contact => {
  const transformed = {
    ...contact,
    relationship: contact.relationship
      ? toDisplayRelationship(contact.relationship) // ❌ Business rule in hook
      : contact.relationship,
  };
  // ...
  return transformed;
});
```

**Problem**: The transformation rule "how to convert backend relationship format to display format" is a business rule that should be in the Application layer.

**Recommendation**:

- Extract to `services/contacts/ContactTransformService.js`
- Hook should call: `ContactTransformService.transformForDisplay(contacts)`

---

### 🟡 Violation #2: `useProfile.js`

**Location**: `chat-client-vite/src/features/profile/model/useProfile.js`

**Issue**: Contains extensive data mapping/transformation logic (business rules) directly in the hook.

**Lines 119-194**:

```javascript
const profileData = {
  // Core fields
  username: data.username || username,
  email: data.email || '',

  // Personal Information
  first_name: data.first_name || '',
  // ... 70+ lines of field mapping
};
```

**Problem**: The mapping rules "which fields map to which, default values, transformations" are business rules that should be in the Application layer.

**Recommendation**:

- Extract to `services/profile/ProfileTransformService.js`
- Hook should call: `ProfileTransformService.transformFromApi(data)`

---

## ✅ Good Examples (Following Principle)

### Example 1: `useMessageMediation.js`

**Location**: `chat-client-vite/src/features/chat/hooks/useMessageMediation.js`

**Why it's good**:

- Delegates all business logic to `MediationService` (Application layer)
- Hook only orchestrates React state and service calls
- No business rules in the hook

```javascript
// ✅ Good: Delegates to Application layer
const analysis = await MediationService.analyze(clean, senderProfile, receiverProfile);
```

---

### Example 2: `useMessageUI.js`

**Location**: `chat-client-vite/src/features/chat/hooks/useMessageUI.js`

**Why it's good**:

- Explicitly states: "❌ Business logic/validation (delegated to useMessageMediation)"
- Only handles UI state management
- No business rules

---

### Example 3: `ProfileSections.jsx`

**Location**: `chat-client-vite/src/features/profile/components/ProfileSections.jsx`

**Why it's good**:

- Comment states: "All business logic is handled by parent via props"
- Pure presentational component
- No business rules

---

## Refactoring Recommendations

### Priority 1: Extract Data Transformations

1. **Create `services/contacts/ContactTransformService.js`**:

   ```javascript
   import { toDisplayRelationship } from '../../utils/relationshipMapping.js';

   /**
    * ContactTransformService - Application Layer
    *
    * Responsibility: Transform contact data between API format and display format
    * This is a business rule - how we present data to users
    */
   export class ContactTransformService {
     /**
      * Transform contacts from API format to display format
      * @param {Array} contacts - Raw contacts from API
      * @returns {Array} Transformed contacts for display
      */
     static transformForDisplay(contacts) {
       return (contacts || []).map(contact => ({
         ...contact,
         relationship: contact.relationship
           ? toDisplayRelationship(contact.relationship)
           : contact.relationship,
       }));
     }
   }
   ```

2. **Create `services/profile/ProfileTransformService.js`**:

   ```javascript
   /**
    * ProfileTransformService - Application Layer
    *
    * Responsibility: Transform profile data between API format and display format
    * This is a business rule - how we map API fields to UI fields
    */
   export class ProfileTransformService {
     /**
      * Transform profile from API format to display format
      * @param {Object} data - Raw profile data from API
      * @param {string} username - Fallback username
      * @returns {Object} Transformed profile for display
      */
     static transformFromApi(data, username) {
       return {
         // Core fields
         username: data.username || username,
         email: data.email || '',

         // Personal Information
         first_name: data.first_name || '',
         last_name: data.last_name || '',
         // ... all mapping logic here (70+ fields)
       };
     }
   }
   ```

3. **Update hooks to use services**:

   ```javascript
   // useContactsApi.js
   import { ContactTransformService } from '../../../services/contacts/ContactTransformService.js';

   // ✅ Hook delegates to Application layer
   const transformedContacts = ContactTransformService.transformForDisplay(data.contacts || []);
   ```

**Note**: `toDisplayRelationship` in `utils/relationshipMapping.js` is fine as a utility function. The issue is that the hook is orchestrating the transformation. The service should own the transformation logic.

---

## Testing Strategy

After refactoring:

- ✅ Business rules can be tested independently (services)
- ✅ Hooks can be tested with mocked services
- ✅ Business rules are reusable across hooks/components
- ✅ Changes to business rules don't require hook changes

---

## Summary

**Current Status**:

- ✅ **All violations fixed!** (100% compliance)
- ✅ Business rules extracted to Application layer services
- ✅ Hooks now delegate to services

**Completed Actions**:

1. ✅ Created `ContactTransformService` in Application layer
2. ✅ Created `ProfileTransformService` in Application layer
3. ✅ Updated `useContactsApi.js` to use service
4. ✅ Updated `useProfile.js` to use service
5. ✅ All tests passing

**Architecture Compliance**: **100%** ✅

All React components/hooks now follow the principle:

- ✅ Can import from Application layer (services)
- ✅ Can import from Adapters
- ❌ No business rules in UI layer

---

## Files Created

### Application Layer Services

1. **`src/services/contacts/ContactTransformService.js`**
   - `transformContactsForDisplay()` - Transforms contacts from API to display format
   - `transformContactForApi()` - Transforms contacts from display to API format

2. **`src/services/profile/ProfileTransformService.js`**
   - `transformProfileFromApi()` - Transforms profile from API to display format (70+ fields)
   - `transformProfileForApi()` - Transforms profile from display to API format

### Updated Hooks

1. **`src/features/contacts/model/useContactsApi.js`**
   - Now delegates to `ContactTransformService.transformContactsForDisplay()`
   - Removed inline transformation logic

2. **`src/features/profile/model/useProfile.js`**
   - Now delegates to `ProfileTransformService.transformProfileFromApi()`
   - Removed inline field mapping logic (70+ lines)

---

## Benefits Achieved

✅ **Separation of Concerns**: Business rules are in Application layer, not UI layer  
✅ **Reusability**: Transformation services can be used by any hook/component  
✅ **Testability**: Business rules can be tested independently  
✅ **Maintainability**: Changes to transformation logic don't require hook changes  
✅ **Single Source of Truth**: Transformation rules are centralized
