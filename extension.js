import St from 'gi://St';
import Meta from 'gi://Meta';

import {Extension} from
    'resource:///org/gnome/shell/extensions/extension.js';

const WINDOW_TYPES = new Set([
    Meta.WindowType.NORMAL,
    Meta.WindowType.DIALOG,
    Meta.WindowType.MODAL_DIALOG,
    Meta.WindowType.UTILITY,
]);

const ACTIVE_COLOR = 'rgba(53, 132, 228, 0.95)';
const INACTIVE_COLOR = 'rgba(128, 128, 128, 0.45)';
const BORDER_WIDTH = 1;
const BORDER_RADIUS = 8;

class WindowBorder {
    constructor(actor, onDestroy) {
        this._actor = actor;
        this._window = actor.get_meta_window();
        this._onDestroy = onDestroy;

        this._border = new St.Widget({
            reactive: false,
            can_focus: false,
        });

        // A child of the window actor follows its stacking and animations.
        this._actor.add_child(this._border);

        this._signals = [
            [
                this._actor,
                this._actor.connect(
                    'notify::allocation',
                    () => this._syncGeometry()
                ),
            ],
            [
                this._window,
                this._window.connect(
                    'position-changed',
                    () => this._syncGeometry()
                ),
            ],
            [
                this._window,
                this._window.connect(
                    'size-changed',
                    () => this._syncGeometry()
                ),
            ],
            [
                this._window,
                this._window.connect(
                    'notify::fullscreen',
                    () => this._syncGeometry()
                ),
            ],
            [
                this._window,
                this._window.connect(
                    'notify::appears-focused',
                    () => this._syncStyle()
                ),
            ],
            [
                this._window,
                this._window.connect(
                    'unmanaged',
                    () => this.destroy()
                ),
            ],
        ];

        this._syncGeometry();
        this._syncStyle();
    }

    _syncGeometry() {
        if (!this._border)
            return;

        const frame = this._window.get_frame_rect();
        const [actorX, actorY] = this._actor.get_position();

        this._border.set_position(
            frame.x - actorX,
            frame.y - actorY
        );

        this._border.set_size(frame.width, frame.height);
        this._border.visible = !this._window.is_fullscreen();
    }

    _syncStyle() {
        if (!this._border)
            return;
    
        let focused;
    
        if (typeof this._window.appears_focused === 'function')
            focused = this._window.appears_focused();
        else if (typeof this._window.appears_focused === 'boolean')
            focused = this._window.appears_focused;
        else
            focused = this._window.has_focus();
    
        const color = focused
            ? ACTIVE_COLOR
            : INACTIVE_COLOR;
    
        this._border.set_style(
            `border: ${BORDER_WIDTH}px solid ${color};` +
            `border-radius: ${BORDER_RADIUS}px;`
        );
    }

    destroy() {
        if (!this._border)
            return;

        for (const [object, signalId] of this._signals)
            object.disconnect(signalId);

        this._signals = [];

        this._border.destroy();
        this._border = null;

        this._onDestroy(this._actor);

        this._actor = null;
        this._window = null;
        this._onDestroy = null;
    }
}

export default class MinimalWindowBorders extends Extension {
    enable() {
        this._borders = new Map();

        for (const actor of global.get_window_actors())
            this._addWindow(actor);

        this._mapSignal = global.window_manager.connect(
            'map',
            (_windowManager, actor) => this._addWindow(actor)
        );
    }

    _addWindow(actor) {
        if (!actor || this._borders.has(actor))
            return;

        const window = actor.get_meta_window();

        if (!window || !WINDOW_TYPES.has(window.get_window_type()))
            return;

        const border = new WindowBorder(
            actor,
            key => this._borders?.delete(key)
        );

        this._borders.set(actor, border);
    }

    disable() {
        if (this._mapSignal) {
            global.window_manager.disconnect(this._mapSignal);
            this._mapSignal = 0;
        }

        for (const border of [...this._borders.values()])
            border.destroy();

        this._borders.clear();
        this._borders = null;
    }
}
