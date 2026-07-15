<#
  Ogbaje — Firebase project setup (CLI-driven).

  Run this AFTER `firebase login` (see docs/SETUP.md). It:
    1. creates the Firebase project (or reuses it if it already exists),
    2. registers the Android app (com.ogbaje.app) and the Web app,
    3. writes OgbajeApp/google-services.json (Android config),
    4. writes dashboard/.env.local (Web config),
    5. sets .firebaserc so `firebase deploy` targets this project.

  It CANNOT toggle the Phone sign-in provider or enable Storage — those are
  console clicks (the script prints the exact links at the end).

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/setup-firebase.ps1 [-ProjectId ogbaje-app-1234]

  If -ProjectId is omitted a unique one is generated (project ids are global).
#>
param(
  [string]$ProjectId = "ogbaje-$(Get-Random -Minimum 100000 -Maximum 999999)",
  [string]$AndroidPackage = "com.ogbaje.app"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot   # .../Ogbaje
$appDir = Join-Path $root "OgbajeApp"
$dashDir = Join-Path $root "dashboard"

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# 0. sanity: authenticated?
Step "Checking Firebase login"
$who = firebase login:list 2>&1 | Out-String
if ($who -match "No authorized accounts" -or $who -match "not.*logged in") {
  Write-Error "Not logged in. Run `firebase login` first (see docs/SETUP.md), then re-run this script."
}
Write-Host $who.Trim()

# 1. create (or reuse) the project
Step "Creating project $ProjectId"
try {
  firebase projects:create $ProjectId --display-name "Ogbaje" 2>&1 | Write-Host
} catch {
  Write-Host "Create failed (may already exist) — continuing with $ProjectId" -ForegroundColor Yellow
}

# 2a. Android app
Step "Registering Android app ($AndroidPackage)"
$androidAppId = ""
$existing = firebase apps:list ANDROID --project $ProjectId 2>&1 | Out-String
if ($existing -match $AndroidPackage) {
  Write-Host "Android app already registered."
} else {
  firebase apps:create ANDROID "Ogbaje Android" --package-name $AndroidPackage --project $ProjectId 2>&1 | Write-Host
}
# resolve its appId
$androidJson = firebase apps:list ANDROID --project $ProjectId --json 2>$null | ConvertFrom-Json
$androidAppId = ($androidJson.result | Where-Object { $_.platform -eq "ANDROID" } | Select-Object -First 1).appId

# 2b. Web app
Step "Registering Web app"
$webJson = firebase apps:list WEB --project $ProjectId --json 2>$null | ConvertFrom-Json
if ($webJson.result -and $webJson.result.Count -gt 0) {
  Write-Host "Web app already registered."
} else {
  firebase apps:create WEB "Ogbaje Dashboard" --project $ProjectId 2>&1 | Write-Host
  $webJson = firebase apps:list WEB --project $ProjectId --json 2>$null | ConvertFrom-Json
}
$webAppId = ($webJson.result | Select-Object -First 1).appId

# 3. Android config -> OgbajeApp/google-services.json
Step "Writing OgbajeApp/google-services.json"
firebase apps:sdkconfig ANDROID $androidAppId --project $ProjectId --out (Join-Path $appDir "google-services.json")
Write-Host "Wrote $(Join-Path $appDir 'google-services.json')"

# 4. Web config -> dashboard/.env.local
Step "Writing dashboard/.env.local"
$webConfigRaw = firebase apps:sdkconfig WEB $webAppId --project $ProjectId 2>$null | Out-String
# extract the firebaseConfig JSON-ish block
$get = {
  param($key)
  if ($webConfigRaw -match "$key`"?\s*:\s*`"([^`"]+)`"") { return $Matches[1] } else { return "" }
}
$envLines = @(
  "VITE_FIREBASE_API_KEY=$(& $get 'apiKey')",
  "VITE_FIREBASE_AUTH_DOMAIN=$(& $get 'authDomain')",
  "VITE_FIREBASE_PROJECT_ID=$(& $get 'projectId')",
  "VITE_FIREBASE_STORAGE_BUCKET=$(& $get 'storageBucket')",
  "VITE_FIREBASE_MESSAGING_SENDER_ID=$(& $get 'messagingSenderId')",
  "VITE_FIREBASE_APP_ID=$(& $get 'appId')"
)
$envLines -join "`n" | Out-File -FilePath (Join-Path $dashDir ".env.local") -Encoding utf8
Write-Host "Wrote $(Join-Path $dashDir '.env.local')"

# 5. .firebaserc so `firebase deploy` targets this project
Step "Writing .firebaserc"
@{ projects = @{ default = $ProjectId } } | ConvertTo-Json | Out-File -FilePath (Join-Path $root ".firebaserc") -Encoding utf8

Step "DONE — remaining manual steps (console only)"
Write-Host @"
Project:  $ProjectId
Android:  $androidAppId
Web:      $webAppId

Two things the CLI cannot toggle — do these in the console, then you're ready:

1. Enable Phone sign-in:
   https://console.firebase.google.com/project/$ProjectId/authentication/providers
   -> Add new provider -> Phone -> Enable -> Save
   (optional: add a test phone number to demo without real SMS charges)

2. Enable Storage:
   https://console.firebase.google.com/project/$ProjectId/storage
   -> Get started -> (production mode) -> Done

Then deploy the security rules:
   firebase deploy --only firestore:rules,storage --project $ProjectId

And enable Firestore if the deploy says it's missing:
   https://console.firebase.google.com/project/$ProjectId/firestore
"@ -ForegroundColor Green
