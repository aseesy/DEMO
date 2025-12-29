import React from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../apiClient.js';

export function useActivities(contactId, username, email) {
  const [activities, setActivities] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Use email if available, fallback to username (for backward compatibility)
  const userEmail = email || username;

  // Fetch activities for a contact
  const loadActivities = React.useCallback(async () => {
    if (!contactId || !userEmail) {
      setActivities([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryString = new URLSearchParams({ email: userEmail }).toString();
      const response = await apiGet(`/api/activities/${contactId}?${queryString}`);
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [contactId, userEmail]);

  // Load activities when contactId changes
  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Create new activity
  const createActivity = React.useCallback(
    async activityData => {
      if (!contactId || !userEmail) {
        throw new Error('Contact ID and email are required');
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await apiPost('/api/activities', {
          email: userEmail,
          contactId,
          activityName: activityData.activityName,
          description: activityData.description,
          location: activityData.location,
          instructorContact: activityData.instructorContact,
          daysOfWeek: activityData.daysOfWeek,
          startTime: activityData.startTime,
          endTime: activityData.endTime,
          recurrence: activityData.recurrence,
          startDate: activityData.startDate,
          endDate: activityData.endDate,
          cost: activityData.cost ? parseFloat(activityData.cost) : 0,
          costFrequency: activityData.costFrequency,
          splitType: activityData.splitType,
          splitPercentage: activityData.splitPercentage
            ? parseFloat(activityData.splitPercentage)
            : null,
          paidBy: activityData.paidBy,
          notes: activityData.notes,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create activity');
        }

        // Reload activities after creating
        await loadActivities();
      } catch (err) {
        console.error('Error creating activity:', err);
        setError(err.message || 'Failed to create activity');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [contactId, userEmail, loadActivities]
  );

  // Update activity
  const updateActivity = React.useCallback(
    async (activityId, activityData) => {
      if (!userEmail) {
        throw new Error('Email is required');
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await apiPut(`/api/activities/${activityId}`, {
          email: userEmail,
          activityName: activityData.activityName,
          description: activityData.description,
          location: activityData.location,
          instructorContact: activityData.instructorContact,
          daysOfWeek: activityData.daysOfWeek,
          startTime: activityData.startTime,
          endTime: activityData.endTime,
          recurrence: activityData.recurrence,
          startDate: activityData.startDate,
          endDate: activityData.endDate,
          cost: activityData.cost ? parseFloat(activityData.cost) : 0,
          costFrequency: activityData.costFrequency,
          splitType: activityData.splitType,
          splitPercentage: activityData.splitPercentage
            ? parseFloat(activityData.splitPercentage)
            : null,
          paidBy: activityData.paidBy,
          notes: activityData.notes,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update activity');
        }

        // Reload activities after updating
        await loadActivities();
      } catch (err) {
        console.error('Error updating activity:', err);
        setError(err.message || 'Failed to update activity');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userEmail, loadActivities]
  );

  // Delete activity
  const deleteActivity = React.useCallback(
    async activityId => {
      if (!userEmail) {
        throw new Error('Email is required');
      }

      setError(null);

      try {
        const response = await apiDelete(`/api/activities/${activityId}`, { email: userEmail });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete activity');
        }

        // Reload activities after deleting
        await loadActivities();
      } catch (err) {
        console.error('Error deleting activity:', err);
        setError(err.message || 'Failed to delete activity');
        throw err;
      }
    },
    [userEmail, loadActivities]
  );

  return {
    activities,
    isLoading,
    isSaving,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    reloadActivities: loadActivities,
  };
}
