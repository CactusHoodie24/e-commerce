import { generateUUID } from "./generateUUID";


export const getOrCreateIdempotencyKey = (IDEMPOTENCY_STORAGE_KEY) => {
    try {
      const existing = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing);
        return parsed.key;
      }
      return generateUUID();
    } catch (e) {
      return generateUUID();
    }
  };