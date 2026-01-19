/**
 * Raycast command: Discover DDC/CI input codes.
 *
 * Reads current input value and displays available DDC/CI information.
 * Useful for determining correct input codes for your specific monitor.
 */

import { Detail } from "@raycast/api";
import { discoverInputs } from "./lib/ddc";
import { PrerequisiteValidation, validatePrerequisites } from "./common";
import { SupportedPlatform } from "./lib/platform";

export default function Command() {
  const platformValidation = validatePrerequisites();

  // Build platform info section
  if (platformValidation.os === "unsupported") {
    const markdown = "### Nothing could be retrieved!";
    console.log(markdown);
    return (
      <Detail markdown={markdown} navigationTitle="# DDC/CI Input Discovery" />
    );
  }
  const platformInfo = [
    "",
    "## Platform Information",
    "",
    `- **OS**: ${platformValidation.os}`,
    platformValidation.os === "darwin"
      ? `- **Apple Silicon**: ${platformValidation.isAppleSilicon ? "Yes" : "No"}`
      : "",
    platformValidation.os === "darwin"
      ? `- **Chip Generation**: ${platformValidation.appleChipGen}`
      : "",
    platformValidation.os === "darwin"
      ? `- **Built-in HDMI Supported**: ${platformValidation.m1ddcSupportsBuiltinHdmi ? "Yes (M2+)" : "No (M1 or Intel)"}`
      : "",
    "",
  ].join("\n");

  // Build current config section
  if (!Object.hasOwn(platformValidation, "displayPortValue")) {
    const markdown = `
      ${platformInfo}
      `;
    console.log(markdown);
    return (
      <Detail markdown={markdown} navigationTitle="# DDC/CI Input Discovery" />
    );
  }
  const completeValidation = platformValidation as PrerequisiteValidation;
  const settingsInfo = [
    "## Current Configuration",
    "",
    `- **DisplayPort Value**: ${completeValidation.displayPortValue}`,
    `- **HDMI Value**: ${completeValidation.hdmiPortValue}`,
    completeValidation.os === "win32"
      ? `- **ControlMyMonitor Path**: ${completeValidation.controlMyMonitorPath || "(not set)"}`
      : "",
    completeValidation.os === "win32"
      ? `- **Monitor ID**: ${completeValidation.monitorId || "Primary"}`
      : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  // Attempt discovery
  const exePath = completeValidation.isAppleSilicon
    ? completeValidation.m1ddcPath
    : completeValidation.controlMyMonitorPath;
  const discovery = discoverInputs(
    completeValidation.os as SupportedPlatform,
    completeValidation.monitorId || "Primary",
    exePath,
  );

  let discoverySection: string;
  if (discovery.success) {
    discoverySection = [
      "## Discovery Results",
      "",
      "```",
      discovery.availableInfo || "(No additional information)",
      "```",
    ].join("\n");
  } else {
    discoverySection = [
      "## Discovery Failed",
      "",
      `**Error**: ${discovery.error}`,
      "",
      "### Troubleshooting",
      "",
      completeValidation.os === "darwin"
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
    completeValidation.os === "darwin"
      ? "   ```bash\n   m1ddc get input\n   ```"
      : "   ```powershell\n   .\\ControlMyMonitor.exe /GetValue Primary 60\n   ```",
    "",
    "3. **Record the value** for each input (DP, HDMI1, HDMI2, etc.)",
    "4. **Update extension preferences** with your discovered values",
  ].join("\n");

  const markdown = [
    "",
    "# DDC/CI Input Discovery",
    `${platformInfo}`,
    `${settingsInfo}`,
    `${discoverySection}`,
    "",
    "",
    `${manualInstructions}`,
  ].join("\n");
  return <Detail markdown={markdown} />;
}
