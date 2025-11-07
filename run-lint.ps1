<#
run-lint.ps1

Simple PowerShell helper to run the project's linters (runs from repo root).
It will `npm install` inside `app/` if node_modules are missing and then run `npm run lint`.

Usage:
  PS> .\run-lint.ps1
  PS> .\run-lint.ps1 -PackageDir 'app'
#>

[CmdletBinding()]
param(
    [string]$PackageDir = 'app'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
try {
    $RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    Push-Location $RepoRoot
    $pushedRepo = $true

    Write-Host "[run-lint] Repository root: $RepoRoot"

    $PkgPath = Join-Path $RepoRoot $PackageDir
    if (-not (Test-Path $PkgPath)) {
        Write-Error "[run-lint] Package directory not found: $PkgPath"
        if ($pushedRepo) { Pop-Location }
        exit 2
    }

    Push-Location $PkgPath
    $pushedPkg = $true

    Write-Host "[run-lint] Running linters in: $PkgPath"

    # Install deps if node_modules missing
    if (-not (Test-Path (Join-Path $PkgPath 'node_modules'))) {
        Write-Host "[run-lint] node_modules missing, running npm install..."
        # Use cmd.exe /c to invoke npm on Windows reliably
        $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm install' -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Error "[run-lint] npm install failed with exit code $($proc.ExitCode)"
            $exitCode = $proc.ExitCode
            return
        }
    }

    Write-Host "[run-lint] Executing: npm run lint"
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run lint' -NoNewWindow -Wait -PassThru
    $exitCode = $proc.ExitCode

    if ($exitCode -ne 0) {
        Write-Warning "[run-lint] 'npm run lint' failed with exit code $exitCode. Attempting to install missing helper packages and retry..."

        # Try to recover common missing modules (npm-run-all / shell-quote / oxlint binary) without modifying package.json
        Write-Host "[run-lint] Installing recovery packages (shell-quote, @oxlint/win32-x64) as a best-effort fix..."
        $repairProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm install --no-audit --no-fund shell-quote @oxlint/win32-x64 --no-save' -NoNewWindow -Wait -PassThru
        if ($repairProc.ExitCode -ne 0) {
            Write-Warning "[run-lint] Recovery npm install failed (exit $($repairProc.ExitCode)). Will try fallbacks anyway."
        } else {
            Write-Host "[run-lint] Recovery install succeeded; retrying 'npm run lint'..."
            $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run lint' -NoNewWindow -Wait -PassThru
            $exitCode = $proc.ExitCode
            if ($exitCode -eq 0) {
                Write-Host "[run-lint] 'npm run lint' succeeded after recovery install."
            }
        }

        if ($exitCode -ne 0) {
            Write-Warning "[run-lint] 'npm run lint' failed with exit code $exitCode. Trying sub-scripts directly as a fallback..."
        $combinedExit = 0

        Write-Host "[run-lint] Running: npm run lint:eslint"
        $p1 = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run lint:eslint' -NoNewWindow -Wait -PassThru
        if ($p1.ExitCode -ne 0) { $combinedExit = $p1.ExitCode }

        Write-Host "[run-lint] Running: npm run lint:oxlint"
        $p2 = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run lint:oxlint' -NoNewWindow -Wait -PassThru
        if ($p2.ExitCode -ne 0) {
            if ($combinedExit -eq 0) { $combinedExit = $p2.ExitCode }
        }

        $exitCode = $combinedExit
        if ($exitCode -eq 0) { Write-Host '[run-lint] Fallback linters passed.' }
        else { Write-Warning "[run-lint] Fallback linters failed (exit code $exitCode)." }
    }
}
 

    if ($exitCode -eq 0) {
        Write-Host '[run-lint] Lint passed.'
    } else {
        Write-Warning "[run-lint] Lint failed (exit code $exitCode)."
    }

} catch {
    Write-Host "[run-lint] Unexpected error:" -ForegroundColor Red
    # Print full exception details for debugging
    $_ | Format-List * -Force
    $exitCode = 3
} finally {
    if ($pushedPkg) { Pop-Location }
    if ($pushedRepo) { Pop-Location }
}

exit $exitCode
