/**
 * Display Name Disambiguation Logic
 */

function getDisambiguatedDisplay(user, contextUsers = []) {
  const displayName = user.display_name || user.username;
  if (!displayName) return `User #${user.id}`;

  const hasDuplicate = contextUsers.some(
    other => other.id !== user.id && (other.display_name || other.username) === displayName
  );

  if (!hasDuplicate) return displayName;

  if (user.email) {
    const domain = user.email.split('@')[1]?.split('.')[0];
    if (domain) return `${displayName} (${domain})`;
  }
  return `${displayName} #${user.id}`;
}

function disambiguateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) return contacts;

  const nameGroups = contacts.reduce((acc, contact) => {
    const name = contact.contact_name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(contact);
    return acc;
  }, {});

  return contacts.map(contact => {
    const name = contact.contact_name || 'Unknown';
    const group = nameGroups[name];

    if (group.length > 1 && contact.contact_email) {
      const domain = contact.contact_email.split('@')[1]?.split('.')[0];
      return { ...contact, displayName: `${name} (${domain})` };
    }
    return { ...contact, displayName: name };
  });
}

module.exports = { getDisambiguatedDisplay, disambiguateContacts };
