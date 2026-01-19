/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** DisplayPort Input Code - DDC/CI input value for DisplayPort (VCP 0x60) */
  "displayPortValue": string,
  /** HDMI Input Code - DDC/CI input value for HDMI (VCP 0x60) */
  "hdmiValue": string,
  /** ControlMyMonitor Path (Windows) - [Windows only] Full path to ControlMyMonitor.exe */
  "controlMyMonitorPath": string,
  /** m1ddc Path (macOS) - [macOS only] Full path to m1ddc CLI tool */
  "m1ddcPath": string,
  /** Monitor Identifier (Windows) - [Windows only] Monitor ID for ControlMyMonitor. Use 'Primary' or specific ID from discovery. */
  "monitorId": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `toggle-input-source` command */
  export type ToggleInputSource = ExtensionPreferences & {}
  /** Preferences accessible in the `discover-inputs` command */
  export type DiscoverInputs = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `toggle-input-source` command */
  export type ToggleInputSource = {}
  /** Arguments passed to the `discover-inputs` command */
  export type DiscoverInputs = {}
}

