#!/usr/bin/env python3
"""
LiaiZen Message Interceptor

This script acts as the "Interceptor." It takes a user's raw message, bundles it 
with the constitution (system prompt) and the user's context, and sends it to the AI.

The constitution contains:
- System Role: Observer/Mediator identity
- The Primitives: Metaphysical, Relational Axes, Communication Vector
- The Axioms: Pattern detection rules (Indirect Communication, Context Triggered, Direct)
- Mediation Protocol: PARSE → CONTEXT CHECK → AXIOM CHECK → DERIVE → DECIDE
- Observer Voice: Guidelines for structural observation

Usage:
    python interceptor.py
    
    Or set environment variables:
    export OPENAI_API_KEY=your_key_here
    python interceptor.py
"""

import os
import json
import sys
from pathlib import Path
from openai import OpenAI

# Initialize the client (Make sure you have an OPENAI_API_KEY environment variable)
# Or replace os.environ.get(...) with your actual key string for testing.
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def load_system_prompt():
    """
    Reads the 'Brain' from the constitution.md file.
    
    The constitution contains:
    - System Role (Observer/Mediator)
    - The Primitives (Metaphysical, Relational Axes, Communication Vector)
    - The Axioms (pattern detection rules)
    - Mediation Protocol
    - Observer Voice guidelines
    
    Looks for constitution.md in:
    1. chat-server/src/liaizen/policies/constitution.md (primary)
    2. Current directory (fallback)
    """
    # Primary location: constitution.md in the policies directory
    constitution_path = Path(__file__).parent.parent / "src" / "liaizen" / "policies" / "constitution.md"
    
    # Fallback to current directory
    fallback_paths = [
        constitution_path,
        Path("constitution.md"),
        Path(__file__).parent / "constitution.md",
    ]
    
    for path in fallback_paths:
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    print(f"✅ Loaded system prompt from: {path}")
                    return content
            except Exception as e:
                print(f"Error reading {path}: {e}")
                continue
    
    return "Error: constitution.md not found. Expected location: chat-server/src/liaizen/policies/constitution.md"

def analyze_message(user_message, sender_profile, receiver_profile):
    """
    The Core Logic Function.
    
    Combines the Laws (System Prompt) + The Reality (Context) + The Input (Message).
    
    Args:
        user_message: The message text to analyze
        sender_profile: Dict with sender context (role, position, resources, etc.)
        receiver_profile: Dict with receiver context (has_new_partner, income_disparity, etc.)
    
    Returns:
        Dict with analysis results from OpenAI
    """
    
    # 1. Load the Constitution (system prompt)
    system_logic = load_system_prompt()
    
    # 2. Format the Context Coordinates
    # We inject these so the AI knows which 'Context Triggered' axioms to apply.
    context_block = f"""
CONTEXT DATA:

SENDER (User):
- Role: {sender_profile.get('role')}
- Position: {sender_profile.get('position')} (e.g., was_left, reaching)
- Resources: {sender_profile.get('resources')}

RECEIVER (Co-parent):
- New Partner: {receiver_profile.get('has_new_partner')}
- Income Disparity: {receiver_profile.get('income_disparity')}
- Distance: {receiver_profile.get('distance')}

HISTORY FLAGS:
- Conflict Level: {sender_profile.get('conflict_level')}
- Abuse History: {sender_profile.get('abuse_history')}
"""
    
    # 3. Call the API
    print(f"Analyzing message: '{user_message}'...")
    
    try:
        # OpenAI requires the word "json" in messages when using json_object response format
        # Include the expected JSON structure in the prompt
        user_prompt = f"""{context_block}

CURRENT MESSAGE TO ANALYZE:
"{user_message}"

=== RESPOND WITH JSON ===

You must respond with a JSON object matching this exact structure:

{{
  "action": "STAY_SILENT|INTERVENE|COMMENT",
  
  "escalation": {{
    "riskLevel": "low|medium|high|critical",
    "confidence": 0-100,
    "reasons": ["specific phrasing issue 1", "phrasing issue 2"]
  }},
  
  "emotion": {{
    "currentEmotion": "neutral|frustrated|calm|defensive|collaborative|anxious|angry",
    "stressLevel": 0-100,
    "stressTrajectory": "increasing|decreasing|stable",
    "emotionalMomentum": 0-100,
    "triggers": ["trigger1"],
    "conversationEmotion": "neutral|tense|collaborative|escalating"
  }},
  
  "intervention": {{
    "personalMessage": "ADDRESS: Use OBSERVER VOICE to name the structure. Identify which Axioms fired. Explain Intent vs. Impact Delta. Max 2 sentences.",
    "tip1": "ONE TIP: Max 10 words. Specific to THIS message. Actionable skill.",
    "rewrite1": "SENDER ALTERNATIVE #1: What the SENDER could say INSTEAD of their original message. NOT a response.",
    "rewrite2": "SENDER ALTERNATIVE #2: A DIFFERENT way the SENDER could express their point. NOT a reply.",
    "comment": "For COMMENT action only. Brief tactical observation."
  }}
}}

CRITICAL: 
- If action=INTERVENE, ALL intervention fields are REQUIRED
- If action=STAY_SILENT, intervention fields can be empty/null
- rewrite1 and rewrite2 are ALTERNATIVE MESSAGES the SENDER could send INSTEAD, NOT responses
- Use OBSERVER VOICE: State structures, name Axioms, explain Intent vs. Impact Delta
- Respond with valid JSON only."""
        
        response = client.chat.completions.create(
            model="gpt-4o",  # Use a smart model for logic (GPT-4o or Claude 3.5 Sonnet)
            messages=[
                {"role": "system", "content": system_logic},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},  # Forces clean JSON output
            temperature=0.0  # Zero creativity. Pure logic.
        )
        
        # 4. Parse and Return
        return json.loads(response.choices[0].message.content)
    
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return {"error": str(e)}


# ==========================================
# TEST RUNNER (Run this file to see it work)
# ==========================================
if __name__ == "__main__":
    
    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY environment variable not set!")
        print("Set it with: export OPENAI_API_KEY=your_key_here")
        sys.exit(1)
    
    # MOCK DATA: Simulating a database pull
    current_user = {
        "role": "Parent A",
        "position": "was_left",
        "resources": "less_time",
        "conflict_level": "High",
        "abuse_history": "None"
    }
    
    coparent = {
        "has_new_partner": True,  # This should trigger AXIOM C002
        "income_disparity": "Higher",
        "distance": "10 miles"
    }
    
    # TEST MESSAGE: A classic trap
    draft_message = "I just think it's confusing for her to be around your new friend so soon."
    
    # RUN ANALYSIS
    result = analyze_message(draft_message, current_user, coparent)
    
    # PRETTY PRINT THE RESULT
    print("\n--- LIAIZEN LOGIC LOG ---")
    print(json.dumps(result, indent=2))

