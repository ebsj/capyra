import {
  FIREBASE_PUBLIC_CONFIG_SCRIPT_ID,
  readFirebasePublicConfig,
  serializeFirebasePublicConfig,
} from "@/lib/firebase-public-config";

export function FirebasePublicConfigScript({ nonce }: { nonce?: string }) {
  const config = readFirebasePublicConfig(process.env);

  return (
    <script
      id={FIREBASE_PUBLIC_CONFIG_SCRIPT_ID}
      nonce={nonce}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeFirebasePublicConfig(config) }}
    />
  );
}
