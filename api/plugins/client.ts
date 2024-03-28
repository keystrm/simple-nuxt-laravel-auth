import { type FetchOptions } from "ofetch";

const SECURE_METHODS = new Set(["post", "delete", "put", "patch"]);

export default defineNuxtPlugin((nuxtApp) => {
  const event = useRequestEvent();
  const config = useRuntimeConfig();
  const user = useUser();
  const apiConfig = config.public.api;

  const httpOptions: FetchOptions = {
    baseURL: apiConfig.baseUrl,
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    retry: false,

    async onRequest({ options }) {
      if (process.server) {
        options.headers = buildServerHeaders(options.headers);
      }

      if (process.client) {
        const method = options.method?.toLocaleLowerCase() ?? "";

        if (!SECURE_METHODS.has(method)) {
          return;
        }

        options.headers = await buildClientHeaders(options.headers);
      }
    },

    onResponse({ response }) {
      if (process.server) {
        const rawCookiesHeader = response.headers.get(
          apiConfig.serverCookieName
        );

        if (rawCookiesHeader === null) {
          return;
        }

        const cookies = splitCookiesString(rawCookiesHeader);

        for (const cookie of cookies) {
          appendHeader(event, apiConfig.serverCookieName, cookie);
        }
      }
    },

    onResponseError({ response }) {
      // TODO
    },
  };

  const client: any = $fetch.create(httpOptions);

  function buildServerHeaders(headers: HeadersInit | undefined): HeadersInit {
    const csrfToken = useCookie(apiConfig.csrfCookieName).value;
    const clientCookies = useRequestHeaders(["cookie"]);

    return {
      ...headers,
      ...(clientCookies.cookie && clientCookies),
      ...(csrfToken && { [apiConfig.csrfHeaderName]: csrfToken }),
      Referer: config.public.baseUrl,
    };
  }
  async function buildClientHeaders(
    headers: HeadersInit | undefined
  ): Promise<HeadersInit> {
    await $fetch(apiConfig.cookieRequestUrl, {
      baseURL: apiConfig.baseUrl,
      credentials: "include",
    });

    const csrfToken = useCookie(apiConfig.csrfCookieName).value;

    return {
      ...headers,
      ...(csrfToken && { [apiConfig.csrfHeaderName]: csrfToken }),
    };
  }
});
