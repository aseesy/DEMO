import React, { createContext, useContext, useState, useEffect } from 'react';
import initialRelationships from './relationships.json'; // default map
import { useAuth } from '../hooks/useAuth.js'; // to get current user
import { API_BASE_URL } from '../config.js';

// ---------------------------------------------------------------------------
// Mediator Context – tracks participants in a chat and provides a simple
// relationship map. This is deliberately lightweight so a non‑technical user can
// edit the mapping directly in the JSON file if needed.
// ---------------------------------------------------------------------------

// Shape of the context value
/**
 * participants: string[] – list of unique usernames seen in the chat
 * relationships: Record<string, string> – a map of "userA|userB" => "relationship"
 * setRelationship: (userA: string, userB: string, relation: string) => void
 */

const MediatorContext = createContext(null);

export const MediatorProvider = ({ children }) => {
    const [participants, setParticipants] = useState([]);
    const [relationships, setRelationships] = useState(initialRelationships.relationships || {});
    const [userContext, setUserContext] = useState({ co_parent: null, children: [], contacts: [] });
    const [needsMediation, setNeedsMediation] = useState(false);

    const { username } = useAuth(); // current logged‑in user id

    // Load user context from backend when username becomes available
    useEffect(() => {
        if (!username) return;
        fetch(`${API_BASE_URL}/api/userContext?user=${encodeURIComponent(username)}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setUserContext({
                    co_parent: data.co_parent || null,
                    children: data.children || [],
                    contacts: data.contacts || [],
                });
            })
            .catch((err) => console.error('Failed to load user context', err));
    }, [username]);

    // Add a participant if not already present
    const addParticipant = (username) => {
        setParticipants((prev) => (prev.includes(username) ? prev : [...prev, username]));
    };

    // Helper to build a deterministic key for a pair of users
    const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    const setRelationship = (userA, userB, relation) => {
        const key = pairKey(userA, userB);
        setRelationships((prev) => ({ ...prev, [key]: relation }));
    };

    const getRelationship = (userA, userB) => {
        const key = pairKey(userA, userB);
        return relationships[key] || 'peer'; // default to "peer"
    };

    // Persist updated user context back to the server
    const updateUserContext = async (newContext) => {
        if (!username) return;
        const payload = { userId: username, ...newContext };
        try {
            const res = await fetch('/api/userContext', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Server responded with error');
            setUserContext(newContext);
        } catch (err) {
            console.error('Failed to update user context', err);
        }
    };

    // Expose a simple API via context
    const value = {
        participants,
        addParticipant,
        relationships,
        setRelationship,
        getRelationship,
        userContext,
        setUserContext,
        updateUserContext,
        needsMediation,
        setNeedsMediation,
    };

    return <MediatorContext.Provider value={value}>{children}</MediatorContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMediator = () => {
    const ctx = useContext(MediatorContext);
    if (!ctx) {
        throw new Error('useMediator must be used within a MediatorProvider');
    }
    return ctx;
};
