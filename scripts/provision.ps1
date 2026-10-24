#requires -Version 7.0

<#
.SYNOPSIS
  Brings a local test copy of Westray-Papa-Westray into line with GitHub after a pull: tools, dependencies, .env and database.
.DESCRIPTION
  Run from anywhere inside the repository, typically straight after repoRefresh or git pull.
  Every step is safe to repeat; each one checks first and changes only what is out of date.

    1. Node        meets the version in package.json (engines.node).
    2. Corepack    is 0.35 or later (installs 0.36.0) and enabled, so pnpm is the pinned version.
    3. Docker      is running, when the database is the local container. Offers to start Docker Desktop.
    4. Packages    pnpm install --frozen-lockfile.
    5. .env        is overwritten from .env.example. If the old file differed, it is kept as .env.previous.
    6. Database    the PostgreSQL container is started and healthy; migrations applied; seed data
                   loaded, overwriting seeded rows with the repository's versions.
    7. Checks      with -Check, the type check and tests.

  Anything that installs software, starts Docker Desktop or deletes data asks first, unless -Force.
.PARAMETER Status
  Report the state of every step and stop. Changes nothing.
.PARAMETER DryRun
  Show what each step would do. Changes nothing.
.PARAMETER Force
  Answer yes to every question. Does not skip any check.
.PARAMETER Check
  Also run pnpm typecheck and pnpm test (with DATABASE_URL from .env, so the database tests run).
.PARAMETER ResetData
  Delete the local database container and its data, then rebuild it from migrations and seed data.
.PARAMETER Help
  Display help without taking action.
.EXAMPLE
  ./scripts/provision.ps1 -Status
.EXAMPLE
  ./scripts/provision.ps1
.EXAMPLE
  ./scripts/provision.ps1 -Force -Check
.EXAMPLE
  ./scripts/provision.ps1 -ResetData
#>
[CmdletBinding(PositionalBinding = $false)]
param(
    [Alias('h')][switch]$Help,
    [switch]$Status,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Check,
    [switch]$ResetData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Help) { Get-Help $PSCommandPath -Detailed | Out-String -Width 120 | Write-Host; return }

# The corepack this repository needs: 0.35 is the first that runs pnpm 11 or later.
$CorepackMinimum = [version]'0.35.0'
$CorepackInstall = '0.36.0'

$ReportOnly = $Status -or $DryRun
$Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$Results = [Collections.Generic.List[object]]::new()
# Corepack asks before downloading pnpm; the question would stall a scripted run.
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'

function Add-Result([string]$Step, [string]$Result, [string]$Detail) {
    $Results.Add([pscustomobject][ordered]@{ Step = $Step; Result = $Result; Detail = $Detail })
    $colour = switch ($Result) { 'ok' { 'Green' } 'changed' { 'Cyan' } 'failed' { 'Red' } 'needs action' { 'Yellow' } default { 'Gray' } }
    Write-Host ("{0,-10} {1,-14} {2}" -f $Step, $Result, $Detail) -ForegroundColor $colour
}

function Write-Step([string]$Text) { Write-Host "`n== $Text" -ForegroundColor Cyan }

# Runs a command, streaming its output; throws when it fails.
function Invoke-Tool([string]$File, [string[]]$Arguments) {
    Write-Host "> $File $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$File $($Arguments -join ' ') failed with exit code $LASTEXITCODE." }
}

# Runs a command quietly and returns its first line of output, or $null if it fails or is missing.
function Get-ToolOutput([string]$File, [string[]]$Arguments) {
    if (-not (Get-Command $File -ErrorAction SilentlyContinue)) { return $null }
    $output = & $File @Arguments 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $output) { return $null }
    return "$(@($output)[0])".Trim()
}

function Get-Version([string]$Text) {
    if ($Text -match '(\d+)\.(\d+)\.(\d+)') { return [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])" }
    return $null
}

function Confirm-Action([string]$Question) {
    if ($Force) { return $true }
    $answer = Read-Host "$Question [y/N]"
    return $answer -match '^(y|yes)$'
}

# KEY=value lines of an env file, in order; comments and blank lines are skipped.
function Read-EnvFile([string]$Path) {
    $settings = [ordered]@{}
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') { $settings[$Matches[1]] = $Matches[2].Trim() }
    }
    return $settings
}

$package = Get-Content -LiteralPath (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
$scripts = $package.scripts.PSObject.Properties.Name
Push-Location -LiteralPath $Root
try {
    Write-Host "Provisioning $Root$(if ($Status) { ' (status only)' } elseif ($DryRun) { ' (dry run)' })" -ForegroundColor Cyan

    # 1. Node ----------------------------------------------------------------
    Write-Step 'Node'
    $nodeRequired = Get-Version "$($package.engines.node)"
    $nodeVersion = Get-Version (Get-ToolOutput 'node' @('--version'))
    if (-not $nodeVersion) {
        Add-Result 'Node' 'failed' "Node is not installed; install $nodeRequired or later (fnm install $nodeRequired)."
        throw 'Node is required.'
    }
    if ($nodeRequired -and $nodeVersion -lt $nodeRequired) {
        Add-Result 'Node' 'failed' "Node $nodeVersion is older than $nodeRequired; run fnm install $nodeRequired, then fnm use $nodeRequired."
        throw 'Node is too old.'
    }
    Add-Result 'Node' 'ok' "$nodeVersion (needs $nodeRequired or later)"

    # 2. Corepack and pnpm ---------------------------------------------------
    Write-Step 'Corepack and pnpm'
    $pnpmPinned = if ("$($package.packageManager)" -match '^pnpm@([^+]+)') { $Matches[1] } else { $null }
    $corepackVersion = Get-Version (Get-ToolOutput 'corepack' @('--version'))
    if (-not $corepackVersion -or $corepackVersion -lt $CorepackMinimum) {
        $found = if ($corepackVersion) { "corepack $corepackVersion is too old to run pnpm $pnpmPinned" } else { 'corepack is not installed' }
        if ($ReportOnly) {
            Add-Result 'Corepack' 'needs action' "$found; would install corepack@$CorepackInstall."
        }
        elseif (Confirm-Action "$found. Install corepack@$CorepackInstall globally with npm?") {
            Invoke-Tool 'npm' @('install', '--global', "corepack@$CorepackInstall")
            $corepackVersion = Get-Version (Get-ToolOutput 'corepack' @('--version'))
            if (-not $corepackVersion -or $corepackVersion -lt $CorepackMinimum) {
                $all = @(Get-Command corepack -All -ErrorAction SilentlyContinue | ForEach-Object Source) -join '; '
                Add-Result 'Corepack' 'failed' "Installed, but an older corepack comes first on PATH ($all). Run corepack disable with the old one, or remove it from PATH, then run this again."
                throw 'Corepack could not be upgraded.'
            }
            Add-Result 'Corepack' 'changed' "Installed $corepackVersion"
        }
        else {
            Add-Result 'Corepack' 'failed' "$found; install it with npm install --global corepack@$CorepackInstall."
            throw 'Corepack is required.'
        }
    }
    else {
        Add-Result 'Corepack' 'ok' "$corepackVersion (needs $CorepackMinimum or later)"
    }

    $pnpmVersion = Get-ToolOutput 'pnpm' @('--version')
    if ($pnpmVersion -ne $pnpmPinned) {
        $found = if ($pnpmVersion) { "pnpm is $pnpmVersion, not the pinned $pnpmPinned" } else { 'pnpm is not available' }
        if ($ReportOnly) {
            Add-Result 'pnpm' 'needs action' "$found; would run corepack enable."
        }
        else {
            Invoke-Tool 'corepack' @('enable')
            $pnpmVersion = Get-ToolOutput 'pnpm' @('--version')
            if ($pnpmVersion -ne $pnpmPinned) {
                $all = @(Get-Command pnpm -All -ErrorAction SilentlyContinue | ForEach-Object Source) -join '; '
                Add-Result 'pnpm' 'failed' "Still $pnpmVersion after corepack enable: another pnpm comes first on PATH ($all). Remove it, or on Windows run corepack enable from an administrator terminal."
                throw 'pnpm is not the pinned version.'
            }
            Add-Result 'pnpm' 'changed' "Enabled through corepack: $pnpmVersion"
        }
    }
    else {
        Add-Result 'pnpm' 'ok' "$pnpmVersion, as package.json pins"
    }

    # 3 and 5 come before the database: .env says whether the database is the local container.
    # 5. .env ---------------------------------------------------------------
    # .env is always rewritten from .env.example, so it matches the commit just pulled.
    # A previous .env that differed is kept as .env.previous.
    Write-Step '.env'
    $envPath = Join-Path $Root '.env'
    $examplePath = Join-Path $Root '.env.example'
    $previousPath = Join-Path $Root '.env.previous'
    $same = (Test-Path -LiteralPath $envPath) -and
        (Get-FileHash -LiteralPath $envPath).Hash -eq (Get-FileHash -LiteralPath $examplePath).Hash
    if ($same) {
        Add-Result '.env' 'ok' 'Already matches .env.example'
    }
    elseif ($ReportOnly) {
        Add-Result '.env' 'needs action' $(if (Test-Path -LiteralPath $envPath) { 'Differs from .env.example; would overwrite it (old copy kept as .env.previous).' } else { 'Missing; would create it from .env.example.' })
    }
    else {
        $detail = 'Written from .env.example'
        if (Test-Path -LiteralPath $envPath) {
            Copy-Item -LiteralPath $envPath -Destination $previousPath -Force
            $detail += '; the old file is .env.previous'
        }
        Copy-Item -LiteralPath $examplePath -Destination $envPath -Force
        Add-Result '.env' 'changed' $detail
    }
    # .env becomes .env.example, so the example decides, even in a report.
    $databaseUrl = "$((Read-EnvFile $examplePath)['DATABASE_URL'])".Trim('"', "'")
    $useContainer = (Test-Path -LiteralPath (Join-Path $Root 'compose.yaml')) -and $databaseUrl -match '@(localhost|127\.0\.0\.1)(:5432)?/'

    # 3. Docker --------------------------------------------------------------
    Write-Step 'Docker'
    if (-not $useContainer) {
        Add-Result 'Docker' 'skipped' 'DATABASE_URL is not the local container, so Docker is not needed.'
    }
    elseif (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Add-Result 'Docker' 'failed' 'Docker is not installed; install Docker Desktop: https://docs.docker.com/get-started/get-docker/'
        if (-not $ReportOnly) { throw 'Docker is required for the local database.' }
    }
    else {
        $null = & docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Add-Result 'Docker' 'ok' "Running (Compose $(Get-ToolOutput 'docker' @('compose', 'version', '--short')))"
        }
        else {
            $desktop = if ($IsWindows) { Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe' } else { $null }
            $canStart = $desktop -and (Test-Path -LiteralPath $desktop)
            if ($ReportOnly) {
                Add-Result 'Docker' 'needs action' $(if ($canStart) { 'Not running; would start Docker Desktop.' } else { 'Not running; start Docker.' })
            }
            elseif ($canStart -and (Confirm-Action 'Docker is not running. Start Docker Desktop?')) {
                Start-Process -FilePath $desktop
                Write-Host 'Waiting for Docker to start (up to 3 minutes)...'
                $deadline = (Get-Date).AddMinutes(3)
                do {
                    Start-Sleep -Seconds 3
                    $null = & docker info 2>$null
                } until ($LASTEXITCODE -eq 0 -or (Get-Date) -gt $deadline)
                if ($LASTEXITCODE -ne 0) {
                    Add-Result 'Docker' 'failed' 'Docker Desktop did not become ready within 3 minutes; check it, then run this again.'
                    throw 'Docker is not running.'
                }
                Add-Result 'Docker' 'changed' 'Started Docker Desktop'
            }
            else {
                Add-Result 'Docker' 'failed' 'Docker is not running; start Docker Desktop, then run this again.'
                throw 'Docker is not running.'
            }
        }
    }

    # 4. Packages ------------------------------------------------------------
    Write-Step 'Packages'
    if ($ReportOnly) {
        $installed = Test-Path -LiteralPath (Join-Path $Root 'node_modules/.modules.yaml')
        Add-Result 'Packages' 'needs action' $(if ($installed) { 'Installed; would run pnpm install --frozen-lockfile to match the lockfile.' } else { 'Not installed; would run pnpm install --frozen-lockfile.' })
    }
    else {
        Invoke-Tool 'pnpm' @('install', '--frozen-lockfile')
        Add-Result 'Packages' 'ok' 'Match pnpm-lock.yaml'
    }

    # 6. Database ------------------------------------------------------------
    Write-Step 'Database'
    if ($useContainer) {
        if ($ResetData) {
            if ($ReportOnly) {
                Add-Result 'Database' 'needs action' 'Would delete the local database and its data, then rebuild it.'
            }
            elseif (Confirm-Action 'Delete the local database and ALL its data, then rebuild it?') {
                Invoke-Tool 'docker' @('compose', 'down', '--volumes')
                Add-Result 'Database' 'changed' 'Deleted the local database and its data'
            }
            else {
                Add-Result 'Database' 'skipped' 'Reset declined; the data is unchanged.'
            }
        }
        if ($ReportOnly) {
            $running = Get-ToolOutput 'docker' @('compose', 'ps', '--status', 'running', '--services')
            Add-Result 'Database' $(if ($running) { 'ok' } else { 'needs action' }) $(if ($running) { 'The container is running.' } else { 'Would start the container (pnpm db:up) and wait until it is healthy.' })
        }
        else {
            # --wait returns once the container's health check passes.
            Invoke-Tool 'docker' @('compose', 'up', '--detach', '--wait', 'postgres')
            Add-Result 'Database' 'ok' 'The container is running and healthy'
        }
    }
    else {
        Add-Result 'Database' 'skipped' 'Not the local container; make sure the database in DATABASE_URL is running.'
    }

    foreach ($step in @(
            @{ Name = 'Migrations'; Script = 'db:migrate'; Arguments = @() }
            # A test copy matches GitHub, so seeded rows are overwritten with the repository's versions.
            @{ Name = 'Seed data'; Script = 'db:seed'; Arguments = @('--update') }
        )) {
        if ($scripts -notcontains $step.Script) { continue }
        if ($ReportOnly) {
            Add-Result $step.Name 'needs action' "Would run pnpm $($step.Script) $($step.Arguments -join ' ')".TrimEnd()
        }
        else {
            Invoke-Tool 'pnpm' (@($step.Script) + $step.Arguments)
            Add-Result $step.Name 'ok' "pnpm $($step.Script) $($step.Arguments -join ' ')".TrimEnd()
        }
    }

    # 7. Checks --------------------------------------------------------------
    if ($Check) {
        Write-Step 'Checks'
        if ($ReportOnly) {
            Add-Result 'Checks' 'needs action' 'Would run pnpm typecheck and pnpm test.'
        }
        else {
            Invoke-Tool 'pnpm' @('typecheck')
            # Tests do not read .env; passing DATABASE_URL includes the database tests.
            $previous = $env:DATABASE_URL
            $env:DATABASE_URL = $databaseUrl
            try { Invoke-Tool 'pnpm' @('test') }
            finally { $env:DATABASE_URL = $previous }
            Add-Result 'Checks' 'ok' 'Type check and tests passed'
        }
    }
}
catch {
    Write-Host "`nStopped: $($_.Exception.Message)" -ForegroundColor Red
    $failed = $true
}
finally {
    Pop-Location
    Write-Host "`nSummary" -ForegroundColor Cyan
    $Results | Format-Table -AutoSize -Wrap | Out-String -Width 200 | Write-Host
    if ($Status) { Write-Host 'STATUS: nothing has been changed.' -ForegroundColor Cyan }
    elseif ($DryRun) { Write-Host 'DRY RUN: nothing has been changed.' -ForegroundColor Cyan }
    elseif (-not (Get-Variable failed -ErrorAction SilentlyContinue)) { Write-Host 'Ready: run pnpm dev and open http://localhost:3000' -ForegroundColor Green }
}
if (Get-Variable failed -ErrorAction SilentlyContinue) { exit 1 }
