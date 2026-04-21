import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME_FAVORITE = 'favorites';
const OBJECT_STORE_NAME_PENDING = 'pending-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    db.createObjectStore(OBJECT_STORE_NAME_FAVORITE, { keyPath: 'id' });
    db.createObjectStore(OBJECT_STORE_NAME_PENDING, { keyPath: 'id', autoIncrement: true });
  },
});

const FavoriteStoryIdb = {
  async getStory(id) {
    if (!id) return null;
    return (await dbPromise).get(OBJECT_STORE_NAME_FAVORITE, id);
  },
  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME_FAVORITE);
  },
  async putStory(story) {
    if (!story.hasOwnProperty('id')) return null;
    return (await dbPromise).put(OBJECT_STORE_NAME_FAVORITE, story);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME_FAVORITE, id);
  },
};

const PendingStoryIdb = {
  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME_PENDING);
  },
  async addStory(story) {
    return (await dbPromise).add(OBJECT_STORE_NAME_PENDING, story);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME_PENDING, id);
  },
};

export { FavoriteStoryIdb, PendingStoryIdb };
