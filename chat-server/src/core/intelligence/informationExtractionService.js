/**
 * Information Extraction Service
 *
 * Automatically extracts structured information from conversation messages
 * and updates contact profiles, especially for children.
 *
 * Example:
 * "Emma's new allergist is Dr. Patel at Children's Medical, her next appointment is January 15th"
 * Extracts:
 * - Person: Emma
 * - Allergist: Dr. Patel
 * - Facility: Children's Medical
 * - Appointment: January 15th
 */

const openaiClient = require('../engine/client');
const dbSafe = require('../../../dbSafe');

/**
 * Extract structured information from a message about people (especially children)
 * @param {string} messageText - The message text to analyze
 * @param {Array} existingContacts - User's current contacts
 * @param {Array} recentMessages - Recent conversation context
 * @returns {Promise<Object|null>} - Extracted information or null
 */
async function extractInformation(messageText, existingContacts = [], recentMessages = []) {
  if (!openaiClient.isConfigured() || !messageText || messageText.trim().length === 0) {
    return null;
  }

  try {
    // Build context about existing contacts
    const contactsContext = existingContacts
      .map(c => {
        const info = `${c.contact_name} (${c.relationship || 'Unknown'})`;
        const details = [];
        if (c.child_age) details.push(`Age: ${c.child_age}`);
        if (c.school) details.push(`School: ${c.school}`);
        if (c.child_health_doctor) details.push(`Doctor: ${c.child_health_doctor}`);
        if (c.child_health_allergies) details.push(`Allergies: ${c.child_health_allergies}`);
        return details.length > 0 ? `${info} - ${details.join(', ')}` : info;
      })
      .join('\n');

    const recentContext = recentMessages
      .slice(-5)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    const prompt = `You are analyzing a co-parenting message to extract structured information about people, especially children.

Message: "${messageText}"

Recent conversation:
${recentContext || 'No recent context'}

Existing contacts:
${contactsContext || 'No existing contacts'}

Extract structured information about people mentioned in the message. Focus especially on children and their:
- Medical information (doctors, allergists, therapists, medications, allergies, conditions)
- Appointments (dates, times, locations, facilities)
- School information (school name, teachers, events)
- Other important details (activities, schedules, needs)

For each person mentioned, extract:
1. Person name (match to existing contact if possible, or use name from message)
2. Information type (medical, appointment, school, other)
3. Specific details (doctor name, facility, date, etc.)
4. Confidence level (high/medium/low)

Respond in JSON format:
{
  "extractions": [
    {
      "personName": "Person's name (match to existing contact if possible)",
      "personMatch": "exact|partial|new",
      "existingContactId": null or contact_id if matched,
      "informationType": "medical|appointment|school|other",
      "details": {
        "field": "field_name (e.g., child_health_doctor, child_health_allergies, school)",
        "value": "extracted value",
        "additionalContext": "any additional context"
      },
      "confidence": "high|medium|low"
    }
  ],
  "shouldUpdate": true/false
}

Field mappings for children:
- Doctor/Allergist/Therapist: "child_health_doctor" or "child_health_therapist"
- Allergies: "child_health_allergies"
- Medications: "child_health_medications"
- Physical conditions: "child_health_physical_conditions"
- Mental health: "child_health_mental_conditions" or "child_health_mental_treatment"
- School: "school"
- Appointments: Store in "additional_thoughts" or create a notes field

Only extract information with high or medium confidence. Be conservative - only extract clear, unambiguous information.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI that extracts structured information from co-parenting messages. Be accurate and conservative - only extract clear, unambiguous information. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    let cleanedResponse = response;
    if (cleanedResponse.startsWith('```')) {
      const lines = cleanedResponse.split('\n');
      lines.shift(); // Remove first line (```json or ```)
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop(); // Remove last line (```)
      }
      cleanedResponse = lines.join('\n').trim();
    }

    const result = JSON.parse(cleanedResponse);

    // Filter to only high/medium confidence extractions
    if (result.extractions && result.extractions.length > 0) {
      result.extractions = result.extractions.filter(
        e => e.confidence === 'high' || e.confidence === 'medium'
      );
      result.shouldUpdate = result.extractions.length > 0;
    }

    return result;
  } catch (error) {
    console.error('[InformationExtraction] Error extracting information:', error.message);
    if (error.stack) {
      console.error('[InformationExtraction] Stack:', error.stack);
    }
    return null;
  }
}

/**
 * Update contact profile with extracted information
 * @param {number} userId - User ID
 * @param {Object} extraction - Extracted information
 * @returns {Promise<Object|null>} - Updated contact or null
 */
async function updateContactWithExtraction(userId, extraction) {
  if (!userId || !extraction || !extraction.personName) {
    return null;
  }

  try {
    // Find the contact to update
    let contactId = extraction.existingContactId;

    // If no existing contact ID, try to find by name
    if (!contactId) {
      const contacts = await dbSafe.safeSelect(
        'contacts',
        { user_id: userId },
        { orderBy: 'created_at', orderDirection: 'DESC' }
      );

      // Try to match by name (case-insensitive, partial match)
      const personNameLower = extraction.personName.toLowerCase();
      const matchedContact = contacts.find(
        c => c.contact_name?.toLowerCase() === personNameLower ||
             c.contact_name?.toLowerCase().includes(personNameLower) ||
             personNameLower.includes(c.contact_name?.toLowerCase())
      );

      if (matchedContact) {
        contactId = matchedContact.id;
        console.log('[InformationExtraction] Matched contact by name:', {
          personName: extraction.personName,
          contactId,
          contactName: matchedContact.contact_name,
        });
      }
    }

    if (!contactId) {
      console.log('[InformationExtraction] No contact found for:', extraction.personName);
      return null;
    }

    // Verify contact ownership
    const contact = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
    if (!contact || contact.length === 0 || contact[0].user_id !== userId) {
      console.error('[InformationExtraction] Contact not found or access denied:', contactId);
      return null;
    }

    const existingContact = contact[0];

    // Build update object
    const updates = {};
    const details = extraction.details;

    // Map extracted field to contact field
    if (details.field && details.value) {
      // Handle special cases
      if (details.field === 'child_health_doctor' || details.field === 'child_health_therapist') {
        // Append to existing doctor/therapist if present
        const existingValue = existingContact[details.field] || '';
        if (existingValue && !existingValue.includes(details.value)) {
          updates[details.field] = `${existingValue}, ${details.value}`.trim();
        } else if (!existingValue) {
          updates[details.field] = details.value;
        }
      } else if (details.field === 'child_health_allergies') {
        // Append to existing allergies if present
        const existingValue = existingContact.child_health_allergies || '';
        if (existingValue && !existingValue.includes(details.value)) {
          updates.child_health_allergies = `${existingValue}, ${details.value}`.trim();
        } else if (!existingValue) {
          updates.child_health_allergies = details.value;
        }
      } else if (details.field === 'appointment') {
        // Store appointments in additional_thoughts
        const existingNotes = existingContact.additional_thoughts || '';
        const appointmentNote = `Appointment: ${details.value}${details.additionalContext ? ` (${details.additionalContext})` : ''}`;
        if (existingNotes && !existingNotes.includes(appointmentNote)) {
          updates.additional_thoughts = `${existingNotes}\n${appointmentNote}`.trim();
        } else if (!existingNotes) {
          updates.additional_thoughts = appointmentNote;
        }
      } else {
        // Direct field update
        updates[details.field] = details.value;
      }
    }

    // Only update if we have changes
    if (Object.keys(updates).length === 0) {
      console.log('[InformationExtraction] No updates to apply for contact:', contactId);
      return existingContact;
    }

    // Add timestamp
    updates.updated_at = new Date().toISOString();

    // Update contact
    await dbSafe.safeUpdate('contacts', updates, { id: contactId });

    console.log('[InformationExtraction] ✅ Updated contact:', {
      contactId,
      personName: extraction.personName,
      updates,
    });

    // Return updated contact
    const updatedContact = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
    return updatedContact && updatedContact.length > 0 ? updatedContact[0] : null;
  } catch (error) {
    console.error('[InformationExtraction] Error updating contact:', error.message);
    return null;
  }
}

/**
 * Process message and extract information, then update contacts
 * @param {string} messageText - Message text
 * @param {number} userId - User ID
 * @param {Array} existingContacts - User's existing contacts
 * @param {Array} recentMessages - Recent conversation messages
 * @returns {Promise<Array>} - Array of updated contacts
 */
async function processMessageExtraction(messageText, userId, existingContacts = [], recentMessages = []) {
  if (!messageText || !userId) {
    return [];
  }

  try {
    // Extract information from message
    const extractionResult = await extractInformation(messageText, existingContacts, recentMessages);

    if (!extractionResult || !extractionResult.shouldUpdate || !extractionResult.extractions) {
      return [];
    }

    const updatedContacts = [];

    // Process each extraction
    for (const extraction of extractionResult.extractions) {
      const updatedContact = await updateContactWithExtraction(userId, extraction);
      if (updatedContact) {
        updatedContacts.push(updatedContact);
      }
    }

    return updatedContacts;
  } catch (error) {
    console.error('[InformationExtraction] Error processing message extraction:', error.message);
    return [];
  }
}

module.exports = {
  extractInformation,
  updateContactWithExtraction,
  processMessageExtraction,
};

