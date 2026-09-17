# Removes the scheduled task created by schedule-sync.ps1.
$ErrorActionPreference = "Stop"
$taskName = "LevoSnappfoodSync"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "OK: تسک '$taskName' حذف شد (اگر وجود داشت)."
