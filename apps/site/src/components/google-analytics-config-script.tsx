import {
  readGoogleAnalyticsPublicConfig,
  serializeGoogleAnalyticsPublicConfig
} from '@/lib/google-analytics-public-config';

function buildGoogleAnalyticsInitScript(measurementId: string) {
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){window.dataLayer.push(arguments);}',
    `gtag('consent', 'default', ${JSON.stringify({
      ad_personalization: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      analytics_storage: 'denied'
    })});`,
    'gtag("js", new Date());',
    `gtag('config', ${JSON.stringify(measurementId)}, ${JSON.stringify({
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: false
    })});`
  ].join('\n');
}

export function GoogleAnalyticsConfigScript({nonce}: {nonce?: string}) {
  const config = readGoogleAnalyticsPublicConfig(process.env);

  if (!config.measurementId) {
    return null;
  }

  return (
    <>
      <script
        id="capyra-google-analytics-public-config"
        nonce={nonce}
        type="application/json"
        dangerouslySetInnerHTML={{__html: serializeGoogleAnalyticsPublicConfig(config)}}
      />
      <script
        async
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`}
      />
      <script
        id="capyra-google-analytics-init"
        nonce={nonce}
        dangerouslySetInnerHTML={{__html: buildGoogleAnalyticsInitScript(config.measurementId)}}
      />
    </>
  );
}
