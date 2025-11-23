const express = require('express');
const userContext = require('../userContext');

const router = express.Router();

// Get user context
router.get('/', async (req, res) => {
    const userId = req.query.user;
    if (!userId) return res.status(400).json({ error: 'user query param required' });
    try {
        const context = await userContext.getUserContext(userId);
        if (!context) {
            return res.json({ userId, co_parent: null, children: [], contacts: [] });
        }
        res.json({
            userId: context.username,
            co_parent: context.co_parent,
            children: context.children || [],
            contacts: context.contacts || [],
        });
    } catch (err) {
        console.error('Error fetching user context', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Create or update user context
router.post('/', async (req, res) => {
    const { userId, co_parent, children, contacts } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        await userContext.setUserContext(userId, {
            co_parent,
            children,
            contacts
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Error upserting user context', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
