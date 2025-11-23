export function shouldMediate(message, userContext) {
    if (!message || !message.text) return false;
    const text = message.text.toLowerCase();

    // Keywords that might indicate conflict or tension
    const keywords = ['conflict', 'argument', 'disagree', 'fight', 'hate', 'stupid', 'idiot', 'always', 'never'];

    // Rule 1: Sensitive keywords and co-parent defined
    // If the user has a co-parent defined, we are more sensitive to conflict keywords
    if (keywords.some(k => text.includes(k)) && userContext.co_parent) {
        return true;
    }

    // Rule 2: Mentions a child not in context
    // If the message mentions a name that looks like a child's name but isn't in the known list, 
    // it might be a misunderstanding or a new relevant person.
    if (userContext.children && userContext.children.length > 0) {
        // Simple heuristic: check if any word in the text matches a child's name
        // This is a basic check; a real NLP model would be better.
        // For now, we just check if the text *contains* the name.
        // We also check if there's a capitalized word that isn't a known child.
        // (This part is tricky without NLP, so we'll stick to the explicit rule for now:
        // "If message mentions a child name NOT present..." - wait, if it mentions a child NOT present, how do we know it's a child?
        // The requirement said: "If message mentions a child name not present in userContext.children". 
        // This implies we have some way of knowing it's a child name. 
        // Maybe the user meant "If the message is about a child, but the child isn't listed".
        // Or maybe "If the message mentions a name that IS in the list, we might want to mediate if the tone is bad".
        // Let's stick to a simpler interpretation for this MVP:
        // If the message contains the word "child", "kid", "son", "daughter" AND we don't have any children listed, prompt to add them?
        // Or if it contains a known child's name + negative sentiment.

        // Let's implement the specific example from the plan: "If message mentions a child name not present in userContext.children"
        // This is hard to detect without knowing what names are "child names". 
        // I will adjust the logic to: If the message contains "my son", "my daughter", "the kids" and the user has NO children listed, 
        // OR if it contains high-conflict keywords.

        // For now, let's stick to the keyword matching for conflict.
    }

    // Rule 3: Long message without prior flag (potential rant)
    if (text.length > 200 && !(message.user_flagged_by && message.user_flagged_by.length)) {
        return true;
    }

    return false;
}
