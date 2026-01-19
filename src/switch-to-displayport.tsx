/**
 * Raycast command: Switch monitor input to DisplayPort.
 *
 * Typically used from macOS to switch the monitor to the Windows PC.
 * Uses DDC/CI VCP code 0x60 with the configured DisplayPort value.
 */

import { closeMainWindow, getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import { switchInput } from "./lib/ddc";

interface Preferences {
  displayportValue: string;
  hdmiValue: string;
  controlMyMonitorPath: string;
  monitorId: string;
}

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();

  // Parse and validate input value
  const inputValue = parseInt(prefs.displayportValue, 10);
  if (isNaN(inputValue)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Invalid DisplayPort value",
      message: `"${prefs.displayportValue}" is not a valid number`,
    });
    return;
  }

  // Close Raycast window immediately for snappy UX
  await closeMainWindow();

  // Attempt the switch
  const result = switchInput(
    inputValue,
    prefs.controlMyMonitorPath || undefined,
    prefs.monitorId || "Primary"
  );

  if (result.success) {
    await showHUD(`✓ Switched to DisplayPort (${inputValue})`);
  } else {
    // Re-open toast for errors since HUD might be missed
    await showToast({
      style: Toast.Style.Failure,
      title: "Switch Failed",
      message: result.message,
    });
  }
}
