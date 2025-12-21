# Architectural Integrity Protocol

## MANDATORY: Before ANY Code Change

This protocol must be followed before modifying any file in the codebase.

---

## Phase 1: Impact Discovery

### 1.1 Query the Codebase Graph

```cypher
// What imports this file?
USE codebase
MATCH (dependent)-[:IMPORTS]->(target:File {name: 'TARGET_FILE'})
RETURN dependent.name, dependent.path

// What does this file import?
MATCH (target:File {name: 'TARGET_FILE'})-[:IMPORTS]->(dependency)
RETURN dependency.name, dependency.path

// What functions are defined here?
MATCH (target:File {name: 'TARGET_FILE'})-[:DEFINES]->(func:Function)
RETURN func.name, func.description

// What calls these functions?
MATCH (caller:Function)-[:CALLS]->(func:Function)<-[:DEFINES]-(target:File {name: 'TARGET_FILE'})
RETURN caller.name, func.name
```

### 1.2 List What Could Break

Document every:

- File that imports this file
- Function that calls functions in this file
- Data structure/contract that this file produces or consumes
- API endpoint that uses this file
- Frontend component that expects this data shape
- Database schema that this file reads/writes

---

## Phase 2: Flow Tracing

### 2.1 Trace Entry → Response

For the feature being changed, document the complete flow:

```
ENTRY POINT (where does the request/event originate?)
    ↓
PROCESSING (what transforms the data?)
    ↓
SAFETY (what validates, sanitizes, guards?)
    ↓
PERSISTENCE (what gets stored, where?)
    ↓
RESPONSE (what gets returned, to whom?)
```

### 2.2 Identify Contracts

A contract is any agreed-upon data shape between components:

- Function parameters and return types
- Event payloads (Socket.io events)
- API request/response bodies
- Database row shapes
- Frontend props/state expectations

---

## Phase 3: Change Planning

### 3.1 Enumerate All Changes Required

If changing a contract, list ALL:

- **Producers**: Files that create/output this data shape
- **Consumers**: Files that receive/expect this data shape
- **Validators**: Files that check this data shape
- **Persisters**: Files that store this data shape
- **Displayers**: Files that render this data shape

### 3.2 Change Order

Changes must be applied in dependency order:

1. Shared types/constants (if any)
2. Producers (update what generates the data)
3. Persisters (update storage schema if needed)
4. Consumers (update what receives the data)
5. Validators (update what checks the data)
6. Displayers (update what renders the data)

---

## Phase 4: Execution Rules

### 4.1 No Partial Implementations

- NEVER commit a producer change without the consumer change
- NEVER change a data shape without updating all references
- NEVER leave TODO comments for "fixing later"

### 4.2 Atomic Changes

Each change set must be complete:

- All affected files updated together
- All tests updated/added
- All types/interfaces aligned

### 4.3 Rollback Safety

Before applying changes:

- Document current behavior
- Ensure changes can be reverted
- Test in isolation before integration

---

## Phase 5: Verification

### 5.1 Contract Verification

After changes, verify:

- [ ] All producers output the new shape
- [ ] All consumers expect the new shape
- [ ] All validators check the new shape
- [ ] All persisters store the new shape
- [ ] All displayers render the new shape

### 5.2 Flow Verification

Trace the flow again with the new code:

- [ ] Entry point receives expected input
- [ ] Processing transforms correctly
- [ ] Safety checks still apply
- [ ] Persistence stores correctly
- [ ] Response returns expected output

---

## Quick Reference Checklist

Before ANY change:

- [ ] Queried codebase graph for dependencies
- [ ] Listed all files that could break
- [ ] Traced full flow (entry → response)
- [ ] Identified all contracts affected
- [ ] Enumerated all producers and consumers
- [ ] Planned changes in dependency order
- [ ] Confirmed no partial implementations
- [ ] Verified all contracts aligned after change
