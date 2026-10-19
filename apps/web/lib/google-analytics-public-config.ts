export const GOOGLE_ANALYTICS_PUBLIC_CONFIG_SCRIPT_ID =
  "capyra-google-analytics-public-config";

export type GoogleAnalyticsPublicConfig = {
  environment: string;
  measurementId: string;
  surface: "web";
};

export function readGoogleAnalyticsPublicConfig(
  env: Record<string, string | undefined>,
): GoogleAnalyticsPublicConfig {
  return {
    environment: env.CAPYRA_ENVIRONMENT?.trim() || env.NODE_ENV || "development",
    measurementId: env.CAPYRA_GA4_MEASUREMENT_ID?.trim() ?? "",
    surface: "web",
  };
}

export function serializeGoogleAnalyticsPublicConfig(
  config: GoogleAnalyticsPublicConfig,
) {
  return JSON.stringify(config)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
