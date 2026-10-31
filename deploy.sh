#!/usr/bin/env bash
# Deploy Mise to Cloud Run in an existing GCP project.
#
# Run from the repo root in Google Cloud Shell (already signed in):
#   ./deploy.sh
#
# Safe to re-run: every step checks before it creates. It only adds resources to
# the project below; it never creates or deletes a project.
#
# Overrides (optional): PROJECT_ID, REGION, SERVICE, GEMINI_API_KEY
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-pantrypal-ai-488608}"
REGION="${REGION:-asia-south1}"   # Mumbai
SERVICE="${SERVICE:-mise}"
SECRET_NAME="gemini-api-key"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33mWARNING: %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mERROR: %s\033[0m\n' "$*"; exit 1; }

[[ -f package.json && -f Dockerfile ]] || fail "Run this from the root of the Mise repo."
command -v gcloud >/dev/null || fail "gcloud is not installed. Use Google Cloud Shell."
command -v python3 >/dev/null || fail "python3 is required."

gcloud auth print-access-token >/dev/null 2>&1 || fail "Not signed in. Run: gcloud auth login"

say "Using existing project ${PROJECT_ID}"
gcloud projects describe "${PROJECT_ID}" --format='value(projectId)' >/dev/null \
  || fail "Can't access project ${PROJECT_ID}. Check the ID and that your account has Owner or Editor on it."
gcloud config set project "${PROJECT_ID}" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

say "Enabling required APIs (first run takes a minute)"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  --project "${PROJECT_ID}"

# ---- Gemini key in Secret Manager ----
say "Checking the Gemini API key secret"
if gcloud secrets describe "${SECRET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Secret '${SECRET_NAME}' already exists (to rotate: gcloud secrets versions add ${SECRET_NAME} --data-file=-)."
else
  if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    echo "Paste your Gemini API key (from https://aistudio.google.com/apikey). Input is hidden."
    read -r -s -p "Gemini API key: " GEMINI_API_KEY; echo
  fi
  [[ -n "${GEMINI_API_KEY}" ]] || fail "No Gemini API key given."
  printf '%s' "${GEMINI_API_KEY}" | gcloud secrets create "${SECRET_NAME}" \
    --project "${PROJECT_ID}" --replication-policy=automatic --data-file=-
  echo "Stored in Secret Manager as '${SECRET_NAME}'."
fi
unset GEMINI_API_KEY

say "Granting the Cloud Run service account access to the secret and to build from source"
gcloud secrets add-iam-policy-binding "${SECRET_NAME}" --project "${PROJECT_ID}" \
  --member "serviceAccount:${RUNTIME_SA}" --role roles/secretmanager.secretAccessor >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${RUNTIME_SA}" --role roles/run.builder --condition=None >/dev/null \
  || warn "Couldn't grant roles/run.builder to ${RUNTIME_SA}; the build may fail if your org restricts it."

# ---- Firebase web config (public values, baked into the app at build time) ----
say "Reading the Firebase web app config for Google sign-in"
TOKEN="$(gcloud auth print-access-token)"
api() { curl -fsS -H "Authorization: Bearer ${TOKEN}" -H "x-goog-user-project: ${PROJECT_ID}" "$@"; }

APP_ID="$(api "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps" 2>/dev/null \
  | python3 -c 'import sys,json; apps=json.load(sys.stdin).get("apps",[]); print(apps[0]["appId"] if apps else "")' 2>/dev/null || true)"

if [[ -n "${APP_ID}" ]]; then
  api "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps/${APP_ID}/config" | python3 -c '
import sys, json
c = json.load(sys.stdin)
keys = {"VITE_FIREBASE_API_KEY": "apiKey", "VITE_FIREBASE_AUTH_DOMAIN": "authDomain",
        "VITE_FIREBASE_PROJECT_ID": "projectId", "VITE_FIREBASE_STORAGE_BUCKET": "storageBucket",
        "VITE_FIREBASE_MESSAGING_SENDER_ID": "messagingSenderId", "VITE_FIREBASE_APP_ID": "appId"}
with open(".env.production", "w") as f:
    for env, k in keys.items():
        f.write(env + "=" + str(c.get(k) or "") + "\n")
'
  echo "Found Firebase web app ${APP_ID}; wrote .env.production."
else
  rm -f .env.production
  warn "No Firebase web app found in ${PROJECT_ID}. The app will deploy with the local mock sign-in."
  warn "To enable Google sign-in: Firebase console > Add app > Web, enable Google under Authentication, then re-run."
fi

# ---- Build and deploy ----
say "Building and deploying ${SERVICE} to Cloud Run in ${REGION} (about 3-5 minutes)"
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --allow-unauthenticated \
  --service-account "${RUNTIME_SA}" \
  --set-secrets "GEMINI_API_KEY=${SECRET_NAME}:latest" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --quiet

URL="$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"

# ---- Let Firebase Auth accept sign-ins from the Cloud Run address ----
if [[ -n "${APP_ID}" ]]; then
  say "Adding the Cloud Run address to Firebase Auth authorized domains"
  HOSTS="$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format=json \
    | python3 -c '
import sys, json
from urllib.parse import urlparse
s = json.load(sys.stdin)
urls = {s.get("status", {}).get("url", "")}
ann = s.get("metadata", {}).get("annotations", {}).get("run.googleapis.com/urls")
if ann:
    urls.update(json.loads(ann))
print(" ".join(sorted(urlparse(u).hostname for u in urls if u)))
')"
  CONFIG_URL="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config"
  BODY="$(api "${CONFIG_URL}" | HOSTS="${HOSTS}" python3 -c '
import sys, json, os
domains = json.load(sys.stdin).get("authorizedDomains", [])
for h in os.environ["HOSTS"].split():
    if h not in domains:
        domains.append(h)
print(json.dumps({"authorizedDomains": domains}))
')"
  if api -X PATCH -H "Content-Type: application/json" -d "${BODY}" "${CONFIG_URL}?updateMask=authorizedDomains" >/dev/null; then
    echo "Authorized: ${HOSTS}"
  else
    warn "Couldn't update authorized domains. Add these in Firebase console > Authentication > Settings: ${HOSTS}"
  fi
fi

say "Checking the deployment"
HEALTH="$(curl -fsS "${URL}/healthz" || true)"
echo "Health: ${HEALTH:-no response}"

printf '\n\033[1;32mMise is live: %s\033[0m\n' "${URL}"
echo "Logs: gcloud run services logs read ${SERVICE} --project ${PROJECT_ID} --region ${REGION} --limit 50"
