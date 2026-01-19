import { PreferenceValidation, validatePreferences } from "./lib/extension";
import { PlatformValidation, validateHostPlatform } from "./lib/platform";

export type PrerequisiteValidation = PlatformValidation & PreferenceValidation;

export function validatePrerequisites():
  | PrerequisiteValidation
  | PlatformValidation {
  // Validate prerequisites first
  const platformValidation = validateHostPlatform();
  if (platformValidation.status !== "failure") {
    return {
      ...platformValidation,
      ...validatePreferences(platformValidation),
    };
  }
  return platformValidation;
}
