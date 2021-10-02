const { GObject, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;
const Configuration = new Settings.Prefs();

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

        this._cpu_usage_text.set_text(Configuration.CPU_USAGE_TEXT.get());

        this._memory_usage_text.set_text(Configuration.MEMORY_USAGE_TEXT.get());

        this._download_speed_text.set_text(Configuration.DOWNLOAD_SPEED_TEXT.get());

        this._upload_speed_text.set_text(Configuration.UPLOAD_SPEED_TEXT.get());

        this._refresh_interval.set_value(Configuration.REFRESH_INTERVAL.get());
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
}
);

function init() { }

function buildPrefsWidget() {
    const widget = new SimpleSystemMonitorPreferences();
    widget.homogeneous = true;
    return widget;
}