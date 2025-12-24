const openaiClient = require('../core/client');
const dbSafe = require('../../../dbSafe');

/**
 * AI Contact Intelligence Module
 *
 * Provides:
 * 1. Contact mention detection in messages
 * 2. Relationship understanding and mapping
 * 3. AI-assisted profile completion
 */

/**
 * Detect mentioned people in a message and suggest adding them as contacts
 * @param {string} messageText - The message text to analyze
 * @param {Array} existingContacts - User's current contacts
 * @param {Array} recentMessages - Recent conversation context
 * @param {Array} participantUsernames - Usernames of chat participants (to exclude from detection)
 * @returns {Promise<Object|null>} - Detected people to add or null
 */
async function detectContactMentions(messageText, existingContacts = [], recentMessages = [], participantUsernames = []) {
  if (!openaiClient.isConfigured() || !messageText || messageText.trim().length === 0) {
    return null;
  }

  try {
    const existingContactNames = existingContacts
      .map(c => c.contact_name?.toLowerCase())
      .filter(Boolean);
    const participantNames = participantUsernames
      .map(u => u.toLowerCase())
      .filter(Boolean);
    const allExcludedNames = [...existingContactNames, ...participantNames];
    const recentContext = recentMessages
      .slice(-5)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    const excludedNamesString = allExcludedNames.length > 0
      ? `\n\nIMPORTANT - DO NOT suggest these names (they are already contacts or chat participants): ${allExcludedNames.join(', ')}`
      : '';

    const prompt = `You are analyzing a co-parenting message to detect mentions of people who should be added as contacts.

Message: "${messageText}"

Recent conversation:
${recentContext || 'No recent context'}

Existing contacts: ${existingContactNames.length > 0 ? existingContactNames.join(', ') : 'None'}${excludedNamesString}

Detect NEW people mentioned who are NOT in existing contacts or chat participants. Look for:
- Children (names, "my daughter", "our son", ages)
- Co-parents ("my ex", "their father/mother")
- Partners ("my partner", "my boyfriend/girlfriend")
- Teachers, doctors, therapists
- Family members
- Friends

For each new person detected, provide:
1. Name (or placeholder like "Child" if name not mentioned)
2. Relationship type (must be one of: "My Child", "My Co-Parent", "My Partner", "My Child's Teacher", "My Family", "My Friend", "Other")
3. Additional context (age, school, role, etc.)
4. Confidence (high/medium/low)

Respond in JSON format:
{
  "detectedPeople": [
    {
      "name": "Person's name or placeholder",
      "relationship": "Relationship type",
      "context": "Additional details about this person",
      "confidence": "high|medium|low"
    }
  ],
  "shouldPrompt": true/false
}

Only set shouldPrompt to true if you're confident (high/medium) about at least one new person.
If no new people detected, return empty detectedPeople array and shouldPrompt: false.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI that detects people mentioned in co-parenting messages. Be conservative - only suggest adding contacts when reasonably confident. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content.trim();
    const result = JSON.parse(response);

    // Filter to only high/medium confidence
    if (result.detectedPeople && result.detectedPeople.length > 0) {
      result.detectedPeople = result.detectedPeople.filter(
        p => p.confidence === 'high' || p.confidence === 'medium'
      );
      
      // Safety filter: Exclude any detected names that match participant usernames or existing contacts
      result.detectedPeople = result.detectedPeople.filter(
        p => {
          const detectedNameLower = p.name?.toLowerCase();
          return detectedNameLower && 
                 !allExcludedNames.includes(detectedNameLower) &&
                 !allExcludedNames.some(excluded => detectedNameLower.includes(excluded) || excluded.includes(detectedNameLower));
        }
      );
      
      result.shouldPrompt = result.detectedPeople.length > 0;
    }

    return result;
  } catch (error) {
    console.error('Error detecting contact mentions:', error.message);
    return null;
  }
}

/**
 * Generate AI-assisted profile suggestions for a contact
 * @param {Object} contactData - Partial contact data (name, relationship)
 * @param {Array} userContacts - User's existing contacts for relationship context
 * @param {Array} recentMessages - Recent messages for context
 * @returns {Promise<Object|null>} - Suggested profile fields or null
 */
async function generateContactProfile(contactData, userContacts = [], recentMessages = []) {
  if (!openaiClient.isConfigured() || !contactData.contact_name || !contactData.relationship) {
    return null;
  }

  try {
    const recentContext = recentMessages
      .slice(-10)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    // Build context about existing relationships
    const existingRelationships = userContacts
      .map(c => `${c.contact_name} (${c.relationship})`)
      .join(', ');

    const prompt = `You are helping a co-parent create a profile for a contact. Provide intelligent suggestions based on the relationship type and context.

Contact Name: ${contactData.contact_name}
Relationship: ${contactData.relationship}

Existing contacts: ${existingRelationships || 'None'}

Recent conversation context:
${recentContext || 'No recent messages'}

Based on the relationship type "${contactData.relationship}", suggest:
1. What additional fields would be helpful to fill out
2. Any intelligent defaults or suggestions for those fields
3. Helpful prompts or questions to gather important information
4. Whether this contact should be linked to another existing contact

Respond in JSON format:
{
  "suggestedFields": [
    {
      "fieldName": "field_name",
      "label": "User-friendly label",
      "suggestion": "Suggested value or helpful prompt",
      "importance": "required|recommended|optional",
      "placeholder": "Example placeholder text"
    }
  ],
  "helpfulQuestions": ["Question 1?", "Question 2?"],
  "linkedContactSuggestion": {
    "shouldLink": true/false,
    "linkedContactId": null or contact_id,
    "reason": "Why they should be linked"
  },
  "profileCompletionTips": "Brief helpful tip about what information is most important"
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant for co-parents. Provide thoughtful, practical suggestions for contact profiles. Be warm and supportive. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    let response = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    if (response.startsWith('```')) {
      const lines = response.split('\n');
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line (```)
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop();
      }
      response = lines.join('\n').trim();
    }

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError.message);
      console.error('AI response was:', response.substring(0, 500));
      // Return null to trigger fallback
      return null;
    }
  } catch (error) {
    console.error('Error generating contact profile:', error.message);
    console.error('Error stack:', error.stack);
    // Check if it's an OpenAI API error
    if (error.response) {
      console.error('OpenAI API error:', error.response.status, error.response.data);
    }
    return null;
  }
}

/**
 * Understand and map relationships between contacts
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Relationship map
 */
async function mapContactRelationships(userId) {
  if (!userId) {
    return { relationships: [], suggestions: [] };
  }

  try {
    const contacts = await dbSafe.allAsync(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at',
      [userId]
    );

    if (!contacts || contacts.length === 0) {
      return { relationships: [], suggestions: [] };
    }

    // Build relationship map
    const relationships = [];
    const suggestions = [];

    // Find children and their other parents
    const children = contacts.filter(
      c => c.relationship === 'My Child' || c.relationship === "My Partner's Child"
    );

    const coParents = contacts.filter(
      c => c.relationship === 'My Co-Parent' || c.relationship === "My Partner's Co-Parent"
    );

    // Suggest linking children to co-parents
    for (const child of children) {
      if (!child.linked_contact_id && coParents.length > 0) {
        suggestions.push({
          type: 'link',
          message: `Link ${child.contact_name} to their other parent?`,
          contactId: child.id,
          suggestedLinks: coParents.map(cp => ({
            id: cp.id,
            name: cp.contact_name,
            relationship: cp.relationship,
          })),
        });
      } else if (child.linked_contact_id) {
        const linkedParent = contacts.find(c => c.id === parseInt(child.linked_contact_id));
        if (linkedParent) {
          relationships.push({
            type: 'parent-child',
            child: { id: child.id, name: child.contact_name },
            parent: { id: linkedParent.id, name: linkedParent.contact_name },
          });
        }
      }
    }

    // Suggest missing relationships
    if (children.length > 0 && coParents.length === 0) {
      suggestions.push({
        type: 'missing',
        message: `You have children in your contacts but no co-parent added. Would you like to add them?`,
        suggestedRelationship: 'My Co-Parent',
      });
    }

    return { relationships, suggestions };
  } catch (error) {
    console.error('Error mapping contact relationships:', error.message);
    return { relationships: [], suggestions: [] };
  }
}

/**
 * Enrich contact data with AI insights from conversation history
 * @param {number} contactId - Contact ID
 * @param {number} userId - User ID
 * @param {Array} messages - Message history
 * @returns {Promise<Object|null>} - Enrichment suggestions
 */
async function enrichContactFromMessages(contactId, userId, messages = []) {
  if (!openaiClient.isConfigured() || !contactId || !userId || messages.length === 0) {
    return null;
  }

  try {
    const contact = await dbSafe.getAsync('SELECT * FROM contacts WHERE id = ? AND user_id = ?', [
      contactId,
      userId,
    ]);
    if (!contact) {
      return null;
    }

    // Find messages mentioning this contact
    const contactName = contact.contact_name.toLowerCase();
    const relevantMessages = messages
      .filter(m => m.text.toLowerCase().includes(contactName))
      .slice(-20);

    if (relevantMessages.length === 0) {
      return null;
    }

    const messageContext = relevantMessages.map(m => `${m.username}: ${m.text}`).join('\n');

    const prompt = `Analyze these co-parenting messages and extract useful information about a contact.

Contact: ${contact.contact_name} (${contact.relationship})

Current profile:
${JSON.stringify(contact, null, 2)}

Messages mentioning this contact:
${messageContext}

Extract any new information that could enrich their profile:
- For children: age, school, interests, schedule, needs
- For co-parents: communication patterns, concerns, agreements
- For professionals: role, contact info, availability
- Any important context, patterns, or notes

Respond in JSON format:
{
  "enrichments": [
    {
      "field": "field_name",
      "suggestedValue": "extracted value",
      "confidence": "high|medium|low",
      "source": "Brief context from messages"
    }
  ],
  "newInsights": ["Insight 1", "Insight 2"],
  "shouldUpdate": true/false
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are analyzing co-parenting messages to extract useful contact information. Be accurate and conservative. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const response = completion.choices[0].message.content.trim();
    return JSON.parse(response);
  } catch (error) {
    console.error('Error enriching contact from messages:', error.message);
    return null;
  }
}

module.exports = {
  detectContactMentions,
  generateContactProfile,
  mapContactRelationships,
  enrichContactFromMessages,
};
