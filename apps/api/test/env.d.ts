declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    STORAGE: R2Bucket;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
