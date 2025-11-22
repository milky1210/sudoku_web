<#
docker-install-lock.ps1

Run npm install inside a transient Node container (Docker), produce/refresh
`app/package-lock.json`, and commit it to the repository.

Usage (run from repo root in PowerShell):
  .\docker-install-lock.ps1

Options:
  -Image (string)  Container image to use (default: node:20.18.1-bookworm-slim)
  -NoCommit        Don't automatically git add/commit the produced lockfile
#>

param(
    [string]$Image = 'node:20.18.1-bookworm-slim',
    [switch]$NoCommit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure script is run from repo root (script location)
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $RepoRoot

Write-Host "[install-lock] Repo root: $RepoRoot"

# Check Docker availability
try {
    $dockerVersion = & docker --version 2>$null
} catch {
    Write-Error "Docker is not available in PATH or not running. Please start Docker Desktop and try again."
    Pop-Location
    exit 2
}

# Ensure app path exists
$AppPath = Join-Path $RepoRoot 'app'
if (-not (Test-Path $AppPath)) {
    Write-Error "app/ directory not found at: $AppPath"
    Pop-Location
    exit 3
}

# Build the docker run command. Use a bind-mount so package-lock.json appears on host.
# Use sh -c to run npm install and ensure permission bits are fine.
$pwdPath = (Get-Item $RepoRoot).FullName
# Convert to Docker-friendly path on Windows if necessary (use PowerShell's native path and let Docker Desktop handle it)
$volArg = "${pwdPath.replace('\','/')}/app:/app"

Write-Host "[install-lock] Running npm install inside container $Image (this may take a minute)..."
$runArgs = @( 'run','--rm','-v', $volArg, '-w', '/app', $Image, 'sh','-c', 'npm install --no-audit --no-fund' )

# Start process and stream output
$proc = Start-Process -FilePath docker -ArgumentList $runArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput "docker_install_out.log" -RedirectStandardError "docker_install_err.log"
if ($proc.ExitCode -ne 0) {
    Write-Error "Docker npm install failed (exit $($proc.ExitCode)). See docker_install_err.log and docker_install_out.log"
    Get-Content docker_install_err.log -Tail 200 | Write-Host
    Pop-Location
    exit $proc.ExitCode
}

Write-Host "[install-lock] npm install finished in container."

# Check for package-lock.json
$lockFile = Join-Path $AppPath 'package-lock.json'
if (-not (Test-Path $lockFile)) {
    Write-Warning "package-lock.json was not created by npm install. Check the output logs (docker_install_out.log)."
} else {
    Write-Host "[install-lock] package-lock.json exists."
    if (-not $NoCommit) {
        Write-Host "[install-lock] Staging and committing package-lock.json"
        & git add "$lockFile"
        $status = & git status --porcelain "$lockFile"
        if ($status) {
            & git commit -m "chore: add/update package-lock.json (generated in container)" | Out-Null
            Write-Host "[install-lock] Committed package-lock.json"
        } else {
            Write-Host "[install-lock] package-lock.json unchanged; no commit necessary."
        }
    } else {
        Write-Host "[install-lock] Skipping commit (-NoCommit passed)."
    }
}

# Cleanup and exit
Pop-Location
Write-Host "[install-lock] Done."
exit 0
