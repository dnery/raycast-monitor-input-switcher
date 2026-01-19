import { PlatformInfo } from "./platform";
import { ToastResult, GenericSuccess } from "./toast";
import { existsSync } from "node:fs";
import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  displayPortValue: string;
  hdmiPortValue: string;
  m1ddcPath: string;
  controlMyMonitorPath: string;
  monitorId: string;
}
export type PreferenceValidation = Preferences & ToastResult;

export function validatePreferences(
  platform: PlatformInfo,
): PreferenceValidation {
  const prefs = getPreferenceValues<Preferences>();

  // Fail if DisplayPort value or HDMI value are non numbers
  [
    { input: "HDMI port", value: prefs.hdmiPortValue },
    { input: "DisplayPort", value: prefs.displayPortValue },
  ].forEach((deviceConfig) => {
    const inputValue = parseInt(deviceConfig.value, 10);
    if (isNaN(inputValue)) {
      return {
        ...prefs,
        status: "failure",
        title: `Invalid ${deviceConfig.input} value`,
        message: `"${inputValue}" is not a valid number`,
      };
    }
  });

  // Fail if runnable path is unset or doesn't exist
  const runnableName =
    platform.os === "darwin" ? "m1ddc" : "ControlMyMonitor.exe";
  const runnablePath =
    platform.os === "darwin" ? prefs.m1ddcPath : prefs.controlMyMonitorPath;
  const errorMessage =
    platform.os === "darwin"
      ? `Path to ${runnableName} is empty/unset. ` +
        "Install via: brew install m1ddc and set the path in extension preferences."
      : `Path to ${runnableName} is empty/unset. ` +
        "Download from https://www.nirsoft.net/utils/controlmymonitor.zip and set the path in extension preferences.";

  if (!runnablePath || runnablePath.trim() === "") {
    return {
      ...prefs,
      status: "failure",
      title: `${runnableName} path not configured`,
      message: errorMessage,
    };
  }
  if (!existsSync(runnablePath)) {
    return {
      ...prefs,
      status: "failure",
      title: `${runnableName} not found`,
      message: `Path: ${runnablePath}`,
    };
  }

  return { ...prefs, ...GenericSuccess };
}
