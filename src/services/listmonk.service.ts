import axios from "axios";

const client = axios.create({
  baseURL: "https://mail.theschoolofoptions.com",
  headers: { "Content-Type": "application/json" },
  auth: {
    username: "tech-atomclass-api",
    password: "6DJKSXqcY788i10pt8AZIwGDyYL8tLZn",
  },
});

export async function getAllLists() {
  try {
    const response = await client.get("/api/lists");
    return response.data.data.results;
  } catch (err: any) {
    console.error("Error fetching lists:", err?.response?.data || err?.message);
    throw new Error(
      `Failed to fetch lists: ${err?.response?.data?.message || err?.message}`
    );
  }
}

export async function getSubscriberByEmail(email: string) {
  try {
    const response = await client.get(
      `/api/subscribers?query=subscribers.email='${email}'`
    );
    const subscribers = response.data.data.results;

    return subscribers.length > 0 ? subscribers[0] : null;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    console.error(
      "Error checking subscriber:",
      err?.response?.data || err?.message
    );
    return null;
  }
}

export async function addSubscriberToList(
  subscriberId: number,
  listId: number
) {
  try {
    const response = await client.put("/api/subscribers/lists", {
      ids: [subscriberId],
      action: "add",
      target_list_ids: [listId],
      status: "confirmed",
    });

    console.log("bbbbbbbbbc", response.data);

    return response.data;
  } catch (err: any) {
    console.error(
      "Error adding subscriber to list:",
      err?.response?.data || err?.message
    );
    throw new Error(
      `Failed to add to list: ${err?.response?.data?.message || err?.message}`
    );
  }
}

/**
 * Upsert subscriber with conditional list assignment
 * @param email - Subscriber email
 * @param name - Subscriber name (optional)
 * @param listId - Specific list ID (if provided) or null for all lists
 */
export async function upsertSubscriber(
  email: string,
  name?: string | null,
  listId?: number | null
) {
  try {
    // Check if subscriber already exists
    const existingSubscriber = await getSubscriberByEmail(email);

    if (existingSubscriber) {
      if (listId) {
        await addSubscriberToList(existingSubscriber.id, listId);
      } else {
        const allLists = await getAllLists();
        for (const list of allLists) {
          try {
            await addSubscriberToList(existingSubscriber.id, list.id);
          } catch (err) {
            // Continue if subscriber already in this list
          }
        }
      }

      return existingSubscriber;
    } else {
      let listIds: number[] = [];

      if (listId) {
        listIds = [listId];
      } else {
        const allLists = await getAllLists();
        listIds = allLists.map((list: any) => list.id);
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
  } catch (err: any) {
    console.error("Listmonk error details:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });

    throw new Error(
      `Listmonk sync failed: ${err?.response?.data?.message || err?.message}`
    );
  }
}

export async function addToSpecificList(
  email: string,
  name?: string | null,
  listId?: number
) {
  return await upsertSubscriber(email, name, listId);
}

export async function addToAllLists(email: string, name?: string | null) {
  return await upsertSubscriber(email, name, null);
}
