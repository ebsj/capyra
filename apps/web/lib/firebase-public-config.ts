export const FIREBASE_PUBLIC_CONFIG_SCRIPT_ID = "capyra-firebase-public-config";

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export function normalizeFirebasePublicConfig(
  config: Partial<Record<keyof FirebasePublicConfig, string | undefined>>,
): FirebasePublicConfig {
  return {
    apiKey: config.apiKey?.trim() ?? "",
    authDomain: config.authDomain?.trim() ?? "",
    projectId: config.projectId?.trim() ?? "",
    appId: config.appId?.trim() ?? "",
  };
}

export function readFirebasePublicConfig(
  env: Record<string, string | undefined>,
): FirebasePublicConfig {
  return normalizeFirebasePublicConfig({
    apiKey: env.CAPYRA_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: env.CAPYRA_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: env.CAPYRA_FIREBASE_PROJECT_ID?.trim() ?? "",
    appId: env.CAPYRA_FIREBASE_APP_ID?.trim() ?? "",
  });
}

export function serializeFirebasePublicConfig(config: FirebasePublicConfig) {
  return JSON.stringify(config)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
