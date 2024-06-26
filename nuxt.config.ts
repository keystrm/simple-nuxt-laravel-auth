// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ["./api"],

  runtimeConfig: {
    public: {
      baseUrl: "http://localhost:3000",
      homeUrl: "/dashboard",
      loginUrl: "/login",
      verificationUrl: "/verify-email",
    },
  },
});
