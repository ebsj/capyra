import { createBrowserApiRequest } from "@/lib/http";
import type { NotificationContract, AuditEventContract } from "@/lib/models";
export type Notification = NotificationContract;
export type AuditEvent = AuditEventContract;
export function listNotifications(t: string, cursor?: string) {
  return createBrowserApiRequest(t)<{ items: Notification[]; nextCursor?: string }>(`/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
}
export function markNotificationRead(t: string, id: string) {
  return createBrowserApiRequest(t)(`/notifications/${id}/read`, { method: "POST" });
}
export function listAuditEvents(t: string, cursor?: string) {
  return createBrowserApiRequest(t)<{ items: AuditEvent[]; nextCursor?: string }>(`/audit-events${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
}
