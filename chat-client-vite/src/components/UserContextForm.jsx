import React, { useState, useEffect } from 'react';
import { useMediator } from '../context/MediatorContext.jsx';

export default function UserContextForm() {
    const { userContext, updateUserContext } = useMediator();
    const [formData, setFormData] = useState({ co_parent: '', children: [], contacts: [] });
    const [jsonError, setJsonError] = useState(null);

    // We'll use simple text areas for JSON for now as per the plan,
    // but to make it usable we need to handle the string conversion.
    const [childrenString, setChildrenString] = useState('');
    const [contactsString, setContactsString] = useState('');

    useEffect(() => {
        if (userContext) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => {
                // Only update if values are different to avoid unnecessary re-renders
                if (prev.co_parent === (userContext.co_parent || '') &&
                    JSON.stringify(prev.children) === JSON.stringify(userContext.children || []) &&
                    JSON.stringify(prev.contacts) === JSON.stringify(userContext.contacts || [])) {
                    return prev;
                }
                return {
                    co_parent: userContext.co_parent || '',
                    children: userContext.children || [],
                    contacts: userContext.contacts || []
                };
            });

            // Also update the string representations
            const newChildrenStr = JSON.stringify(userContext.children || [], null, 2);
            const newContactsStr = JSON.stringify(userContext.contacts || [], null, 2);

            setChildrenString(prev => prev === newChildrenStr ? prev : newChildrenStr);
            setContactsString(prev => prev === newContactsStr ? prev : newContactsStr);
        }
    }, [userContext]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChildrenStringChange = (e) => {
        setChildrenString(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData(prev => ({ ...prev, children: parsed }));
            setJsonError(null);
        } catch {
            setJsonError('Invalid JSON in Children field');
        }
    };

    const handleContactsStringChange = (e) => {
        setContactsString(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData(prev => ({ ...prev, contacts: parsed }));
            setJsonError(null);
        } catch {
            setJsonError('Invalid JSON in Contacts field');
        }
    };

    const handleSave = async () => {
        if (jsonError) {
            alert('Please fix JSON errors before saving.');
            return;
        }
        await updateUserContext(formData);
        alert('Context saved!');
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-teal-800">Mediator Context</h2>
            <p className="text-sm text-gray-600 mb-4">
                Help the AI mediator understand your family situation better.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Co-Parent Name
                    </label>
                    <input
                        type="text"
                        name="co_parent"
                        value={formData.co_parent}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        placeholder="e.g. Alex"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Children (JSON format: <code>[{`{"name": "Sam", "age": 8}`}]</code>)
                    </label>
                    <textarea
                        value={childrenString}
                        onChange={handleChildrenStringChange}
                        className="w-full p-2 border border-gray-300 rounded-md h-32 font-mono text-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Contacts (JSON format: <code>[{`{"name": "Grandma", "relationship": "Grandmother"}`}]</code>)
                    </label>
                    <textarea
                        value={contactsString}
                        onChange={handleContactsStringChange}
                        className="w-full p-2 border border-gray-300 rounded-md h-32 font-mono text-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                {jsonError && (
                    <div className="text-red-600 text-sm font-medium">
                        {jsonError}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                    Save Context
                </button>
            </div>
        </div>
    );
}
