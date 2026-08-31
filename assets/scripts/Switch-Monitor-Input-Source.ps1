if (Get-Command "ControlMyMonitor.exe" -ErrorAction SilentlyContinue) {
    $monitor = Get-WmiObject -Namespace root\wmi -Class WmiMonitorBasicDisplayParams
    $monitor.Active = $false
    $monitor.Put()
    Start-Sleep -Seconds 1
    $monitor.Active = $true
    $monitor.Put()
} else {
    Write-Error "ControlMyMonitor.exe not found in PATH"
}

# If running in the console, wait for input before closing.
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "Press any key to continue..."
    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyUp") > $null
}
