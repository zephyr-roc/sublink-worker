import { handleEdgeOneRequest } from './_shared/app.mjs';

// Makers uses [[default]] to match all non-root application routes.
export function onRequest(context) {
    return handleEdgeOneRequest(context);
}
