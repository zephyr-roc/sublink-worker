// Blob has no native TTL, so the expiration is stored with each value.
// Strong reads avoid returning stale links immediately after updates.
const STORAGE_PREFIX = 'kv/';

function storageKey(key) {
    return STORAGE_PREFIX + Buffer.from(key, 'utf8').toString('base64url');
}

export class EdgeOneBlobKVAdapter {
    constructor(store, { now = () => Date.now() } = {}) {
        this.store = store;
        this.now = now;
    }

    async get(key) {
        const text = await this.store.get(storageKey(key), {
            type: 'text',
            consistency: 'strong'
        });
        if (text === null || text === undefined) {
            return null;
        }

        const record = JSON.parse(text);
        if (record.expiresAt !== null && record.expiresAt <= this.now()) {
            return null;
        }
        return record.value;
    }

    async put(key, value, options = {}) {
        const ttl = Number(options.expirationTtl);
        const expiresAt = Number.isFinite(ttl) && ttl > 0
            ? this.now() + Math.ceil(ttl * 1000)
            : null;
        await this.store.set(storageKey(key), JSON.stringify({ value, expiresAt }));
    }

    async delete(key) {
        await this.store.delete(storageKey(key));
    }
}
