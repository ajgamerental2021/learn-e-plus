const FALLBACK_VAPID_PUBLIC_KEY = "BHM1fQC3ksoGAsHoO0y6MSkDIjRgXGFNLxF587rB1DzzGgR9t3wrWFU9J1QdD3djmtT-FfAyqIrdDPq9GZFA2fM";
const FALLBACK_VAPID_PRIVATE_KEY = "tL5iZos8t6HYo23Abc3Tvx-q833UvxKqlRTrh5yNf9Y";

export function getVapidPublicKey() {
  return validKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) || FALLBACK_VAPID_PUBLIC_KEY;
}

export function getVapidPrivateKey() {
  return validKey(process.env.VAPID_PRIVATE_KEY) || FALLBACK_VAPID_PRIVATE_KEY;
}

export function getVapidSubject() {
  return process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || "mailto:admin@learneplus.local";
}

function validKey(value: string | undefined) {
  if (!value || value === "placeholder") return "";
  return value;
}
