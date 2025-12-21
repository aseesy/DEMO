# LiaiZen Tools

Standalone tools and utilities for testing and debugging the LiaiZen mediation system.

## interceptor.py

The Message Interceptor - A Python script that tests the LiaiZen mediation logic by:

1. Loading the system prompt from `constitution.md` (the authoritative source)
2. Taking a user message and context profiles
3. Sending it to OpenAI API
4. Returning structured JSON analysis

The constitution contains:

- **System Role**: Observer/Mediator identity
- **The Primitives**: Metaphysical, Relational Axes, Communication Vector
- **The Axioms**: Pattern detection rules (Indirect Communication, Context Triggered, Direct)
- **Mediation Protocol**: PARSE → CONTEXT CHECK → AXIOM CHECK → DERIVE → DECIDE
- **Observer Voice**: Guidelines for structural observation

### Setup

1. Install dependencies:

```bash
pip install openai
```

2. Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your_key_here
```

3. The script automatically loads `constitution.md` from:
   - `chat-server/src/liaizen/policies/constitution.md` (primary)
   - Falls back to `constitution.md` in current directory if not found

### Usage

```bash
cd chat-server/tools
python interceptor.py
```

### Customizing

Edit the mock data in the `if __name__ == "__main__":` section to test different scenarios:

- Change `current_user` dict to test different sender profiles
- Change `coparent` dict to test different receiver contexts
- Modify `draft_message` to test different message patterns
- The script will identify which Axioms fire based on the message and context
