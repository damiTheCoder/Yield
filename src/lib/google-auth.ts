import type { AuthUser } from "@/lib/app-state";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
          callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function preloadGoogleAuth() {
  void loadGoogleIdentityScript();
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google login is only available in the browser."));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google login.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google login."));
    document.head.appendChild(script);
  });
}

async function fetchGoogleUser(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to read your Google profile.");
  }

  return (await response.json()) as GoogleUserInfo;
}

export async function signInWithGooglePopup(): Promise<AuthUser> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID. Add your Google Web OAuth client ID to .env.");
  }

  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google login is unavailable right now.");
  }

  const token = await new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.access_token) {
          reject(new Error("Google did not return an access token."));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || error.type || "Google sign-in was cancelled."));
      },
    });

    client.requestAccessToken();
  });

  const profile = await fetchGoogleUser(token);

  return {
    id: profile.sub,
    name: profile.name || profile.email || "Google User",
    email: profile.email || "",
    avatar: profile.picture || "",
    provider: "google",
  };
}
