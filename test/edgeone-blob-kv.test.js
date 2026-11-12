import test from 'node:test';
import assert from 'node:assert/strict';
import { EdgeOneBlobKVAdapter } from '../src/adapters/kv/edgeoneBlobKv.js';

function createStore() {
    const data = new Map();
    const reads = [];
    return {
        data,
        reads,
        async get(key, options) {
            reads.push({ key, options });
            return data.get(key) ?? null;
        },
        async set(key, value) {
            data.set(key, value);
        },
        async delete(key) {
            data.delete(key);
        }
    };
}

test('stores and retrieves strings using strongly consistent Blob reads', async () => {
    const store = createStore();
    const kv = new EdgeOneBlobKVAdapter(store);

    await kv.put('clash_abcd-12', 'config-data');
    assert.equal(await kv.get('clash_abcd-12'), 'config-data');
    assert.equal(store.reads[0].options.consistency, 'strong');
    assert.equal(store.data.size, 1);
});

test('keeps short links without expiration by default', async () => {
    const store = createStore();
    const kv = new EdgeOneBlobKVAdapter(store, { now: () => 1000 });

    await kv.put('permanent', 'query');
    kv.now = () => 999999999;
    assert.equal(await kv.get('permanent'), 'query');
});

test('honors expirationTtl without relying on in-memory timers', async () => {
    const store = createStore();
    let now = 1000;
    const kv = new EdgeOneBlobKVAdapter(store, { now: () => now });

    await kv.put('temporary', 'config', { expirationTtl: 30 });
    now = 30999;
    assert.equal(await kv.get('temporary'), 'config');
    now = 31000;
    assert.equal(await kv.get('temporary'), null);
});

test('deletes the correct key and returns null for absent objects', async () => {
    const store = createStore();
    const kv = new EdgeOneBlobKVAdapter(store);

    await kv.put('slash/中国', 'value');
    await kv.delete('slash/中国');
    assert.equal(await kv.get('slash/中国'), null);
});
