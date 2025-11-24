# SDD Framework Agent Quick Reference

## 🎯 Agent Overview

The SDD Framework includes 9 specialized agents organized across 5 departments. Each agent has specific expertise, tool access, and MCP server integrations tailored to their responsibilities.

## 🏢 Departments & Agents

### Architecture Department (2 agents)
System design, planning, and architectural decisions

| Agent | Purpose | Key Skills | Tools |
|-------|---------|------------|-------|
| **subagent-architect** | Agent creation & SDD compliance | Constitutional validation, agent architecture, workflow design | Read, Write, Edit, MultiEdit, Bash, Grep, Glob, TodoWrite |
| **backend-architect** | Backend system design | API architecture, microservices, scalability planning, Node.js/Python | Read, Write, Bash, MultiEdit |

### Engineering Department (2 agents)
Code development and implementation

| Agent | Purpose | Key Skills | Tools |
|-------|---------|------------|-------|
| **frontend-specialist** | UI/UX development | React/Next.js, state management, responsive design, performance | Read, Write, Bash, MultiEdit |
| **full-stack-developer** | End-to-end features | Full stack development, API integration, rapid prototyping | Read, Write, Bash, MultiEdit |

### Quality Department (2 agents)
Testing, security, and quality assurance

| Agent | Purpose | Key Skills | Tools |
|-------|---------|------------|-------|
| **security-specialist** | Security reviews | Vulnerability assessment, secure coding, penetration testing | Read, Write, Bash, MultiEdit |
| **testing-specialist** | QA & test automation | Test planning, TDD/BDD, automation frameworks, bug analysis | Read, Write, Bash, MultiEdit |

### Operations Department (2 agents)
Deployment, monitoring, and performance

| Agent | Purpose | Key Skills | Tools |
|-------|---------|------------|-------|
| **devops-engineer** | CI/CD & deployment | Docker, Kubernetes, cloud platforms, IaC, monitoring | Read, Write, Bash, MultiEdit |
| **performance-engineer** | Performance optimization | Load testing, profiling, bottleneck analysis, APM tools | Read, Write, Bash, MultiEdit |

### Data Department (1 agent)
Database and data management

| Agent | Purpose | Key Skills | Tools |
|-------|---------|------------|-------|
| **database-specialist** | Database architecture | Schema design, query optimization, migrations, performance tuning | Read, Write, Bash, MultiEdit |

## 🚀 Usage Patterns

### Automatic Invocation
Agents are automatically triggered based on:
- **Keywords**: Task descriptions matching department patterns
- **Workflow stage**: Specific phases requiring specialized expertise
- **Complexity**: Multi-faceted tasks requiring agent teams
- **Constitutional requirements**: Mandatory delegation for certain operations

### Manual Invocation
```
Use the [agent-name] agent to [task description]
```

Example:
```
Use the testing-specialist agent to create comprehensive test coverage for the authentication module
```

## 🔄 Common Workflows

### Feature Development
```
backend-architect (design) →
full-stack-developer (implement) →
testing-specialist (test) →
security-specialist (review)
```

### Performance Optimization
```
performance-engineer (analyze) →
database-specialist (optimize queries) →
backend-architect (refactor) →
devops-engineer (deploy)
```

### Agent Creation
```
subagent-architect (MANDATORY via Task tool)
```

## 🛠️ MCP Server Access

### By Department

| Department | MCP Servers | Purpose |
|------------|------------|---------|
| **Architecture** | ref-tools, supabase_search_docs, perplexity, claude-context | Documentation, search, analysis |
| **Engineering** | ide, supabase, ref-tools, browsermcp, claude-context | Development, database, browser automation |
| **Quality** | ide_executeCode, ide_getDiagnostics, ref-tools | Test execution, code analysis |
| **Data** | supabase, supabase_apply_migration, supabase_execute_sql | Database operations |
| **Operations** | supabase_deploy_edge_function, supabase_get_logs, supabase_create_project | Deployment, monitoring |

## 📋 Agent Selection Guidelines

### When to Use Each Agent

**subagent-architect**
- Creating new agents (MANDATORY)
- Designing agent workflows
- Ensuring constitutional compliance

**backend-architect**
- API design decisions
- System architecture planning
- Microservices design
- Database schema planning

**frontend-specialist**
- React/Next.js implementation
- UI component development
- Frontend performance optimization
- Responsive design implementation

**full-stack-developer**
- Rapid prototyping
- End-to-end feature implementation
- API integration tasks
- Cross-stack debugging

**security-specialist**
- Security audits
- Vulnerability assessments
- Secure coding reviews
- Compliance checks

**testing-specialist**
- Test strategy planning
- Test automation setup
- QA process implementation
- Bug reproduction and analysis

**devops-engineer**
- CI/CD pipeline setup
- Container orchestration
- Cloud deployments
- Infrastructure as code

**performance-engineer**
- Performance bottleneck analysis
- Load testing implementation
- Scalability planning
- Monitoring setup

**database-specialist**
- Database schema design
- Query optimization
- Data migration planning
- Database performance tuning

## 🔐 Constitutional Compliance

All agents enforce:
- **Test-First Development** (TDD mandatory)
- **Library-First Architecture** (features as libraries)
- **NO Git operations** without user approval
- **Contract-driven integration** patterns
- **Audit trail maintenance** for all operations

## 📊 Agent Collaboration Matrix

| Primary Agent | Commonly Collaborates With | For Tasks |
|---------------|---------------------------|-----------|
| backend-architect | database-specialist, frontend-specialist | System design |
| full-stack-developer | testing-specialist, devops-engineer | Feature delivery |
| security-specialist | All agents | Security reviews |
| testing-specialist | All engineering agents | Quality assurance |
| performance-engineer | database-specialist, backend-architect | Optimization |
| devops-engineer | All agents | Deployment |

## 🎯 Quick Decision Tree

```
Need to create an agent? → subagent-architect (via Task tool)
Planning system architecture? → backend-architect
Building UI components? → frontend-specialist
Implementing full features? → full-stack-developer
Security concerns? → security-specialist
Testing needs? → testing-specialist
Performance issues? → performance-engineer
Deployment tasks? → devops-engineer
Database work? → database-specialist
```

## 📝 Notes

- Agents inherit all constitutional requirements
- Tool access is department-specific but can be customized
- MCP server access aligns with department responsibilities
- All agents maintain persistent memory in `.docs/agents/`
- Agent registry tracks all agents and their configurations

---

Last Updated: 2025-09-19
Total Agents: 9
Active Departments: 5