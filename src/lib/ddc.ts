/**
 * DDC/CI (Display Data Channel Command Interface) control module.
 *
 * Provides cross-platform abstraction for sending DDC/CI commands to monitors.
 * - macOS: Uses m1ddc CLI tool
 * - Windows: Uses ControlMyMonitor.exe from NirSoft
 *
 * VCP Code Reference:
 * - 0x60 (96 decimal): Input Source Select
 * - Common input values: 15=DP, 17=HDMI1, 18=HDMI2 (monitor-specific)
 */

import { execSync, ExecSyncOptions } from "node:child_process";
import { detectPlatform, validatePrerequisites } from "./platform";

/** VCP code for Input Source Select (DDC/CI standard) */
const VCP_INPUT_SOURCE = 60;

/** Options for command execution */
const EXEC_OPTIONS: ExecSyncOptions = {
  encoding: "utf-8",
  timeout: 10000,
  windowsHide: true,
};

export interface SwitchResult {
  success: boolean;
  message: string;
  /** Raw command output for debugging */
  rawOutput?: string;
}

export interface InputDiscovery {
  success: boolean;
  currentValue?: number;
  availableInfo?: string;
  error?: string;
}

/**
 * Switch monitor input to the specified DDC/CI input value.
 *
 * @param inputValue - DDC/CI input source value (e.g., 15 for DP, 17 for HDMI)
 * @param controlMyMonitorPath - Path to ControlMyMonitor.exe (Windows only)
 * @param monitorId - Monitor identifier for ControlMyMonitor (Windows only, default: "Primary")
 */
export function switchInput(
  inputValue: number,
  controlMyMonitorPath?: string,
  monitorId: string = "Primary"
): SwitchResult {
  // Validate prerequisites first
  const prereqError = validatePrerequisites(controlMyMonitorPath);
  if (prereqError) {
    return { success: false, message: prereqError };
  }

  const platform = detectPlatform();

  if (platform.os === "darwin") {
    return switchInputMacOS(inputValue);
  }

  if (platform.os === "win32") {
    // TypeScript knows controlMyMonitorPath is defined here due to validatePrerequisites
    return switchInputWindows(inputValue, controlMyMonitorPath!, monitorId);
  }

  return { success: false, message: "Unsupported platform." };
}

/**
 * Switch input on macOS using m1ddc.
 */
function switchInputMacOS(inputValue: number): SwitchResult {
  try {
    const command = `m1ddc set input ${inputValue}`;
    const output = execSync(command, EXEC_OPTIONS) as string;

    return {
      success: true,
      message: `Switched to input ${inputValue}`,
      rawOutput: output.trim(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for common m1ddc errors
    if (errorMessage.includes("No displays found")) {
      return {
        success: false,
        message: "No DDC/CI compatible displays found. Is the monitor connected and awake?",
      };
    }

    if (errorMessage.includes("DDC communication failed")) {
      return {
        success: false,
        message:
          "DDC/CI communication failed. Try a different cable or check monitor DDC settings.",
      };
    }

    return {
      success: false,
      message: `m1ddc error: ${errorMessage}`,
    };
  }
}

/**
 * Switch input on Windows using ControlMyMonitor.
 */
function switchInputWindows(
  inputValue: number,
  exePath: string,
  monitorId: string
): SwitchResult {
  try {
    // Escape path for command line (handle spaces)
    const quotedPath = `"${exePath}"`;
    const command = `${quotedPath} /SetValue "${monitorId}" ${VCP_INPUT_SOURCE} ${inputValue}`;

    const output = execSync(command, { ...EXEC_OPTIONS, shell: "cmd.exe" }) as string;

    return {
      success: true,
      message: `Switched to input ${inputValue}`,
      rawOutput: output.trim(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: `ControlMyMonitor error: ${errorMessage}`,
    };
  }
}

/**
 * Discover the current input value and available DDC/CI information.
 *
 * Useful for determining correct input codes for your specific monitor.
 */
export function discoverInputs(
  controlMyMonitorPath?: string,
  monitorId: string = "Primary"
): InputDiscovery {
  const prereqError = validatePrerequisites(controlMyMonitorPath);
  if (prereqError) {
    return { success: false, error: prereqError };
  }

  const platform = detectPlatform();

  if (platform.os === "darwin") {
    return discoverInputsMacOS();
  }

  if (platform.os === "win32") {
    return discoverInputsWindows(controlMyMonitorPath!, monitorId);
  }

  return { success: false, error: "Unsupported platform." };
}

/**
 * Discover inputs on macOS using m1ddc.
 */
function discoverInputsMacOS(): InputDiscovery {
  try {
    // Get current input value
    const currentInput = execSync("m1ddc get input", EXEC_OPTIONS) as string;
    const currentValue = parseInt(currentInput.trim(), 10);

    // Get display list for additional info
    let displayInfo = "";
    try {
      displayInfo = execSync("m1ddc display list", EXEC_OPTIONS) as string;
    } catch {
      displayInfo = "(Could not retrieve display list)";
    }

    const info = [
      "=== macOS DDC/CI Discovery (m1ddc) ===",
      "",
      `Current Input Value (VCP 0x60): ${currentValue}`,
      "",
      "Common Input Values:",
      "  15 (0x0F) = DisplayPort",
      "  17 (0x11) = HDMI-1",
      "  18 (0x12) = HDMI-2",
      "  (Values vary by monitor model)",
      "",
      "Detected Displays:",
      displayInfo,
      "",
      "Tip: Switch to each input manually and run this command to discover the value:",
      "  m1ddc get input",
    ].join("\n");

    return {
      success: true,
      currentValue: isNaN(currentValue) ? undefined : currentValue,
      availableInfo: info,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `m1ddc error: ${errorMessage}` };
  }
}

/**
 * Discover inputs on Windows using ControlMyMonitor.
 */
function discoverInputsWindows(exePath: string, monitorId: string): InputDiscovery {
  try {
    const quotedPath = `"${exePath}"`;

    // Get all VCP values for the monitor
    const monitorInfo = execSync(`${quotedPath} /smonitors`, {
      ...EXEC_OPTIONS,
      shell: "cmd.exe",
    }) as string;

    // Try to get current input value specifically
    let currentValue: number | undefined;
    try {
      const inputInfo = execSync(
        `${quotedPath} /GetValue "${monitorId}" ${VCP_INPUT_SOURCE}`,
        { ...EXEC_OPTIONS, shell: "cmd.exe" }
      ) as string;
      currentValue = parseInt(inputInfo.trim(), 10);
      if (isNaN(currentValue)) currentValue = undefined;
    } catch {
      // GetValue might not be supported, continue without it
    }

    const info = [
      "=== Windows DDC/CI Discovery (ControlMyMonitor) ===",
      "",
      currentValue !== undefined
        ? `Current Input Value (VCP 0x60): ${currentValue}`
        : "Current Input Value: (Could not read)",
      "",
      "Common Input Values:",
      "  15 (0x0F) = DisplayPort",
      "  17 (0x11) = HDMI-1",
      "  18 (0x12) = HDMI-2",
      "  (Values vary by monitor model)",
      "",
      "Detected Monitors:",
      monitorInfo,
      "",
      "Tip: Use the ControlMyMonitor GUI to explore all VCP values.",
    ].join("\n");

    return {
      success: true,
      currentValue,
      availableInfo: info,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `ControlMyMonitor error: ${errorMessage}` };
  }
}
