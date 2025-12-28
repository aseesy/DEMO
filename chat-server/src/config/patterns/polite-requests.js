/**
 * Polite Request Patterns
 * 
 * Patterns that detect polite requests in messages.
 * These should never be flagged - they represent good co-parenting communication.
 */

module.exports = {
  POLITE_REQUEST_PATTERNS: [
    /\b(I was wondering if|would it be okay if|would you mind if|could I|can I|may I)\b/i,
    /\b(I know it'?s your|I know its your|I know you have)\b.*\b(but|and)\b/i,
    /\b(would it be possible|is it possible|is it okay if)\b/i,
    /\b(do you think|would you be open to|would you consider)\b/i,
    /\b(I'?d like to|I would like to)\b.*\b(if that'?s okay|if that works|if you don'?t mind)\b/i,
    /\b(can we|could we|shall we)\b.*\b(talk about|discuss|arrange|schedule|plan)\b/i,
    /\b(just wanted to ask|just checking if|quick question)\b/i,
    /\b(let me know if|let me know what you think)\b/i,
  ],
};

