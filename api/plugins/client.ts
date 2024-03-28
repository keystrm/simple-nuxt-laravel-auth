import { type FetchOptions } from 'ofetch';

const SECURE_METHODS = new Set(['post', 'delete', 'put', 'patch']);

export default defineNuxtPlugin((nuxtApp) => {
    const event = useRequestEvent();
    const config = useRuntimeConfig();
    const user = useUser();
    const apiConfig = config.public.api;

    const httpOptions: FetchOptions = {
        baseURL: apiConfig.baseUrl,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
        retry: false,

        async onRequest({ options }) {
            if (process.server) {
                options.headers = buildServerHeaders(options.headers);
            }
        
            if (process.client) {
                const method = options.method?.toLocaleLowerCase() ?? '';
        
                if (!SECURE_METHODS.has(method)) {
                    return;
                }
        
                options.headers = await buildClientHeaders(options.headers);
            }
        },

        onResponse({ response }) {
            // TODO
        },

        onResponseError({ response }) {
            // TODO
        },
    };

    const client: any = $fetch.create(httpOptions);
});