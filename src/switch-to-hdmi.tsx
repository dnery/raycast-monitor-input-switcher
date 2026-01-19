/**
 * Raycast command: Switch monitor input to HDMI.
 *
 * Typically used from Windows to switch the monitor to the Mac.
 * Uses DDC/CI VCP code 0x60 with the configured HDMI value.
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
  const inputValue = parseInt(prefs.hdmiValue, 10);
  if (isNaN(inputValue)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Invalid HDMI value",
      message: `"${prefs.hdmiValue}" is not a valid number`,
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
    await showHUD(`✓ Switched to HDMI (${inputValue})`);
  } else {
    // Re-open toast for errors since HUD might be missed
    await showToast({
      style: Toast.Style.Failure,
      title: "Switch Failed",
      message: result.message,
    });
  }
}
