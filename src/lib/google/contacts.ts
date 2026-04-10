import { google } from 'googleapis';
import { ContactsStats } from './types';

export async function fetchContactsStats(accessToken: string): Promise<ContactsStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const people = google.people({ version: 'v1', auth });

  try {
    const connectionsRes = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 200,
      personFields: 'names,emailAddresses,phoneNumbers,organizations,memberships,metadata',
    });

    const connections = connectionsRes.data.connections || [];
    const totalContacts = connectionsRes.data.totalPeople || connections.length;

    let contactsWithEmail = 0;
    let contactsWithPhone = 0;
    const orgCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    for (const contact of connections) {
      if (contact.emailAddresses && contact.emailAddresses.length > 0) contactsWithEmail++;
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) contactsWithPhone++;

      if (contact.organizations) {
        for (const org of contact.organizations) {
          const orgName = org.name || 'Unknown';
          orgCounts[orgName] = (orgCounts[orgName] || 0) + 1;
        }
      }

      if (contact.memberships) {
        for (const membership of contact.memberships) {
          const groupName = membership.contactGroupMembership?.contactGroupResourceName || 'Other';
          groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
        }
      }
    }

    return {
      totalContacts,
      contactsByGroup: Object.entries(groupCounts)
        .map(([group, count]) => ({ group: group.replace('contactGroups/', ''), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      contactsByOrganization: Object.entries(orgCounts)
        .map(([org, count]) => ({ org, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      contactsWithEmail,
      contactsWithPhone,
      recentlyAdded: 0,
    };
  } catch (error) {
    console.error('Contacts API error:', error);
    return { totalContacts: 0, contactsByGroup: [], contactsByOrganization: [], contactsWithEmail: 0, contactsWithPhone: 0, recentlyAdded: 0 };
  }
}
