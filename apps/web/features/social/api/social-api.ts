import { createBrowserApiRequest } from "@/lib/http";
import type { Capabilities, SocialAccount, Publication, Destination, DestinationInput, Preflight, ExternalPost, Metric, Platform } from "../types/social";
export function listConnections(t: string, b: string) {
  return createBrowserApiRequest(t)<{ items: SocialAccount[] }>(`/brands/${b}/social-connections`);
}
export function connectSocial(t: string, b: string, platform: Platform, reconnectAccountId?: string) {
  return createBrowserApiRequest(t)<{ id: string; authorizationUrl: string; expiresAt: string }>(`/brands/${b}/social-connections`, {
    method: "POST",
    body: { platform, reconnectAccountId },
  });
}
export function disconnectSocial(t: string, id: string) {
  return createBrowserApiRequest(t)<SocialAccount>(`/social-connections/${id}/disconnect`, { method: "POST" });
}
export function getCapabilities(t: string, id: string) {
  return createBrowserApiRequest(t)<Capabilities>(`/social-connections/${id}/capabilities`);
}
export function listPublications(t: string, brandId: string, cursor?: string) {
  const q = new URLSearchParams({ brandId, limit: "30" });
  if (cursor) q.set("cursor", cursor);
  return createBrowserApiRequest(t)<{ items: Publication[]; nextCursor?: string }>(`/social-publications?${q}`);
}
export function createPublication(t: string, brandId: string, title: string) {
  return createBrowserApiRequest(t)<Publication>("/social-publications", { method: "POST", body: { brandId, title } });
}
export function getPublication(t: string, id: string) {
  return createBrowserApiRequest(t)<Publication>(`/social-publications/${id}`);
}
export function saveDestination(t: string, p: string, body: DestinationInput, id?: string) {
  return createBrowserApiRequest(t)<Destination>(`/social-publications/${p}/destinations${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body });
}
export function preflightDestination(t: string, p: string, id: string) {
  return createBrowserApiRequest(t)<Preflight>(`/social-publications/${p}/destinations/${id}/preflight`, { method: "POST" });
}
export function actOnDestination(
  t: string,
  p: string,
  id: string,
  action: "submit" | "cancel" | "retry",
  key: string,
  body?: { publishNow: boolean; localDateTime?: string }
) {
  return createBrowserApiRequest(t)<Destination>(`/social-publications/${p}/destinations/${id}/${action}`, {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body,
  });
}
export function listExternalPosts(t: string, brandId: string, cursor?: string) {
  const q = new URLSearchParams({ brandId, limit: "30" });
  if (cursor) q.set("cursor", cursor);
  return createBrowserApiRequest(t)<{ items: ExternalPost[]; nextCursor?: string }>(`/external-posts?${q}`);
}
export function listMetrics(t: string, brandId: string, cursor?: string) {
  const q = new URLSearchParams({ brandId, limit: "50" });
  if (cursor) q.set("cursor", cursor);
  return createBrowserApiRequest(t)<{ items: Metric[]; nextCursor?: string }>(`/social-metrics?${q}`);
}
export function importExternalPost(t: string, socialAccountId: string, url: string) {
  return createBrowserApiRequest(t)("/external-posts/import", { method: "POST", body: { socialAccountId, url } });
}
export function syncSocial(t: string, id: string) {
  return createBrowserApiRequest(t)(`/social-connections/${id}/sync`, { method: "POST" });
}
