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

        this.CPU_USAGE_TEXT = {
            key: 'cpu-usage-text',
            get: function () {
                return settings.get_string(this.key);
            },
            set: function (v) {
                settings.set_string(this.key, v);
            },
            changed: function (cb) {
                return settings.connect('changed::' + this.key, cb);
            },
            disconnect: function () {
                return settings.disconnect.apply(settings, arguments);
            }
        };

        this.MEMORY_USAGE_TEXT = {
            key: 'memory-usage-text',
            get: function () {
                return settings.get_string(this.key);
            },
            set: function (v) {
                settings.set_string(this.key, v);
            },
            changed: function (cb) {
                return settings.connect('changed::' + this.key, cb);
            },
            disconnect: function () {
                return settings.disconnect.apply(settings, arguments);
            }
        };

        this.DOWNLOAD_SPEED_TEXT = {
            key: 'download-speed-text',
            get: function () {
                return settings.get_string(this.key);
            },
            set: function (v) {
                settings.set_string(this.key, v);
            },
            changed: function (cb) {
                return settings.connect('changed::' + this.key, cb);
            },
            disconnect: function () {
                return settings.disconnect.apply(settings, arguments);
            }
        };

        this.UPLOAD_SPEED_TEXT = {
            key: 'upload-speed-text',
            get: function () {
                return settings.get_string(this.key);
            },
            set: function (v) {
                settings.set_string(this.key, v);
            },
            changed: function (cb) {
                return settings.connect('changed::' + this.key, cb);
            },
            disconnect: function () {
                return settings.disconnect.apply(settings, arguments);
            }
        };

        this.REFRESH_INTERVAL = {
            key: 'refresh-interval',
            get: function () {
                return settings.get_int(this.key);
            },
            set: function (v) {
                settings.set_int(this.key, v);
            },
            changed: function (cb) {
                return settings.connect('changed::' + this.key, cb);
            },
            disconnect: function () {
                return settings.disconnect.apply(settings, arguments);
            }
        };
    }
}