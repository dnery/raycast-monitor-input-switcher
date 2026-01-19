/**
 * Raycast command: Discover DDC/CI input codes.
 *
 * Reads current input value and displays available DDC/CI information.
 * Useful for determining correct input codes for your specific monitor.
 */

import { Detail, getPreferenceValues } from "@raycast/api";
import { discoverInputs } from "./lib/ddc";
import { detectPlatform } from "./lib/platform";

interface Preferences {
  displayportValue: string;
  hdmiValue: string;
  controlMyMonitorPath: string;
  monitorId: string;
}

export default function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const platform = detectPlatform();

  // Build platform info section
  const platformInfo = [
    "## Platform Information",
    "",
    `- **OS**: ${platform.os}`,
    platform.os === "darwin" ? `- **Apple Silicon**: ${platform.isAppleSilicon ? "Yes" : "No"}` : "",
    platform.os === "darwin" ? `- **Chip Generation**: ${platform.appleChipGen}` : "",
    platform.os === "darwin"
      ? `- **Built-in HDMI Supported**: ${platform.m1ddcSupportsBuiltinHdmi ? "Yes (M2+)" : "No (M1 or Intel)"}`
      : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  // Build current config section
  const configInfo = [
    "## Current Configuration",
    "",
    `- **DisplayPort Value**: ${prefs.displayportValue}`,
    `- **HDMI Value**: ${prefs.hdmiValue}`,
    platform.os === "win32" ? `- **ControlMyMonitor Path**: ${prefs.controlMyMonitorPath || "(not set)"}` : "",
    platform.os === "win32" ? `- **Monitor ID**: ${prefs.monitorId || "Primary"}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  // Attempt discovery
  const discovery = discoverInputs(
    prefs.controlMyMonitorPath || undefined,
    prefs.monitorId || "Primary"
  );

  let discoverySection: string;
  if (discovery.success) {
    discoverySection = [
      "## Discovery Results",
      "",
      discovery.currentValue !== undefined
        ? `**Current Input Value**: \`${discovery.currentValue}\``
        : "",
      "",
      "```",
      discovery.availableInfo || "(No additional information)",
      "```",
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    discoverySection = [
      "## Discovery Failed",
      "",
      `**Error**: ${discovery.error}`,
      "",
      "### Troubleshooting",
      "",
      platform.os === "darwin"
        ? [
            "1. Ensure m1ddc is installed: `brew install m1ddc`",
            "2. Check the monitor is connected and awake",
            "3. Try running manually: `m1ddc display list`",
            "4. Some monitors need DDC/CI enabled in OSD settings",
          ].join("\n")
        : [
            "1. Download ControlMyMonitor from https://www.nirsoft.net/utils/controlmymonitor.zip",
            "2. Extract and set the path in extension preferences",
            "3. Check the monitor is connected and awake",
            "4. Try running the GUI version to verify DDC/CI works",
          ].join("\n"),
    ].join("\n");
  }

  // Manual discovery instructions
  const manualInstructions = [
    "## Manual Discovery",
    "",
    "To find the correct input values for your monitor:",
    "",
    "1. **Switch to each input manually** using your monitor's OSD",
    "2. **Read the current value** from the active machine:",
    "",
    platform.os === "darwin"
      ? "   ```bash\n   m1ddc get input\n   ```"
      : '   ```powershell\n   .\\ControlMyMonitor.exe /GetValue Primary 60\n   ```',
    "",
    "3. **Record the value** for each input (DP, HDMI1, HDMI2, etc.)",
    "4. **Update extension preferences** with your discovered values",
  ].join("\n");

  const markdown = [
    "# DDC/CI Input Discovery",
    "",
    platformInfo,
    configInfo,
    discoverySection,
    "",
    "---",
    "",
    manualInstructions,
  ].join("\n");

  return <Detail markdown={markdown} />;
}
