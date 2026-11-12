import { onRequest as handleRequest } from './_shared/app.mjs';

// The root must be registered separately from the catch-all route.
export function onRequest(context) {
    return handleRequest(context);
}
