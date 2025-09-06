import axios from 'axios';

const baseURL = process.env.LISTMONK_BASE_URL!;
const username = process.env.LISTMONK_USERNAME!;
const password = process.env.LISTMONK_PASSWORD!;
const listId = Number(process.env.LISTMONK_LIST_ID || 1);

const client = axios.create({
  baseURL,
  auth: { username, password }
});

// Create or update a subscriber and subscribe to list
export async function upsertSubscriber(email: string, name?: string | null) {
  // Try to upsert (Listmonk has PUT /api/subscribers)
  try {
    const res = await client.post('/api/subscribers', {
      email,
      name,
      status: 'enabled',
      lists: [listId]
    });
    return res.data;
  } catch (err: any) {
    // If already exists, attach to list
    if (err?.response?.status === 409) {
      const subRes = await client.get('/api/subscribers', { params: { query: email }});
      const id = subRes.data?.data?.results?.[0]?.id;
      if (id) {
        await client.post(`/api/lists/${listId}/subscribers`, { subscribers: [id] });
        return { id, email, name };
      }
    }
    throw err;
  }
}

export async function listSubscribers(limit = 50, page = 1) {
  const res = await client.get('/api/subscribers', { params: { page, per_page: limit }});
  return res.data;
}

// Create & start a campaign in Listmonk (uses Listmonk's sending pipeline)
// NOTE: Ensure Listmonk is configured to use SES SMTP.
export async function createAndStartCampaign(title: string, subject: string, bodyHtml: string) {
  const createRes = await client.post('/api/campaigns', {
    name: title,
    subject,
    lists: [{ id: listId, type: 'include' }],
    type: 'regular',
    content_type: 'html',
    body: bodyHtml
  });

  const campaignId = createRes.data?.data?.id ?? createRes.data?.id;
  await client.put(`/api/campaigns/${campaignId}/status`, { status: 'running' });
  return { campaignId };
}
