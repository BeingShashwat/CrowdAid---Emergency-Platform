param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$required = @(
  "DB_URL",
  "DB_USERNAME",
  "DB_PASSWORD",
  "JWT_SECRET",
  "CORS_ALLOWED_ORIGINS",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_PHONE"
)

$missing = @()
foreach ($name in $required) {
  if (-not $env:$name) { $missing += $name }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing required env vars for prod profile: $($missing -join ', ')"
  exit 1
}

$env:SPRING_PROFILES_ACTIVE = "prod"
$env:PORT = "$Port"

Write-Host "Starting CrowdAid backend in PROD profile on port $env:PORT"
& "$PSScriptRoot\..\gradlew.bat" bootRun
