# Automatic Information Extraction

## Overview

The Information Extraction Service automatically extracts structured information from conversation messages and updates contact profiles, especially for children.

## How It Works

### Extraction Triggers

When a parent sends a message like:

> "Emma's new allergist is Dr. Patel at Children's Medical, her next appointment is January 15th"

The AI automatically:

1. **Identifies the person**: Emma (matches to existing contact)
2. **Extracts information**:
   - Allergist: Dr. Patel
   - Facility: Children's Medical
   - Appointment: January 15th
3. **Updates the contact profile** automatically

### Supported Information Types

#### Medical Information

- **Doctors/Allergists/Therapists**: Extracted to `child_health_doctor` or `child_health_therapist`
- **Allergies**: Extracted to `child_health_allergies`
- **Medications**: Extracted to `child_health_medications`
- **Physical conditions**: Extracted to `child_health_physical_conditions`
- **Mental health**: Extracted to `child_health_mental_conditions` or `child_health_mental_treatment`

#### Appointments

- **Dates and times**: Stored in `additional_thoughts` with context
- **Facilities**: Included in appointment notes

#### School Information

- **School names**: Extracted to `school` field
- **Teachers**: Can be extracted to notes

### Integration Point

The extraction runs automatically after a message is:

1. ✅ Approved by AI mediation (no intervention)
2. ✅ Saved to database
3. ✅ Emitted to room

It runs **asynchronously** using `setImmediate()` so it doesn't block message delivery.

### Contact Matching

The service matches extracted information to contacts by:

1. **Exact match**: If extraction includes `existingContactId`
2. **Name matching**: Case-insensitive, partial matching
   - "Emma" matches "Emma"
   - "emma" matches "Emma"
   - "Emma's" matches "Emma"

### Update Strategy

- **Append for lists**: Doctors, allergies, medications are appended if not already present
- **Direct update**: School, age, and other single-value fields are updated directly
- **Appointments**: Stored in `additional_thoughts` with timestamp context

## Example Flow

```
1. User sends: "Emma's new allergist is Dr. Patel at Children's Medical, her next appointment is January 15th"

2. Message passes AI mediation (no intervention)

3. Message is saved and emitted

4. Information extraction runs (async):
   - Extracts: Emma → Dr. Patel (allergist), Children's Medical, Jan 15 appointment
   - Matches "Emma" to existing contact
   - Updates contact:
     * child_health_doctor: "Dr. Patel (Allergist)"
     * additional_thoughts: "Appointment: January 15th at Children's Medical"

5. User receives notification: "✅ Updated 1 contact with information from your message."
```

## Configuration

### AI Model

- **Model**: `gpt-4o-mini`
- **Temperature**: `0.2` (conservative, accurate)
- **Max tokens**: `1000`

### Confidence Levels

Only extracts information with **high** or **medium** confidence. Low confidence extractions are filtered out.

## Error Handling

- Extraction failures don't block message delivery
- Errors are logged but don't affect user experience
- Contact updates are atomic (all or nothing per contact)

## Future Enhancements

- [ ] Support for appointment calendar integration
- [ ] Reminder notifications for upcoming appointments
- [ ] Extraction of medication schedules
- [ ] Support for multiple children in one message
- [ ] Extraction of school events and activities
