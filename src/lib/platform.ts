/**
 * Platform detection and validation utilities for DDC/CI monitor control.
 *
 * Handles OS detection, Apple Silicon chip identification, and tool availability checks.
 */

import { execSync } from "node:child_process";
import { platform } from "node:os";
import { ToastResult, GenericSuccess } from "./toast";

/** Supported operating systems for this extension */
export type SupportedPlatform = "darwin" | "win32";

/** Apple Silicon chip generation (relevant for m1ddc compatibility) */
export type AppleSiliconGen = "m1" | "m2_or_later" | "intel" | "unknown";

export interface PlatformInfo {
  os: SupportedPlatform | "unsupported";
  appleChipGen: AppleSiliconGen;
  isWin32: boolean;
  isAppleSilicon: boolean;
  m1ddcSupportsBuiltinHdmi: boolean;
}

export type PlatformValidation = PlatformInfo & ToastResult;

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
      isWin32: true,
      appleChipGen: "unknown",
      isAppleSilicon: false,
      m1ddcSupportsBuiltinHdmi: false,
    };
  }

  if (os === "darwin") {
    const chipGen = detectAppleSiliconGeneration();
    return {
      os: "darwin",
      isWin32: false,
      appleChipGen: chipGen,
      isAppleSilicon: chipGen !== "intel",
      // M2+ supports built-in HDMI; M1 does not (per m1ddc docs)
      m1ddcSupportsBuiltinHdmi: chipGen === "m2_or_later",
    };
  }

  return {
    os: "unsupported",
    isWin32: false,
    appleChipGen: "unknown",
    isAppleSilicon: false,
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
    const quotedPath = `"/usr/sbin/sysctl"`;
    const brandString = execSync(`${quotedPath} -n machdep.cpu.brand_string`, {
      shell: "/bin/bash",
      encoding: "utf-8",
      timeout: 3000,
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
 * Validate that all prerequisites are met for the current platform.
 *
 * Returns an error message if prerequisites are not met, or null if ready.
 */
export function validateHostPlatform(): PlatformValidation {
  const info = detectPlatform();

  if (info.os === "unsupported") {
    return {
      ...info,
      status: "failure",
      title: "This extension only supports macOS and Windows.",
      message: "",
    };
  }

  if (info.os === "darwin") {
    if (info.appleChipGen === "intel") {
      return {
        ...info,
        status: "failure",
        title: "m1ddc requires Apple Silicon (M1 or later)",
        message: "M1 is partially supported, Intel Macs are not supported.",
      };
    }

    // Warn about M1 built-in HDMI limitation (non-blocking)
    if (info.appleChipGen === "m1") {
      return {
        ...info,
        status: "soft-fail",
        title: "m1ddc does not support M1's built-in HDMI port!",
        message:
          "External displays via USB-C/Thunderbolt adapters should work.",
      };
    }

    return { ...info, ...GenericSuccess };
  }

  if (info.os === "win32") {
    return { ...info, ...GenericSuccess };
  }

  return {
    ...info,
    status: "failure",
    title: "Unknown platform error.",
    message: "",
  };
}
