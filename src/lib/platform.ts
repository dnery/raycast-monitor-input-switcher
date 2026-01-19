/**
 * Platform detection and validation utilities for DDC/CI monitor control.
 *
 * Handles OS detection, Apple Silicon chip identification, and tool availability checks.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

/** Supported operating systems for this extension */
export type SupportedPlatform = "darwin" | "win32";

/** Apple Silicon chip generation (relevant for m1ddc compatibility) */
export type AppleSiliconGen = "m1" | "m2_or_later" | "intel" | "unknown";

export interface PlatformInfo {
  os: SupportedPlatform | "unsupported";
  isAppleSilicon: boolean;
  appleChipGen: AppleSiliconGen;
  m1ddcSupportsBuiltinHdmi: boolean;
}

/**
 * Detect the current platform and Apple Silicon generation.
 *
 * m1ddc note: Built-in HDMI port is only supported on M2 and later.
 * M1 Macs can still use m1ddc for external displays via USB-C/Thunderbolt adapters.
 */
export function detectPlatform(): PlatformInfo {
  const os = platform();

  if (os === "win32") {
    return {
      os: "win32",
      isAppleSilicon: false,
      appleChipGen: "unknown",
      m1ddcSupportsBuiltinHdmi: false,
    };
  }

  if (os === "darwin") {
    const chipGen = detectAppleSiliconGeneration();
    return {
      os: "darwin",
      isAppleSilicon: chipGen !== "intel",
      appleChipGen: chipGen,
      // M2+ supports built-in HDMI; M1 does not (per m1ddc docs)
      m1ddcSupportsBuiltinHdmi: chipGen === "m2_or_later",
    };
  }

  return {
    os: "unsupported",
    isAppleSilicon: false,
    appleChipGen: "unknown",
    m1ddcSupportsBuiltinHdmi: false,
  };
}

/**
 * Detect Apple Silicon chip generation using sysctl.
 *
 * Parses the chip brand string to determine M1 vs M2/M3/M4.
 */
function detectAppleSiliconGeneration(): AppleSiliconGen {
  try {
    const brandString = execSync("sysctl -n machdep.cpu.brand_string", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    // Intel chips contain "Intel" in the brand string
    if (brandString.toLowerCase().includes("intel")) {
      return "intel";
    }

    // Apple Silicon chips: "Apple M1", "Apple M1 Pro", "Apple M2", "Apple M3 Max", etc.
    const mChipMatch = brandString.match(/Apple M(\d+)/i);
    if (mChipMatch) {
      const generation = parseInt(mChipMatch[1], 10);
      return generation >= 2 ? "m2_or_later" : "m1";
    }

    // Fallback: if it says "Apple" but we can't parse generation, assume newer
    if (brandString.toLowerCase().includes("apple")) {
      return "m2_or_later";
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Check if m1ddc CLI tool is available on macOS.
 *
 * m1ddc is typically installed via Homebrew: `brew install m1ddc`
 */
export function isM1ddcInstalled(): boolean {
  try {
    execSync("which m1ddc", { encoding: "utf-8", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ControlMyMonitor.exe exists at the specified path (Windows).
 */
export function isControlMyMonitorInstalled(path: string): boolean {
  if (!path || path.trim() === "") {
    return false;
  }
  return existsSync(path);
}

/**
 * Validate that all prerequisites are met for the current platform.
 *
 * Returns an error message if prerequisites are not met, or null if ready.
 */
export function validatePrerequisites(controlMyMonitorPath?: string): string | null {
  const info = detectPlatform();

  if (info.os === "unsupported") {
    return "This extension only supports macOS and Windows.";
  }

  if (info.os === "darwin") {
    if (info.appleChipGen === "intel") {
      return "m1ddc requires Apple Silicon (M1 or later). Intel Macs are not supported.";
    }

    if (!isM1ddcInstalled()) {
      return "m1ddc is not installed. Install via: brew install m1ddc";
    }

    // Warn about M1 built-in HDMI limitation (non-blocking)
    if (info.appleChipGen === "m1") {
      // This is a warning, not a blocker - external displays still work
      console.warn(
        "Note: m1ddc does not support M1's built-in HDMI port. " +
          "External displays via USB-C/Thunderbolt adapters should work."
      );
    }

    return null;
  }

  if (info.os === "win32") {
    if (!controlMyMonitorPath || controlMyMonitorPath.trim() === "") {
      return (
        "ControlMyMonitor path not configured. " +
        "Download from https://www.nirsoft.net/utils/controlmymonitor.zip " +
        "and set the path in extension preferences."
      );
    }

    if (!isControlMyMonitorInstalled(controlMyMonitorPath)) {
      return `ControlMyMonitor not found at: ${controlMyMonitorPath}`;
    }

    return null;
  }

  return "Unknown platform error.";
}
