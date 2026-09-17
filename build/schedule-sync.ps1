# Registers a Windows Task Scheduler job that runs sync-snappfood.js on a
# recurring interval and pushes any change to GitHub (so Pages picks it up).
#
# MUST be run on this PC (the one with an Iranian IP) — not through Claude
# Code's own tools, which sit on a different network path that snappfood.ir
# refuses. Run it yourself in a normal PowerShell window:
#
#   cd "D:\Projects\Levo\levo-kitchen"
#   powershell -ExecutionPolicy Bypass -File build\schedule-sync.ps1 -IntervalHours 3
#
# To remove it later:
#   powershell -ExecutionPolicy Bypass -File build\unschedule-sync.ps1

param(
  [int]$IntervalHours = 3
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  throw "node.exe پیدا نشد. Node.js را نصب کن یا مسیرش را به PATH اضافه کن."
}

$taskName = "LevoSnappfoodSync"
$scriptPath = Join-Path $repoRoot "build\sync-snappfood.js"

$action = New-ScheduledTaskAction `
  -Execute $nodeCmd.Source `
  -Argument ('"' + $scriptPath + '" --commit') `
  -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger `
  -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopOnIdleEnd `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
  -MultipleInstances IgnoreNew

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "هر $IntervalHours ساعت قیمت/موجودی نان‌های لوو را از اسنپ‌فود می‌خواند و در گیت‌هاب push می‌کند." | Out-Null

Write-Host "OK: تسک '$taskName' هر $IntervalHours ساعت اجرا می‌شود (فقط وقتی این کامپیوتر روشن و آنلاین است)."
Write-Host "برای اجرای فوری یک‌بار: Start-ScheduledTask -TaskName '$taskName'"
Write-Host "برای حذف: powershell -ExecutionPolicy Bypass -File build\unschedule-sync.ps1"
