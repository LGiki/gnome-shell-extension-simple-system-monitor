const { GObject, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;
const Configuration = new Settings.Prefs();

const DEFAULT_SETTINGS = {
    cpuUsageText: 'U',
    memoryUsageText: 'M',
    downloadSpeedText: '↓',
    uploadSpeedText: '↑',
    refreshInterval: 1
};

const SimpleSystemMonitorPreferences = GObject.registerClass({
    GTypeName: 'SimpleSystemMonitorPreferences',
    Template: Me.dir.get_child('prefs.ui').get_uri(),
    InternalChildren: [
        'cpu_usage_text',
        'memory_usage_text',
        'download_speed_text',
        'upload_speed_text',
        'refresh_interval'
    ]
}, class SimpleSystemMonitorPreferences extends Gtk.Box {
    _init() {
        super._init({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 30
        });

        this.update_widget_setting_values();
    }

    update_widget_setting_values() {
        this._cpu_usage_text.set_text(Configuration.CPU_USAGE_TEXT.get());
        this._memory_usage_text.set_text(Configuration.MEMORY_USAGE_TEXT.get());
        this._download_speed_text.set_text(Configuration.DOWNLOAD_SPEED_TEXT.get());
        this._upload_speed_text.set_text(Configuration.UPLOAD_SPEED_TEXT.get());
        this._refresh_interval.set_value(Configuration.REFRESH_INTERVAL.get());
    }

    reset_settings_to_default() {
        Configuration.CPU_USAGE_TEXT.set(DEFAULT_SETTINGS.cpuUsageText);
        Configuration.MEMORY_USAGE_TEXT.set(DEFAULT_SETTINGS.memoryUsageText);
        Configuration.DOWNLOAD_SPEED_TEXT.set(DEFAULT_SETTINGS.downloadSpeedText);
        Configuration.UPLOAD_SPEED_TEXT.set(DEFAULT_SETTINGS.uploadSpeedText);
        Configuration.REFRESH_INTERVAL.set(DEFAULT_SETTINGS.refreshInterval);
    }

    cpu_usage_text_changed(widget) {
        Configuration.CPU_USAGE_TEXT.set(widget.get_text());
    }

    memory_usage_text_changed(widget) {
        Configuration.MEMORY_USAGE_TEXT.set(widget.get_text());
    }

    download_usage_text_changed(widget) {
        Configuration.DOWNLOAD_SPEED_TEXT.set(widget.get_text());
    }

    upload_usage_text_changed(widget) {
        Configuration.UPLOAD_SPEED_TEXT.set(widget.get_text());
    }

    refresh_interval_changed(widget) {
        Configuration.REFRESH_INTERVAL.set(widget.get_value());
    }

    reset_settings_to_default_clicked(widget) {
        this.reset_settings_to_default();
        this.update_widget_setting_values();
    }
});

function init() { }

function buildPrefsWidget() {
    const widget = new SimpleSystemMonitorPreferences();
    widget.homogeneous = true;
    return widget;
}