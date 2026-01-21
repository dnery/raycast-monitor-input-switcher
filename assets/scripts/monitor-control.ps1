$ModulePath = Join-Path $PSScriptRoot "..\modules\MonitorConfig"
Import-Module $ModulePath -ErrorAction Stop

$monitorInfo = Get-Monitor
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not query monitor info!"
    exit
}

$logicalName = $monitorInfo.LogicalDisplay.DeviceName
$response = Get-MonitorVCPResponse -Monitor $logicalName -VCPCode 96 -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not query VCP response!"
    exit
}

$targetValue = 17
$currentValue = $response.CurrentValue
Write-Host "Setting $logicalName VCP code 60 from $currentValue to $targetValue in 3 seconds"

Start-Sleep -Seconds 3

# 60 is decimal but MonitorConfig expects bytes, which means 96
Set-MonitorVCPValue -Monitor $logicalName -VCPCode 96 -Value $targetValue

# If running in the console, wait for input before closing.
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "Press any key to continue..."
    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyUp") > $null
}
