<#
run-ci.ps1

簡単なローカルCIランナー（PowerShell）。リポジトリルートで実行してください。
なにをするか:
 1. CI用Dockerイメージをビルド（`Dockerfile.ci` を使用）
 2. ホストの `app/playwright-report` と `app/test-results` をコンテナにマウントしてテストを実行
 3. コンテナの終了コードをこのスクリプトの終了コードとして返す

使い方:
  PS> .\run-ci.ps1

オプション:
  -ImageName <name>  イメージ名の指定（デフォルト: sudoku-web:ci）
#>

[CmdletBinding()]
param(
  [string]$ImageName = 'sudoku-web:ci',
  [int]$Workers = 0,
  [string]$OnlyProject = 'Mobile Safari'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ルートディレクトリ（スクリプトが置かれている場所）
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $RepoRoot

Write-Host "[run-ci] Repository root: $RepoRoot"

# Build image
Write-Host "[run-ci] Building CI Docker image ($ImageName) using Dockerfile.ci..."
$buildCmd = @('build','-f','Dockerfile.ci','-t',$ImageName,'.')

# Enable BuildKit for cache mounts used in Dockerfile.ci
$env:DOCKER_BUILDKIT = '1'
$proc = Start-Process -FilePath docker -ArgumentList $buildCmd -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "[run-ci] docker build failed (exit $($proc.ExitCode))."
    Pop-Location
    exit $proc.ExitCode
}

# Prepare report directories on host so they can be mounted
$playwrightReport = Join-Path $RepoRoot 'app\playwright-report'
$testResults = Join-Path $RepoRoot 'app\test-results'
if (-not (Test-Path $playwrightReport)) { New-Item -ItemType Directory -Path $playwrightReport | Out-Null }
if (-not (Test-Path $testResults)) { New-Item -ItemType Directory -Path $testResults | Out-Null }

# Remove old report files for cleaner run (optional)
Write-Host "[run-ci] Cleaning old reports..."
Get-ChildItem -Path $playwrightReport -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $testResults -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Run container (mounting report dirs)
Write-Host "[run-ci] Running container and executing tests... (mounting reports to host)"

# Prepare argument list to avoid quoting/escaping issues on PowerShell
$workerValue = if ($Workers -gt 0) { $Workers } else { [Environment]::ProcessorCount }

 # Normalize project name to avoid spaces that can be split in docker args
 $envOnly = $OnlyProject -replace ' ', '_'

 $dockerArgs = @(
  'run',
  '--rm',
  '-e', 'CI=1',
  '-e', "PLAYWRIGHT_WORKERS=$workerValue",
  '-e', "PLAYWRIGHT_ONLY=$envOnly",
  '-v', "${playwrightReport}:/app/playwright-report",
  '-v', "${testResults}:/app/test-results",
  $ImageName
)

# Override container command: ensure browsers are installed then run tests
$dockerArgs += @('sh','-c','npx playwright install --with-deps && npm run test:e2e')

Write-Host "[run-ci] docker $($dockerArgs -join ' ')"

# Use Start-Process with an argument array so Docker receives properly-quoted args
$proc = Start-Process -FilePath docker -ArgumentList $dockerArgs -NoNewWindow -Wait -PassThru
$exitCode = $proc.ExitCode
 
if ($exitCode -eq 0) {
    Write-Host "[run-ci] Tests passed. Reports are available at:"
    Write-Host "  - Playwright report: $playwrightReport"
    Write-Host "  - Test results:      $testResults"
} else {
    Write-Warning "[run-ci] Tests failed (exit code $exitCode). Reports (if any) are at:"
    Write-Host "  - Playwright report: $playwrightReport"
    Write-Host "  - Test results:      $testResults"
}

Pop-Location
# Exit with the same code as the test container
exit $exitCode
