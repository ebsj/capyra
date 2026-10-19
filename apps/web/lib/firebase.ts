"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type ActionCodeSettings,
} from "firebase/auth";

import { normalizeNextHref } from "@/lib/navigation";
import {
  FIREBASE_PUBLIC_CONFIG_SCRIPT_ID,
  normalizeFirebasePublicConfig,
  readFirebasePublicConfig,
  type FirebasePublicConfig,
} from "@/lib/firebase-public-config";

const PENDING_EMAIL_KEY = "capyra_firebase_email_for_sign_in";

type FirebaseClientConfig = FirebasePublicConfig;

declare global {
  interface Window {
    __CAPYRA_FIREBASE_PUBLIC_CONFIG__?: FirebasePublicConfig;
  }
}

function readFirebaseConfigFromDocument() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.__CAPYRA_FIREBASE_PUBLIC_CONFIG__) {
    return window.__CAPYRA_FIREBASE_PUBLIC_CONFIG__;
  }

  const element = window.document.getElementById(FIREBASE_PUBLIC_CONFIG_SCRIPT_ID);
  const rawConfig = element?.textContent?.trim();

  if (!rawConfig) {
    return null;
  }

  try {
    const config = normalizeFirebasePublicConfig(
      JSON.parse(rawConfig) as Partial<Record<keyof FirebasePublicConfig, string>>,
    );
    window.__CAPYRA_FIREBASE_PUBLIC_CONFIG__ = config;
    return config;
  } catch {
    return null;
  }
}

function readFirebaseConfig(): FirebaseClientConfig {
  const runtimeConfig = readFirebaseConfigFromDocument();
  const envConfig = readFirebasePublicConfig(process.env);
  const apiKey = runtimeConfig?.apiKey || envConfig.apiKey;
  const authDomain = runtimeConfig?.authDomain || envConfig.authDomain;
  const projectId = runtimeConfig?.projectId || envConfig.projectId;
  const appId = runtimeConfig?.appId || envConfig.appId;

  if (!apiKey || !projectId || !appId) {
    throw new Error(
      "Firebase client configuration is incomplete. Check CAPYRA_FIREBASE_API_KEY, CAPYRA_FIREBASE_PROJECT_ID and CAPYRA_FIREBASE_APP_ID.",
    );
  }

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    appId,
  };
}

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(readFirebaseConfig());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function savePendingFirebaseEmail(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function readPendingFirebaseEmail() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PENDING_EMAIL_KEY)?.trim();
  return value ? value : null;
}

export function clearPendingFirebaseEmail() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PENDING_EMAIL_KEY);
}

export function buildFirebaseEmailLinkUrl(nextHref: string) {
  if (typeof window === "undefined") {
    throw new Error("Firebase email links can only be created in the browser.");
  }

  const url = new URL("/login/confirm", window.location.origin);
  url.searchParams.set("next", normalizeNextHref(nextHref));
  return url.toString();
}

export async function sendFirebaseEmailLink(email: string, nextHref: string) {
  const auth = getFirebaseAuth();
  const actionCodeSettings: ActionCodeSettings = {
    url: buildFirebaseEmailLinkUrl(nextHref),
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
}

export function isFirebaseEmailLink(emailLink: string) {
  return isSignInWithEmailLink(getFirebaseAuth(), emailLink);
}

export async function signInWithFirebaseEmailLink(email: string, emailLink: string) {
  return signInWithEmailLink(getFirebaseAuth(), email.trim().toLowerCase(), emailLink);
}

export async function signInWithFirebaseGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(getFirebaseAuth(), provider);
}

export async function signOutFirebaseAuth() {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Logging out of the Capyra shell should still succeed if Firebase is unavailable.
  } finally {
    clearPendingFirebaseEmail();
  }
}
