import { type FetchOptions } from "ofetch";
import ApiError from "../models/ApiError";
import type { ApiServiceContainer } from "../services/ApiServiceContainer";
import ApplicationService from "../services/ApplicationService";
import AuthenticationService from "../services/AuthenticationService";

const SECURE_METHODS = new Set(["post", "delete", "put", "patch"]);
const UNAUTHENTICATED_STATUSES = new Set([401, 419]);
const UNVERIFIED_USER_STATUS = 409;
const VALIDATION_ERROR_STATUS = 422;

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

    async onResponseError({ response }) {
      if (
        apiConfig.redirectUnauthenticated &&
        UNAUTHENTICATED_STATUSES.has(response.status)
      ) {
        await navigateTo(config.public.loginUrl);

        return;
      }

      if (
        apiConfig.redirectUnverified &&
        response.status === UNVERIFIED_USER_STATUS
      ) {
        await navigateTo(config.public.verificationUrl);

        return;
      }

      if (response.status === VALIDATION_ERROR_STATUS) {
        throw new ApiError(response._data);
      }
    },
  };

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
  const client: any = $fetch.create(httpOptions);

  const api: ApiServiceContainer = {
    application: new ApplicationService(client),
    authentication: new AuthenticationService(client),
  };

});
