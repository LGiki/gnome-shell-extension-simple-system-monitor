const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const SETTING_SCHEMA = 'org.gnome.shell.extensions.simple-system-monitor';

const getSettings = (schema) => {
    const GioSSS = Gio.SettingsSchemaSource;
    const schemaDir = Me.dir.get_child('schemas');
    let schemaSource = GioSSS.get_default();

    if (schemaDir.query_exists(null)) {
        schemaSource = GioSSS.new_from_directory(
            schemaDir.get_path(),
            schemaSource,
            false
        );
    }

    const schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj) {
        throw new Error(`Schema ${schema} could not be found for extension ${Me.metadata.uuid}`);
    }
    return new Gio.Settings({
        settings_schema: schemaObj
    });
}

var Prefs = class Prefs {
    constructor() {
        const settings = getSettings(SETTING_SCHEMA);

        this.CPU_USAGE_TEXT = new PrefValue(settings, 'cpu-usage-text', 'string');
        this.MEMORY_USAGE_TEXT = new PrefValue(settings, 'memory-usage-text', 'string');
        this.DOWNLOAD_SPEED_TEXT = new PrefValue(settings, 'download-speed-text', 'string');
        this.UPLOAD_SPEED_TEXT = new PrefValue(settings, 'upload-speed-text', 'string');
        this.REFRESH_INTERVAL = new PrefValue(settings, 'refresh-interval', 'int');
    }
}

class PrefValue {
    constructor(gioSettings, key, type) {
        this._gioSettings = gioSettings;
        this._key = key;
        this._type = type;
        this._changedListenerId = -1;
    }

    get() {
        return this._gioSettings[`get_${this._type}`](this._key);
    }

    set(v) {
        return this._gioSettings[`set_${this._type}`](this._key, v);
    }

    changed(callback) {
        this._changedListenerId = this._gioSettings.connect(`changed::${this._key}`, callback);
        return this._changedListenerId;
    }

    disconnect() {
        if (this._changedListenerId > 0) {
            this._gioSettings.disconnect(this._changedListenerId);
        }
    }
}