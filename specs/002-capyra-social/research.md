# Research decisions — 2026-09-14

- Decision: preserve Wrangler + Docker local topology; user explicitly confirmed. Alternative all-container stack rejected as unnecessary runtime change.
- Decision: require brandId in all new analysis/upload clients, including CLI/MCP. User rejected fallback Brand. Existing rows stay nullable; no automatic attribution of old analyses.
- Decision: all accounts receive pilot limits, cycle anchor starts migration/provisioning UTC; no retroactive consumption. Manual additions only, no billing integration.
- Decision: invitation link, seven-day expiry, verified matching email before Firebase auto-provision. No email provider needed.
- Decision: real SocialProvider plus explicit local mock, never silent fallback. User will supply real credentials and validate later.
- Decision: identities must be natively verifiable; unknown identity and unsafe reconnection fail closed. TikTok documentation uses last handle to recognize reconnection; public SocialAccount schema does not guarantee stable native ID for TikTok/YouTube. Do not invent ID guarantees. Instagram Facebook selection exposes native ID before confirming. Temporary profile/move cannot guarantee atomic swap.
- Decision: one Zernio post per destination. Post idempotency uses x-request-id (~5 minutes); profile creation uses Idempotency-Key. Content-hash dedup is 24 hours. Store media URLs and reconcile ambiguous writes; no blind retry after external window.
- Decision: DELETE draft/scheduled provider post confirms cancellation; do not use unpublish. HTTP 207 needs per-destination result interpretation.
- Decision: provider validators alone do not inspect all duration/aspect/codec constraints. Python ffprobe/image probe without OpenAI supplies trusted metadata; combine baseline capabilities with remote account health/creator info before submission.
- Decision: provider presign upload URL lasts one hour, media seven days; handoff at T−6 days, streaming from private R2.
- Decision: import the available ninety-day history with pagination; unavailable data is not zero or a guarantee of complete history.

## Primary sources

- https://docs.zernio.com/api/openapi
- https://docs.zernio.com/connect/get-connect-url
- https://docs.zernio.com/connect/list-instagram-pages
- https://docs.zernio.com/platforms/tiktok
- https://docs.zernio.com/guides/idempotency
- https://docs.zernio.com/guides/media-uploads
- https://docs.zernio.com/guides/post-lifecycle
- https://docs.zernio.com/webhooks
- https://docs.zernio.com/analytics/get-analytics

No live authenticated provider calls were made. White label, OAuth identity guarantees and real formats remain pending practical validation.
