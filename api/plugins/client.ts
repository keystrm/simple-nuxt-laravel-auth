export default defineNuxtPlugin((nuxtApp) => {
    const event = useRequestEvent();
    const config = useRuntimeConfig();
    const user = useUser();
    const apiConfig = config.public.api;
});