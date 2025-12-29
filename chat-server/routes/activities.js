/**
 * Activities Routes
 *
 * Handles child activity management including CRUD operations.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');

/**
 * GET /api/activities/:contactId
 * Get all activities for a child contact
 */
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const email = req.query.email || req.query.username || req.body.email || req.body.username; // Support both for backward compatibility

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email (email is now the primary identifier)
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: email.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user and is a child
    const contactResult = await dbSafe.safeSelect(
      'contacts',
      {
        id: parseInt(contactId),
        user_id: userId,
        relationship: 'my child',
      },
      { limit: 1 }
    );
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Child contact not found' });
    }

    // Get all activities for this child
    const activitiesResult = await dbSafe.safeSelect(
      'child_activities',
      {
        contact_id: parseInt(contactId),
      },
      {
        orderBy: 'created_at',
        orderDirection: 'DESC',
      }
    );
    let activities = dbSafe.parseResult(activitiesResult);

    // Parse JSON fields
    activities = activities.map(activity => ({
      ...activity,
      days_of_week: activity.days_of_week ? JSON.parse(activity.days_of_week) : [],
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/activities
 * Create new activity
 */
router.post('/', async (req, res) => {
  try {
    const {
      contactId,
      email,
      username,
      activityName,
      description,
      location,
      instructorContact,
      daysOfWeek,
      startTime,
      endTime,
      recurrence,
      startDate,
      endDate,
      cost,
      costFrequency,
      splitType,
      splitPercentage,
      paidBy,
      notes,
    } = req.body;

    const userEmail = email || username; // Support both for backward compatibility

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!contactId || !activityName || !recurrence || !startDate) {
      return res
        .status(400)
        .json({ error: 'Contact ID, activity name, recurrence, and start date are required' });
    }

    // Get user by email (email is now the primary identifier)
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: userEmail.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user and is a child
    const contactResult = await dbSafe.safeSelect(
      'contacts',
      {
        id: parseInt(contactId),
        user_id: userId,
        relationship: 'my child',
      },
      { limit: 1 }
    );
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Child contact not found' });
    }

    // Insert activity
    const insertData = {
      contact_id: parseInt(contactId),
      user_id: userId,
      activity_name: activityName.trim(),
      description: description || null,
      location: location || null,
      instructor_contact: instructorContact || null,
      days_of_week: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      recurrence: recurrence,
      start_date: startDate,
      end_date: endDate || null,
      cost: cost || 0,
      cost_frequency: costFrequency || null,
      split_type: splitType || 'equal',
      split_percentage: splitPercentage || null,
      paid_by: paidBy || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dbSafe.safeInsert('child_activities', insertData);

    res.json({
      success: true,
      message: 'Activity created successfully',
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/activities/:activityId
 * Update activity
 */
router.put('/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const {
      email,
      username,
      activityName,
      description,
      location,
      instructorContact,
      daysOfWeek,
      startTime,
      endTime,
      recurrence,
      startDate,
      endDate,
      cost,
      costFrequency,
      splitType,
      splitPercentage,
      paidBy,
      notes,
    } = req.body;

    const userEmail = email || username; // Support both for backward compatibility

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email (email is now the primary identifier)
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: userEmail.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify activity belongs to user
    const activityResult = await dbSafe.safeSelect(
      'child_activities',
      {
        id: parseInt(activityId),
        user_id: userId,
      },
      { limit: 1 }
    );
    const activities = dbSafe.parseResult(activityResult);

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Build update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (activityName !== undefined) updateData.activity_name = activityName.trim();
    if (description !== undefined) updateData.description = description || null;
    if (location !== undefined) updateData.location = location || null;
    if (instructorContact !== undefined) updateData.instructor_contact = instructorContact || null;
    if (daysOfWeek !== undefined)
      updateData.days_of_week = daysOfWeek ? JSON.stringify(daysOfWeek) : null;
    if (startTime !== undefined) updateData.start_time = startTime || null;
    if (endTime !== undefined) updateData.end_time = endTime || null;
    if (recurrence !== undefined) updateData.recurrence = recurrence;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate || null;
    if (cost !== undefined) updateData.cost = cost || 0;
    if (costFrequency !== undefined) updateData.cost_frequency = costFrequency || null;
    if (splitType !== undefined) updateData.split_type = splitType || 'equal';
    if (splitPercentage !== undefined) updateData.split_percentage = splitPercentage || null;
    if (paidBy !== undefined) updateData.paid_by = paidBy || null;
    if (notes !== undefined) updateData.notes = notes || null;

    await dbSafe.safeUpdate('child_activities', updateData, { id: parseInt(activityId) });

    res.json({
      success: true,
      message: 'Activity updated successfully',
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/activities/:activityId
 * Delete activity
 */
router.delete('/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const email = req.query.email || req.query.username || req.body.email || req.body.username; // Support both for backward compatibility

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email (email is now the primary identifier)
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: email.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify activity belongs to user
    const activityResult = await dbSafe.safeSelect(
      'child_activities',
      {
        id: parseInt(activityId),
        user_id: userId,
      },
      { limit: 1 }
    );
    const activities = dbSafe.parseResult(activityResult);

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await dbSafe.safeDelete('child_activities', { id: parseInt(activityId) });

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
