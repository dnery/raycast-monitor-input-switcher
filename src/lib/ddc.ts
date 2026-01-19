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
import { SupportedPlatform } from "./platform";
import { GenericSuccess, ToastResult } from "./toast";

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
  platformOs: SupportedPlatform,
  inputValue: number,
  monitorId: string,
  exePath: string,
): ToastResult {
  // Validate prerequisites first
  // const platform = detectPlatform();
  // const platformValidation = validateHostPlatform(platform);
  // if (platformValidation.status == "failure") {
  //   return platformValidation;
  // }

  const switchResult =
    platformOs === "darwin"
      ? switchInputMacToWindows(inputValue, exePath)
      : switchInputWindowsToMac(inputValue, monitorId, exePath);
  if (!switchResult.success) {
    return {
      status: "failure",
      title: `Failed to switch to input ${inputValue} via ${exePath}`,
      message: switchResult.message + " :: " + (switchResult.rawOutput || ""),
    };
  }
  return GenericSuccess;
}

/**
 * Switch input on macOS using m1ddc.
 */
function switchInputMacToWindows(
  inputValue: number,
  exePath: string,
): SwitchResult {
  try {
    const quotedPath = `"${exePath}"`;
    const command = `${quotedPath} set input ${inputValue}`;
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
        message:
          "No DDC/CI compatible displays found. Is the monitor connected and awake?",
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
function switchInputWindowsToMac(
  inputValue: number,
  monitorId: string,
  exePath: string,
): SwitchResult {
  try {
    // Escape path for command line (handle spaces)
    const quotedPath = `"${exePath}"`;
    const command = `${quotedPath} /SetValue "${monitorId}" ${VCP_INPUT_SOURCE} ${inputValue}`;
    const output = execSync(command, {
      ...EXEC_OPTIONS,
      shell: "cmd.exe",
    }) as string;

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
  platformOs: SupportedPlatform,
  monitorId: string,
  exePath: string,
): InputDiscovery {
  // const prereqError = validateHostPlatform(exePath);
  // if (prereqError) {
  //   return { success: false, error: prereqError };
  // }

  // const platform = detectPlatform();
  return platformOs === "darwin"
    ? discoverInputsMacOS(exePath)
    : discoverInputsWindows(exePath, monitorId);
}

/**
 * Discover inputs on macOS using m1ddc.
 */
function discoverInputsMacOS(exePath: string): InputDiscovery {
  try {
    // Get current input value
    const quotedPath = `"${exePath}"`;
    const currentInput = execSync(
      `${quotedPath} get input`,
      EXEC_OPTIONS,
    ) as string;
    const currentValue = parseInt(currentInput.trim(), 10);

    // Get display list for additional info
    let displayInfo = "";
    try {
      displayInfo = execSync(
        `${quotedPath} display list`,
        EXEC_OPTIONS,
      ) as string;
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
function discoverInputsWindows(
  exePath: string,
  monitorId: string,
): InputDiscovery {
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
        { ...EXEC_OPTIONS, shell: "cmd.exe" },
      ) as string;
      currentValue = parseInt(inputInfo.trim(), 10);
      if (isNaN(currentValue)) currentValue = undefined;
    } catch {
      // GetValue might not be supported, continue without it
    }

    const info = [
      "=== Windows DDC/CI Discovery (ControlMyMonitor) ===",
      "",
      currentValue === undefined
        ? "Current Input Value: (Could not read)"
        : `Current Input Value (VCP 0x60): ${currentValue}`,
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
