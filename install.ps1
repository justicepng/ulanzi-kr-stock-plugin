$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "com.krstock.deck.ticker.ulanziPlugin"
$targetDir = Join-Path $env:APPDATA "Ulanzi\UlanziDeck\Plugins"
$dest = Join-Path $targetDir "com.krstock.deck.ticker.ulanziPlugin"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}
if (Test-Path $dest) {
    Remove-Item -Path $dest -Recurse -Force
}
Copy-Item -Path $source -Destination $dest -Recurse -Force
Write-Host "Installed Ulanzi Studio plugin to: $dest" -ForegroundColor Green
Write-Host "Please restart Ulanzi Studio to load the plugin." -ForegroundColor Cyan
