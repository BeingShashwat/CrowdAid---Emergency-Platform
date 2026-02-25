param(
  [int]$Port = 8080,
  [switch]$KillExistingPortProcess
)

$ErrorActionPreference = "Stop"

if (-not $env:DB_URL) { $env:DB_URL = "jdbc:postgresql://localhost:5432/crowdaid" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "crowdaid_user" }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = "crowdaid_password" }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "change-me-to-a-very-long-random-secret-key-at-least-32-chars" }
if (-not $env:JWT_ACCESS_EXPIRATION_MINUTES) { $env:JWT_ACCESS_EXPIRATION_MINUTES = "15" }
if (-not $env:JWT_REFRESH_EXPIRATION_DAYS) { $env:JWT_REFRESH_EXPIRATION_DAYS = "14" }
if (-not $env:TWILIO_ENABLED) { $env:TWILIO_ENABLED = "false" }
if (-not $env:CORS_ALLOWED_ORIGINS) { $env:CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173" }

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  $portPid = $listener.OwningProcess
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $portPid" -ErrorAction SilentlyContinue
  $cmd = if ($proc) { $proc.CommandLine } else { "" }
  $isCrowdAidBackend = $cmd -like "*com.crowdaid.backend.BackendApplication*"

  if ($KillExistingPortProcess -or $isCrowdAidBackend) {
    Write-Host "Port $Port is in use by PID $portPid. Stopping it..."
    Stop-Process -Id $portPid -Force
    Start-Sleep -Seconds 1
  } else {
    Write-Error "Port $Port is already in use by PID $portPid. Re-run with -KillExistingPortProcess or choose another port with -Port."
    exit 1
  }
}

$env:PORT = "$Port"
Write-Host "Starting CrowdAid backend on port $env:PORT with DB_URL=$env:DB_URL and DB_USERNAME=$env:DB_USERNAME"
& "$PSScriptRoot\..\gradlew.bat" bootRun
