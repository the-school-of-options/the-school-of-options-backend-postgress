"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSubscriber = upsertSubscriber;
exports.listSubscribers = listSubscribers;
exports.createAndStartCampaign = createAndStartCampaign;
const axios_1 = __importDefault(require("axios"));
const baseURL = process.env.LISTMONK_BASE_URL;
const username = process.env.LISTMONK_USERNAME;
const password = process.env.LISTMONK_PASSWORD;
const listId = Number(process.env.LISTMONK_LIST_ID || 1);
const client = axios_1.default.create({
    baseURL,
    auth: { username, password }
});
// Create or update a subscriber and subscribe to list
async function upsertSubscriber(email, name) {
    // Try to upsert (Listmonk has PUT /api/subscribers)
    try {
        const res = await client.post('/api/subscribers', {
            email,
            name,
            status: 'enabled',
            lists: [listId]
        });
        return res.data;
    }
    catch (err) {
        // If already exists, attach to list
        if (err?.response?.status === 409) {
            const subRes = await client.get('/api/subscribers', { params: { query: email } });
            const id = subRes.data?.data?.results?.[0]?.id;
            if (id) {
                await client.post(`/api/lists/${listId}/subscribers`, { subscribers: [id] });
                return { id, email, name };
            }
        }
        throw err;
    }
}
async function listSubscribers(limit = 50, page = 1) {
    const res = await client.get('/api/subscribers', { params: { page, per_page: limit } });
    return res.data;
}
// Create & start a campaign in Listmonk (uses Listmonk's sending pipeline)
// NOTE: Ensure Listmonk is configured to use SES SMTP.
async function createAndStartCampaign(title, subject, bodyHtml) {
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
