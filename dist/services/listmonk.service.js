"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLists = getAllLists;
exports.getSubscriberByEmail = getSubscriberByEmail;
exports.addSubscriberToList = addSubscriberToList;
exports.upsertSubscriber = upsertSubscriber;
exports.addToSpecificList = addToSpecificList;
exports.addToAllLists = addToAllLists;
const axios_1 = __importDefault(require("axios"));
const client = axios_1.default.create({
    baseURL: "https://mail.theschoolofoptions.com",
    headers: { "Content-Type": "application/json" },
    auth: {
        username: "tech-atomclass-api",
        password: "tech-atomclass-api"
    },
});
async function getAllLists() {
    try {
        const response = await client.get("/api/lists");
        return response.data.data.results;
    }
    catch (err) {
        console.error("Error fetching lists:", err?.response?.data || err?.message);
        throw new Error(`Failed to fetch lists: ${err?.response?.data?.message || err?.message}`);
    }
}
async function getSubscriberByEmail(email) {
    try {
        const response = await client.get(`/api/subscribers?query=subscribers.email='${email}'`);
        const subscribers = response.data.data.results;
        return subscribers.length > 0 ? subscribers[0] : null;
    }
    catch (err) {
        if (err?.response?.status === 404) {
            return null;
        }
        console.error("Error checking subscriber:", err?.response?.data || err?.message);
        return null;
    }
}
/**
 * Add existing subscriber to specific list
 */
async function addSubscriberToList(subscriberId, listId) {
    try {
        const response = await client.put(`/api/subscribers/${subscriberId}/lists`, {
            ids: [listId],
            action: "add",
            status: "confirmed",
        });
        return response.data;
    }
    catch (err) {
        console.error("Error adding subscriber to list:", err?.response?.data || err?.message);
        throw new Error(`Failed to add to list: ${err?.response?.data?.message || err?.message}`);
    }
}
/**
 * Upsert subscriber with conditional list assignment
 * @param email - Subscriber email
 * @param name - Subscriber name (optional)
 * @param listId - Specific list ID (if provided) or null for all lists
 */
async function upsertSubscriber(email, name, listId) {
    try {
        const existingSubscriber = await getSubscriberByEmail(email);
        if (existingSubscriber) {
            console.log("Subscriber exists, updating lists...");
            if (listId) {
                await addSubscriberToList(existingSubscriber.id, listId);
                console.log(`Added existing subscriber to list ${listId}`);
            }
            else {
                const allLists = await getAllLists();
                for (const list of allLists) {
                    try {
                        await addSubscriberToList(existingSubscriber.id, list.id);
                    }
                    catch (err) {
                        console.log(`Subscriber might already be in list ${list.id}`);
                    }
                }
                console.log("Added existing subscriber to all lists");
            }
            return existingSubscriber;
        }
        else {
            let listIds = [];
            if (listId) {
                listIds = [listId];
            }
            else {
                const allLists = await getAllLists();
                listIds = allLists.map((list) => list.id);
                console.log("Adding to all lists:", listIds);
            }
            const response = await client.post("/api/subscribers", {
                email,
                name: name || "",
                status: "enabled",
                lists: listIds.map((id) => ({
                    id: id,
                    subscription_status: "confirmed",
                })),
            });
            console.log("New subscriber created:", response.data);
            return response.data;
        }
    }
    catch (err) {
        console.error("Listmonk error details:", {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
        });
        throw new Error(`Listmonk sync failed: ${err?.response?.data?.message || err?.message}`);
    }
}
/**
 * Add subscriber to specific list (wrapper function)
 */
async function addToSpecificList(email, listId, name) {
    return await upsertSubscriber(email, name, listId);
}
/**
 * Add subscriber to all lists (wrapper function)
 */
async function addToAllLists(email, name) {
    return await upsertSubscriber(email, name, null);
}
// Example usage:
/*
// Add to specific list (when listId is provided)
await addToSpecificList('user@example.com', 'John Doe', 1);

// Add to all lists (when no listId is provided)
await addToAllLists('user@example.com', 'Jane Doe');

// Direct usage with conditional logic
await upsertSubscriber('user@example.com', 'John Doe', 1); // Specific list
await upsertSubscriber('user@example.com', 'John Doe'); // All lists
*/
