# Monitor Input Switch — Raycast Extension

Switch your monitor's input source via **DDC/CI** commands directly from Raycast. No more fumbling with the monitor's OSD menu.

## Features

- **Switch to DisplayPort** — One command to switch (e.g., Mac → Windows)
- **Switch to HDMI** — One command to switch back (e.g., Windows → Mac)
- **Discover Input Codes** — Find the correct DDC/CI values for your specific monitor
- **Cross-platform** — Works on both macOS (via `m1ddc`) and Windows (via `ControlMyMonitor`)

---

## Prerequisites

### Install the extension
- Install `asdf` if on macOS or
- Install `vfox` if on Windows
- Optionally, install `direnv` (if developing)

Then install the dependencies with `asdf install`/`vfox install`. After that:
- **Run the extension in dev mode:** `npm run dev`
- **Install the extension locally:** `npm run build`


#### Local development
If you wish to contribute, ensure `direnv` is installed and load the layout:
```bash
direnv allow
```

Then get your Raycast org token:
```bash
ray token
```

And set it on a `.env.local` file (copy from `.env.local.template`).

### macOS (Apple Silicon only)

**m1ddc** is required. Install via Homebrew:

```bash
brew install m1ddc
```

Verify it works:

```bash
m1ddc display list
m1ddc get input
```

> **Note**: m1ddc only supports Apple Silicon Macs. The built-in HDMI port is only supported on M2 and later; M1 Macs can use external displays via USB-C/Thunderbolt adapters.

### Windows

**ControlMyMonitor** from NirSoft is required.

1. Download: https://www.nirsoft.net/utils/controlmymonitor.zip
2. Extract `ControlMyMonitor.exe` to a permanent location (e.g., `C:\Tools\ControlMyMonitor.exe`)
3. Note the full path — you'll need it for extension preferences

Verify it works by running the executable, and wait for DDC/CI query results. Note down the **possible values for the operation with VPC code 60.**
Select **Options > Put Icon on Tray** and then you can close it. The app needs to be running for the commands to execute successfully.

---

## Project Setup

### Version Management

This project includes configs for both **asdf** (macOS) and **vfox** (Windows):

| File | Tool | Platform |
|------|------|----------|
| `.tool-versions` | asdf | macOS |
| `.vfox.toml` | vfox | Windows |

### macOS Setup (asdf)

```bash
# Clone/copy the extension to your Raycast extensions directory
cd ~/path/to/raycast-monitor-switch

# Install Node.js via asdf
asdf install

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Windows Setup (vfox)

```powershell
# Clone/copy the extension
cd ~\path\to\raycast-monitor-switch

# Install Node.js via vfox
vfox install

# Install dependencies
npm install

# Start development mode
npm run dev
```

---

## Local Extension Development with Raycast

Raycast extensions in development mode run directly from source. Here's how it works:

### Starting Development Mode

```bash
npm run dev
```

This command:
1. Builds the extension
2. Registers it with Raycast as a local extension
3. Watches for file changes and hot-reloads

### Finding Your Commands

Once `npm run dev` is running:

1. Open Raycast (default: `⌘ + Space` on Mac, configured hotkey on Windows)
2. Type `Switch to DisplayPort` or `Switch to HDMI`
3. The commands should appear with a "Local" badge

### Configuring Preferences

On first run (or anytime via Raycast):

1. Open the command in Raycast
2. Press `⌘ + ,` (Mac) or right-click → "Configure Extension"
3. Set your values:
   - **DisplayPort Input Code**: `15` (your DP1 value)
   - **HDMI Input Code**: `17` (your HDMI1 value)
   - **ControlMyMonitor Path** (Windows only): Full path to the `.exe`
   - **Monitor Identifier** (Windows only): Usually `Primary`

### Stopping Development Mode

Press `Ctrl + C` in the terminal running `npm run dev`.

The extension will no longer appear in Raycast until you run `dev` again.

### Installing Permanently (Optional)

If you want the extension to persist without running `npm run dev`:

```bash
npm run build
# Then manually import via Raycast → Extensions → Import Extension
```

Or publish to the Raycast Store (requires Raycast account):

```bash
npm run publish
```

---

## Discovering Your Monitor's Input Codes

DDC/CI input values are **monitor-specific**. Your ASUS VG27AQL1A uses:
- `15` = DisplayPort 1
- `17` = HDMI 1
- `18` = HDMI 2

To discover values for a different monitor:

### Method 1: Use the Discovery Command

1. Run "Discover Input Codes" from Raycast
2. Note the current value
3. Manually switch inputs via OSD
4. Run discovery again
5. Repeat for each input

### Method 2: Manual CLI

**macOS:**
```bash
# Switch monitor to DisplayPort via OSD, then:
m1ddc get input   # → Note this value (e.g., 15)

# Switch monitor to HDMI via OSD, then:
m1ddc get input   # → Note this value (e.g., 17)
```

**Windows:**
```powershell
# Switch monitor to each input via OSD, then read:
.\ControlMyMonitor.exe /GetValue Primary 60
```

---

## Troubleshooting

### "No DDC/CI compatible displays found"

- Ensure the monitor supports DDC/CI (most modern monitors do)
- Check if DDC/CI is enabled in your monitor's OSD settings
- Try a different cable — some cheap HDMI cables don't wire DDC pins

### "m1ddc command not found"

```bash
brew install m1ddc
```

### "ControlMyMonitor not found at path"

- Verify the path in extension preferences
- Use the full path including `.exe`
- Avoid paths with special characters

### Commands work but nothing happens

- The monitor might only accept DDC/CI on the *active* input
- This is a firmware limitation — some monitors can only be "pulled to" by the target machine, not "pushed away" by the current one

### M1 Mac with built-in HDMI

m1ddc does not support M1's built-in HDMI port. Options:
- Use a USB-C/Thunderbolt to HDMI adapter
- Use a dock with HDMI output
- Use an external USB-C display

---

## Technical Details

### DDC/CI VCP Codes

| Code | Name | Description |
|------|------|-------------|
| `0x60` (96) | Input Source | Selects active input |

### Common Input Values

| Value | Typical Meaning |
|-------|-----------------|
| 1 | VGA |
| 3 | DVI |
| 4 | HDMI-1 (some monitors) |
| 15 (0x0F) | DisplayPort |
| 17 (0x11) | HDMI-1 |
| 18 (0x12) | HDMI-2 |

Values are manufacturer-specific. Always verify with discovery.

---

## License

MIT
