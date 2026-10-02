# Simple System Monitor

<img src="./icon.svg" width="130" height="99" align="right" />

[![GitHub](https://img.shields.io/github/license/M7md-Gamal/gnome-shell-extension-simple-system-monitor?style=flat-square)](./LICENSE)
[![GNOME Shell](https://img.shields.io/badge/gnome--shell-45--50-blue?style=flat-square)](https://gitlab.gnome.org/GNOME/gnome-shell)

A lightweight system monitor extension for GNOME Shell (supporting **GNOME 45 to GNOME 50**).

Shows real-time CPU usage, memory usage, swap usage, network speed, and CPU temperature directly in your panel.

Displays clean text such as: `T 45 °C U 1% M 23% S 0% ↓ 456 K/s ↑ 789 K/s`.

For the best experience, please use a [monospaced font](https://en.wikipedia.org/wiki/Monospaced_font), e.g. [JetBrains Mono](https://www.jetbrains.com/lp/mono/), [Source Code Pro](https://adobe-fonts.github.io/source-code-pro/), [FiraCode](https://github.com/tonsky/FiraCode), or [Hack](https://github.com/source-foundry/Hack).

# Screenshot

![](screenshot/screenshot.png)

# Compatibility

Supports **GNOME Shell 45, 46, 47, 48, 49, and 50**.

# Build & Installation

### 1. Clone the repository
```bash
git clone https://github.com/M7md-Gamal/gnome-shell-extension-simple-system-monitor.git
cd gnome-shell-extension-simple-system-monitor
```

### 2. Build the extension bundle
```bash
./build.sh
```

### 3. Install and enable
```bash
gnome-extensions install --force simple-system-monitor@m7md-gamal.github.io.shell-extension.zip
gnome-extensions enable simple-system-monitor@m7md-gamal.github.io
```

> **Note:** If installing on an active GNOME Shell session, you may need to log out and log back in (or toggle the extension in the **Extensions** app) for changes to take effect.

# Upstream & References

- Forked from [LGiki/gnome-shell-extension-simple-system-monitor](https://github.com/LGiki/gnome-shell-extension-simple-system-monitor)
- Upstream on GNOME Extensions: [Simple System Monitor](https://extensions.gnome.org/extension/4506/simple-system-monitor/)
- Net speed logic based on [gnome-shell-extension-net-speed](https://github.com/AlynxZhou/gnome-shell-extension-net-speed)

# License

[GPL-2.0](./LICENSE)
