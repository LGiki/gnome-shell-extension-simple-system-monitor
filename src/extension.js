/* extension.js
 * 
 * This is a fork of <https://extensions.gnome.org/extension/4478/net-speed/>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */


const { GObject, St, Clutter, GLib, Gio } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ByteArray = imports.byteArray;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const netSpeedUnits = [
    'B/s', 'K/s', 'M/s', 'G/s', 'T/s', 'P/s', 'E/s', 'Z/s', 'Y/s'
];

let lastTotalNetDownBytes = 0;
let lastTotalNetUpBytes = 0;

let lastCPUUsed = 0;
let lastCPUTotal = 0;

// See <https://github.com/AlynxZhou/gnome-shell-extension-net-speed>.
const getCurrentNetSpeed = (refreshInterval) => {
    const netSpeed = { 'down': 0, 'up': 0 };

    try {
        const inputFile = Gio.File.new_for_path('/proc/net/dev');
        const fileInputStream = inputFile.read(null);
        // See <https://gjs.guide/guides/gobject/basics.html#gobject-construction>.
        // If we want new operator, we need to pass params in object.
        // Short param is only used for static constructor.
        const dataInputStream = new Gio.DataInputStream({
            'base_stream': fileInputStream
        });

        // Caculate the sum of all interfaces' traffic line by line.
        let totalDownBytes = 0;
        let totalUpBytes = 0;
        let line = null;
        let length = 0;

        // See <https://gjs-docs.gnome.org/gio20~2.66p/gio.datainputstream#method-read_line>.
        while (([line, length] = dataInputStream.read_line(null)) && line != null) {
            // See <https://github.com/GNOME/gjs/blob/master/doc/ByteArray.md#tostringauint8array-encodingstringstring>.
            // It seems Uint8Array is only returned at the first time.
            if (line instanceof Uint8Array) {
                line = ByteArray.toString(line).trim();
            } else {
                line = line.toString().trim();
            }
            const fields = line.split(/\W+/);
            if (fields.length <= 2) {
                break;
            }

            // Skip virtual interfaces.
            const networkInterface = fields[0];
            const currentInterfaceDownBytes = Number.parseInt(fields[1]);
            const currentInterfaceUpBytes = Number.parseInt(fields[9]);
            if (networkInterface == 'lo' ||
                // Created by python-based bandwidth manager "traffictoll".
                networkInterface.match(/^ifb[0-9]+/) ||
                // Created by lxd container manager.
                networkInterface.match(/^lxdbr[0-9]+/) ||
                networkInterface.match(/^virbr[0-9]+/) ||
                networkInterface.match(/^br[0-9]+/) ||
                networkInterface.match(/^vnet[0-9]+/) ||
                networkInterface.match(/^tun[0-9]+/) ||
                networkInterface.match(/^tap[0-9]+/) ||
                isNaN(currentInterfaceDownBytes) ||
                isNaN(currentInterfaceUpBytes)) {
                continue;
            }

            totalDownBytes += currentInterfaceDownBytes;
            totalUpBytes += currentInterfaceUpBytes;
        }

        fileInputStream.close(null);

        if (lastTotalNetDownBytes === 0) {
            lastTotalNetDownBytes = totalDownBytes;
        }
        if (lastTotalNetUpBytes === 0) {
            lastTotalNetUpBytes = totalUpBytes;
        }

        netSpeed['down'] = (totalDownBytes - lastTotalNetDownBytes) / refreshInterval;
        netSpeed['up'] = (totalUpBytes - lastTotalNetUpBytes) / refreshInterval;

        lastTotalNetDownBytes = totalDownBytes;
        lastTotalNetUpBytes = totalUpBytes;
    } catch (e) {
        logError(e);
    }

    return netSpeed;
};

// See <https://stackoverflow.com/a/9229580>.
const getCurrentCPUUsage = () => {
    let currentCPUUsage = 0;

    try {
        const inputFile = Gio.File.new_for_path('/proc/stat');
        const fileInputStream = inputFile.read(null);
        const dataInputStream = new Gio.DataInputStream({
            'base_stream': fileInputStream
        });

        let currentCPUUsed = 0;
        let currentCPUTotal = 0;
        let line = null;
        let length = 0;

        while (([line, length] = dataInputStream.read_line(null)) && line != null) {
            if (line instanceof Uint8Array) {
                line = ByteArray.toString(line).trim();
            } else {
                line = line.toString().trim();
            }

            const fields = line.split(/\W+/);

            if (fields.length < 2) {
                continue;
            }

            const itemName = fields[0];
            if (itemName == 'cpu' && fields.length >= 5) {
                const user = Number.parseInt(fields[1]);
                const system = Number.parseInt(fields[3]);
                const idle = Number.parseInt(fields[4]);
                currentCPUUsed = user + system;
                currentCPUTotal = user + system + idle;
                break;
            }
        }

        fileInputStream.close(null);

        // Avoid divide by zero
        if (currentCPUTotal - lastCPUTotal !== 0) {
            currentCPUUsage = (currentCPUUsed - lastCPUUsed) / (currentCPUTotal - lastCPUTotal);
        }

        lastCPUTotal = currentCPUTotal;
        lastCPUUsed = currentCPUUsed;
    } catch (e) {
        logError(e);
    }
    return currentCPUUsage;
}

const getCurrentMemoryUsage = () => {
    let currentMemoryUsage = 0;

    try {
        const inputFile = Gio.File.new_for_path('/proc/meminfo');
        const fileInputStream = inputFile.read(null);
        const dataInputStream = new Gio.DataInputStream({
            'base_stream': fileInputStream
        });

        let memTotal = -1;
        let memAvailable = -1;
        let line = null;
        let length = 0;

        while (([line, length] = dataInputStream.read_line(null)) && line != null) {
            if (line instanceof Uint8Array) {
                line = ByteArray.toString(line).trim();
            } else {
                line = line.toString().trim();
            }

            const fields = line.split(/\W+/);

            if (fields.length < 2) {
                break;
            }

            const itemName = fields[0];
            const itemValue = Number.parseInt(fields[1]);

            if (itemName == 'MemTotal') {
                memTotal = itemValue;
            }

            if (itemName == 'MemAvailable') {
                memAvailable = itemValue;
            }

            if (memTotal !== -1 && memAvailable !== -1) {
                break;
            }
        }

        fileInputStream.close(null);

        if (memTotal !== -1 && memAvailable !== -1) {
            const memUsed = memTotal - memAvailable;
            currentMemoryUsage = memUsed / memTotal;
        }
    } catch (e) {
        logError(e);
    }
    return currentMemoryUsage;
}

const formatNetSpeedWithUnit = (amount) => {
    let unitIndex = 0;
    while (amount >= 1000 && unitIndex < netSpeedUnits.length - 1) {
        amount /= 1000;
        ++unitIndex;
    }

    let digits = 0;
    // Instead of showing 0.00123456 as 0.00, show it as 0.
    if (amount >= 100 || amount - 0 < 0.01) {
        // 100 M/s, 200 K/s, 300 B/s.
        digits = 0;
    } else if (amount >= 10) {
        // 10.1 M/s, 20.2 K/s, 30.3 B/s.
        digits = 1;
    } else {
        // 1.01 M/s, 2.02 K/s, 3.03 B/s.
        digits = 2;
    }

    // See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed>.
    return `${amount.toFixed(digits).toString().padStart(4)} ${netSpeedUnits[unitIndex]}`;
};

// Format a usage value in [0, 1] as an integer percent value.
const formatUsageVal = (usage) => {
  return Math.round(usage * 100).toString().padStart(3) + "%";
}

const toDisplayString = (texts, enable, cpuUsage, memoryUsage, netSpeed) => {
    const displayItems = [];
    if (enable.isCpuUsageEnable && cpuUsage !== null) {
        displayItems.push(`${texts.cpuUsageText} ${formatUsageVal(cpuUsage)}`);
    }
    if (enable.isMemoryUsageEnable && memoryUsage !== null) {
        displayItems.push(`${texts.memoryUsageText} ${formatUsageVal(memoryUsage)}`);
    }
    if (enable.isDownloadSpeedEnable && netSpeed !== null) {
        displayItems.push(`${texts.downloadSpeedText} ${formatNetSpeedWithUnit(netSpeed['down'])}`);
    }
    if (enable.isUploadSpeedEnable && netSpeed !== null) {
        displayItems.push(`${texts.uploadSpeedText} ${formatNetSpeedWithUnit(netSpeed['up'])}`);
    }
    return displayItems.join(texts.itemSeparator);
}

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, 'Simple System Monitor');

            this._label = new St.Label({
                'y_align': Clutter.ActorAlign.CENTER,
                'text': 'Initialization',
            });

            this.add_child(this._label);

            let settingMenuItem = new PopupMenu.PopupMenuItem('Setting');
            settingMenuItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
            });
            this.menu.addMenuItem(settingMenuItem);
        }

        setFontFamily(fontFamily) {
            return this._label.set_style(`font-family: "${fontFamily}";`);
        }

        setText(text) {
            return this._label.set_text(text);
        }
    }
);


class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        lastTotalNetDownBytes = 0;
        lastTotalNetUpBytes = 0;

        lastCPUUsed = 0;
        lastCPUTotal = 0;

        this._prefs = new Settings.Prefs();

        this._texts = {
            cpuUsageText: this._prefs.CPU_USAGE_TEXT.get(),
            memoryUsageText: this._prefs.MEMORY_USAGE_TEXT.get(),
            downloadSpeedText: this._prefs.DOWNLOAD_SPEED_TEXT.get(),
            uploadSpeedText: this._prefs.UPLOAD_SPEED_TEXT.get(),
            itemSeparator: this._prefs.ITEM_SEPARATOR.get(),
        };

        this._enable = {
            isCpuUsageEnable: this._prefs.IS_CPU_USAGE_ENABLE.get(),
            isMemoryUsageEnable: this._prefs.IS_MEMORY_USAGE_ENABLE.get(),
            isDownloadSpeedEnable: this._prefs.IS_DOWNLOAD_SPEED_ENABLE.get(),
            isUploadSpeedEnable: this._prefs.IS_UPLOAD_SPEED_ENABLE.get(),
        }

        this._refresh_interval = this._prefs.REFRESH_INTERVAL.get();

        this._indicator = new Indicator();

        this._indicator.setFontFamily(this._prefs.FONT_FAMILY.get());

        Main.panel.addToStatusArea(this._uuid, this._indicator, 0, 'right');

        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, this._refresh_interval, this._refresh_monitor.bind(this));

        this._listen_setting_change();
    }

    disable() {
        this._destory_setting_change_listener();
        if (this._indicator != null) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._timeout != null) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
    }

    _refresh_monitor() {
        let currentCPUUsage = null;
        let currentMemoryUsage = null;
        let currentNetSpeed = null;
        if (this._enable.isCpuUsageEnable) {
            currentCPUUsage = getCurrentCPUUsage(this._refresh_interval);
        }
        if (this._enable.isMemoryUsageEnable) {
            currentMemoryUsage = getCurrentMemoryUsage();
        }
        if (this._enable.isDownloadSpeedEnable || this._enable.isUploadSpeedEnable) {
            currentNetSpeed = getCurrentNetSpeed(this._refresh_interval);
        }
        const displayText = toDisplayString(this._texts, this._enable, currentCPUUsage, currentMemoryUsage, currentNetSpeed);
        this._indicator.setText(displayText);
        return GLib.SOURCE_CONTINUE;
    }

    _listen_setting_change() {
        this._prefs.IS_CPU_USAGE_ENABLE.changed(() => {
            this._enable.isCpuUsageEnable = this._prefs.IS_CPU_USAGE_ENABLE.get();
        });

        this._prefs.IS_MEMORY_USAGE_ENABLE.changed(() => {
            this._enable.isMemoryUsageEnable = this._prefs.IS_MEMORY_USAGE_ENABLE.get();
        });

        this._prefs.IS_DOWNLOAD_SPEED_ENABLE.changed(() => {
            this._enable.isDownloadSpeedEnable = this._prefs.IS_DOWNLOAD_SPEED_ENABLE.get();
        });

        this._prefs.IS_UPLOAD_SPEED_ENABLE.changed(() => {
            this._enable.isUploadSpeedEnable = this._prefs.IS_UPLOAD_SPEED_ENABLE.get();
        });

        this._prefs.CPU_USAGE_TEXT.changed(() => {
            this._texts.cpuUsageText = this._prefs.CPU_USAGE_TEXT.get();
        });

        this._prefs.MEMORY_USAGE_TEXT.changed(() => {
            this._texts.memoryUsageText = this._prefs.MEMORY_USAGE_TEXT.get();
        });

        this._prefs.DOWNLOAD_SPEED_TEXT.changed(() => {
            this._texts.downloadSpeedText = this._prefs.DOWNLOAD_SPEED_TEXT.get();
        });

        this._prefs.UPLOAD_SPEED_TEXT.changed(() => {
            this._texts.uploadSpeedText = this._prefs.UPLOAD_SPEED_TEXT.get();
        });

        this._prefs.ITEM_SEPARATOR.changed(() => {
            this._texts.itemSeparator = this._prefs.ITEM_SEPARATOR.get();
        });

        this._prefs.FONT_FAMILY.changed(() => {
            this._indicator.setFontFamily(this._prefs.FONT_FAMILY.get());
        });

        this._prefs.REFRESH_INTERVAL.changed(() => {
            this._refresh_interval = this._prefs.REFRESH_INTERVAL.get();
            if (this._timeout != null) {
                GLib.source_remove(this._timeout);
            }
            this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, this._refresh_interval, this._refresh_monitor.bind(this));
        });
    }

    _destory_setting_change_listener() {
        this._prefs.IS_CPU_USAGE_ENABLE.disconnect();
        this._prefs.IS_MEMORY_USAGE_ENABLE.disconnect();
        this._prefs.IS_DOWNLOAD_SPEED_ENABLE.disconnect();
        this._prefs.IS_UPLOAD_SPEED_ENABLE.disconnect();
        this._prefs.CPU_USAGE_TEXT.disconnect();
        this._prefs.MEMORY_USAGE_TEXT.disconnect();
        this._prefs.DOWNLOAD_SPEED_TEXT.disconnect();
        this._prefs.UPLOAD_SPEED_TEXT.disconnect();
        this._prefs.ITEM_SEPARATOR.disconnect();
        this._prefs.REFRESH_INTERVAL.disconnect();
        this._prefs.FONT_FAMILY.disconnect();
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
