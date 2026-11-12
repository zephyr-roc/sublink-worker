import { createApp } from '../app/createApp.jsx';
import { createEdgeOneRuntime } from './edgeone.js';

let app;

export async function onRequest(context) {
    try {
        if (!app) {
            // A warm Node function can reuse the app, but never in-memory storage.
            const runtime = createEdgeOneRuntime({
                ...process.env,
                ...context.env
            });
            app = createApp(runtime);
        }
        return await app.fetch(context.request);
    } catch (error) {
        console.error('EdgeOne Makers request failed', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
