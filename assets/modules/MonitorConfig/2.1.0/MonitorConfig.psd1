@{
    RootModule             = "MonitorConfig.dll"
    ModuleVersion          = '2.1.0'
    CompatiblePSEditions   = @("Core", "Desktop")
    GUID                   = '552fa35c-0b32-42f6-858a-64d5ed0b05e6'
    Author                 = 'MartinGC94'
    CompanyName            = 'Unknown'
    Copyright              = '(c) 2023 MartinGC94. All rights reserved.'
    Description            = 'Manage brightness and other monitor settings with DDC/CI and WMI.'
    PowerShellVersion      = '5.1'
    FormatsToProcess       = @('MonitorConfigFormat.ps1xml')
    FunctionsToExport      = @()
    CmdletsToExport        = @('Get-MonitorBrightness','Get-MonitorColorSettings','Get-Monitor','Get-MonitorDetails','Get-MonitorVCPResponse','Reset-MonitorSettings','Save-MonitorSettings','Set-MonitorBrightness','Set-MonitorColorSettings','Set-MonitorVCPValue')
    VariablesToExport      = @()
    AliasesToExport        = @()
    DscResourcesToExport   = @()
    FileList               = @('MonitorConfig.deps.json','MonitorConfig.dll','MonitorConfig.psd1','MonitorConfigFormat.ps1xml','en-US\MonitorConfig.dll-Help.xml')
    PrivateData            = @{
        PSData = @{
             Tags         = @("Display", "Monitor", "Settings", "Options", "Configuration", "Config", "DDC", "DDC/CI", "MCCS", "Brightness", "Contrast")
             ProjectUri   = 'https://github.com/MartinGC94/MonitorConfig'
             ReleaseNotes = @'
2.1.0:
    Updated the errors to be more descriptive when failing to fetch monitors.
2.0:
    Added an argument transformer and argument completer to the "Monitor" parameter for all commands.
        This allows users to specify the monitors with the device name like: Set-MonitorBrightness -Monitor \\.\DISPLAY1 -Value 10
    Added position 0 to the Monitor parameter for all commands with that parameter.
        Other positional parameters have been bumped up by 1 as needed.
    Added position 0 to the DeviceName parameter for the Get-Monitor command.
1.0.3:
    Fix index out of bounds error for Get-Monitor when an attached monitor is disabled.
1.0.2:
    Remove ValidateRange attributes from the Value and ALSBrightness parameters of Set-MonitorBrightness.
    Don't throw when scanning for VCP features, unless the monitor handle is closed.
1.0.1:
    Add positions for various parameters.
1.0:
    Initial release.
'@
        }
    }
}
