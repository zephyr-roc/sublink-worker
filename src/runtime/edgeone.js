import { getStore } from '@edgeone/pages-blob';
import { EdgeOneBlobKVAdapter } from '../adapters/kv/edgeoneBlobKv.js';

function optionalSeconds(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function createEdgeOneRuntime(env = {}) {
    const store = getStore({
        name: env.EDGEONE_BLOB_STORE || 'sublink-worker',
        consistency: 'strong'
    });

    return {
        kv: new EdgeOneBlobKVAdapter(store),
        assetFetcher: null,
        logger: console,
        config: {
            configTtlSeconds: optionalSeconds(env.CONFIG_TTL_SECONDS) ?? 0,
            shortLinkTtlSeconds: optionalSeconds(env.SHORT_LINK_TTL_SECONDS)
        }
    };
}
