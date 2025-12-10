# Domain Model Layer

**Status**: 🚧 In Planning

This directory will contain first-class domain types for LiaiZen's core domain concepts.

---

## 📋 Planned Structure

```
domain/
├── entities/          # Core domain entities
│   ├── User.js
│   ├── Room.js
│   ├── Message.js
│   ├── Task.js
│   ├── Contact.js
│   ├── Child.js
│   ├── CommunicationProfile.js
│   └── Intervention.js
├── valueObjects/      # Typed value objects
│   ├── Email.js
│   ├── Username.js
│   ├── RoomId.js
│   └── MessageId.js
├── repositories/      # Data access abstraction
│   ├── UserRepository.js
│   ├── RoomRepository.js
│   └── MessageRepository.js
└── index.js          # Public API
```

---

## 🎯 Goals

1. **Type Safety** - Compile-time validation
2. **Encapsulation** - Business rules in entities
3. **Discoverability** - Domain concepts obvious in code
4. **Maintainability** - Single source of truth

---

## 📖 See Also

- `/DOMAIN_MODEL_PROPOSAL.md` - Full proposal document
- `/CODEBASE_SCAN_RECOMMENDATIONS.md` - Codebase analysis

---

**Note**: This directory will be created during Phase 1 of the domain model migration.

