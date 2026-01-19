/**
 * Raycast command: Toggle switch monitor input source.
 *
 * Typically used from macOS to switch the monitor to the Windows PC, or
 * the other way around. * Uses DDC/CI VCP code 0x60 with the configured
 * DisplayPort/HDMI value.
 */

import { closeMainWindow, showToast, Toast } from "@raycast/api";
import { switchInput } from "./lib/ddc";
import { setTimeout } from "node:timers/promises";
import { PrerequisiteValidation, validatePrerequisites } from "./common";
import { SupportedPlatform } from "./lib/platform";

export default async function Command() {
  const completeValidation = validatePrerequisites() as PrerequisiteValidation;
  if (completeValidation.status === "failure") {
    await showToast({
      style: Toast.Style.Failure,
      title: completeValidation.title,
      message: completeValidation.message,
    });
    return;
  }
  const resolvedExePath =
    completeValidation.os === "darwin"
      ? completeValidation.m1ddcPath
      : completeValidation.controlMyMonitorPath;
  const resolvedInput =
    completeValidation.os === "darwin"
      ? parseInt(completeValidation.displayPortValue, 10)
      : parseInt(completeValidation.hdmiPortValue, 10);

  // Close Raycast window immediately for snappy UX
  await closeMainWindow();

  const toasting = await showToast({
    style: Toast.Style.Animated,
    title: "Switching!",
    message: `To input ${resolvedInput} via ${resolvedExePath}`,
  });
  await setTimeout(3000);

  // Attempt the switch
  const result = switchInput(
    completeValidation.os as SupportedPlatform,
    resolvedInput,
    completeValidation.monitorId || "Primary",
    resolvedExePath,
  );

  if (result.status === "success") {
    toasting.style = Toast.Style.Success;
    toasting.title = `✓ Switched to input (${resolvedInput})`;
    toasting.message = "";
  } else {
    toasting.style = Toast.Style.Failure;
    toasting.title = result.title;
    toasting.message = result.message;
  }
}
