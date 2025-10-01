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
        password: "6DJKSXqcY788i10pt8AZIwGDyYL8tLZn",
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
async function addSubscriberToList(subscriberId, listId) {
    try {
        const response = await client.put("/api/subscribers/lists", {
            ids: [subscriberId],
            action: "add",
            target_list_ids: [listId],
            status: "confirmed",
        });
        console.log("bbbbbbbbbc", response.data);
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
        // Check if subscriber already exists
        const existingSubscriber = await getSubscriberByEmail(email);
        if (existingSubscriber) {
            if (listId) {
                await addSubscriberToList(existingSubscriber.id, listId);
            }
            else {
                const allLists = await getAllLists();
                for (const list of allLists) {
                    try {
                        await addSubscriberToList(existingSubscriber.id, list.id);
                    }
                    catch (err) {
                        // Continue if subscriber already in this list
                    }
                }
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
            }
            const response = await client.post("/api/subscribers", {
                email,
                name: name || "",
                status: "enabled",
                lists: listIds,
                preconfirm_subscriptions: true,
            });
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
async function addToSpecificList(email, name, listId) {
    return await upsertSubscriber(email, name, listId);
}
async function addToAllLists(email, name) {
    return await upsertSubscriber(email, name, null);
}
