import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
const root = new URL("../../apps/web/", import.meta.url);
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) return {url:new URL(`${specifier.slice(2)}.ts`,root).href,shortCircuit:true};
    if (specifier.startsWith(".") && context.parentURL?.startsWith(root.href) && !specifier.endsWith(".ts")) return {url:new URL(`${specifier}.ts`,context.parentURL).href,shortCircuit:true};
    return next(specifier,context);
  },
  load(url,context,next) {if(url.startsWith(root.href)&&url.endsWith(".ts"))return {format:"module",source:stripTypeScriptTypes(readFileSync(new URL(url),"utf8")),shortCircuit:true};return next(url,context);}
});
after(()=>hooks.deregister());
const {createBrowserApiRequest,ApiError}=await import(new URL("lib/http.ts",root));
const {actOnDestination,saveDestination}=await import(new URL("features/social/api/social-api.ts",root));
const {invitationTokenFromNext}=await import(new URL("features/auth/utils/invitation-token.ts",root));
const {canCancel,canEdit,metricIsStale}=await import(new URL("features/social/utils/state.ts",root));
const {saveBrand}=await import(new URL("features/brands/api/brands-api.ts",root));

test("brand creation omits the update-only confirmation field supplied by the form",async(t)=>{
 const form={name:"New Brand",timeZone:"America/Recife",confirmed:true};
 const created={id:"new-brand",name:form.name,timeZone:form.timeZone,confirmedAt:"2026-10-19T00:00:00Z",status:"active"};
 t.mock.method(globalThis,"fetch",async(url,init)=>{
  assert.equal(url,"/api/v1/brands");assert.equal(init.method,"POST");
  assert.deepEqual(JSON.parse(init.body),{name:form.name,timeZone:form.timeZone});
  return Response.json(created,{status:201});
 });
 assert.deepEqual(await saveBrand("token",form),created);
});

test("brand editing preserves explicit confirmation in the update payload",async(t)=>{
 const form={name:"Updated Brand",timeZone:"UTC",confirmed:true};
 t.mock.method(globalThis,"fetch",async(url,init)=>{
  assert.equal(url,"/api/v1/brands/existing-brand");assert.equal(init.method,"PATCH");
  assert.deepEqual(JSON.parse(init.body),form);
  return Response.json({...form,id:"existing-brand"});
 });
 const saved=await saveBrand("token",form,"existing-brand");assert.equal(saved.name,form.name);
});

test("owner-only 403 remains an actionable error without destroying a valid session",async(t)=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 const redirects=[];globalThis.window={location:{pathname:"/team",assign:url=>redirects.push(url)}};globalThis.document={cookie:"capyra_session=valid"};
 try {t.mock.method(globalThis,"fetch",async()=>Response.json({code:"owner_required",message:"Owner required"},{status:403}));
 await assert.rejects(createBrowserApiRequest("valid")("/members"),e=>e instanceof ApiError&&e.code==="owner_required");
 assert.deepEqual(redirects,[]);assert.equal(globalThis.document.cookie,"capyra_session=valid");
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;}
});

test("destination submission preserves the same idempotency key across an uncertain transport retry",async(t)=>{
 const requests=[];t.mock.method(globalThis,"fetch",async(url,init)=>{requests.push({url,init});if(requests.length===1)throw new TypeError("network interrupted");return Response.json({id:"destination",status:"scheduled"});});
 const body={publishNow:false,localDateTime:"2026-11-01T01:30"};
 await assert.rejects(actOnDestination("token","publication","destination","submit","stable-request",body),TypeError);
 await actOnDestination("token","publication","destination","submit","stable-request",body);
 assert.equal(requests.length,2);
 for(const {url,init} of requests){assert.equal(url,"/api/v1/social-publications/publication/destinations/destination/submit");assert.equal(init.headers["Idempotency-Key"],"stable-request");assert.deepEqual(JSON.parse(init.body),body);}
});

test("destination variation preserves explicit consent, ordered media and optional analysis link",async(t)=>{
 const draft={socialAccountId:"tiktok-id",format:"photo_carousel",content:"Text",mediaAssetIds:["second","first"],analysisId:"analysis",settings:{privacyLevel:"PUBLIC_TO_EVERYONE",previewConfirmed:true,expressConsentGiven:true,allowComment:false}};
 t.mock.method(globalThis,"fetch",async(url,init)=>{assert.equal(url,"/api/v1/social-publications/pub/destinations");assert.deepEqual(JSON.parse(init.body),draft);return Response.json({...draft,id:"dest"});});
 const result=await saveDestination("token","pub",draft);assert.equal(result.settings.allowComment,false);assert.deepEqual(result.mediaAssetIds,["second","first"]);
});

test("invitation token is obtained only from a local acceptance destination",()=>{
 assert.equal(invitationTokenFromNext("/en/invitations/accept?token=opaque"),"opaque");
 assert.equal(invitationTokenFromNext("//other.example/invitations/accept?token=opaque"),undefined);
 assert.equal(invitationTokenFromNext("/dashboard?token=opaque"),undefined);
 assert.equal(invitationTokenFromNext("/invitations/accept"),undefined);
});

test("publication actions preserve unknown and terminal states; metric freshness has an exact boundary",()=>{
 for(const state of ["unknown","scheduled","publishing","published","cancellation_requested"]){assert.equal(canEdit(state),false);}
 for(const state of ["published","publishing","cancelled","cancellation_requested"]){assert.equal(canCancel(state),false);}
 assert.equal(canEdit("cancelled"),true);assert.equal(canCancel("scheduled"),true);
 const observed="2026-09-14T00:00:00Z";const date=Date.parse(observed);
 assert.equal(metricIsStale(observed,date+48*3600000),false);assert.equal(metricIsStale(observed,date+48*3600000+1),true);
});
