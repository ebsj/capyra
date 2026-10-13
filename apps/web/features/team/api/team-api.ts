import { createBrowserApiRequest } from "@/lib/http";
import type { AccountUserResponseContract, MemberInvitationContract, MemberInvitationCreateResponseContract } from "@/lib/models";
export type Member = AccountUserResponseContract;
export type Invitation = MemberInvitationContract;
export function listTeam(token: string) {
  const api = createBrowserApiRequest(token);
  return Promise.all([api<{ items: Member[] }>("/members"), api<{ items: Invitation[] }>("/member-invitations")]);
}
export function inviteMember(token: string, email: string) {
  return createBrowserApiRequest(token)<MemberInvitationCreateResponseContract>("/member-invitations", { method: "POST", body: { email } });
}
export function removeMember(token: string, id: string, invitation = false) {
  return createBrowserApiRequest(token)(`/${invitation ? "member-invitations" : "members"}/${id}`, { method: "DELETE" });
}
export function acceptInvitation(token: string, invitationToken: string) {
  return createBrowserApiRequest(token)("/member-invitations/accept", { method: "POST", body: { token: invitationToken } });
}
