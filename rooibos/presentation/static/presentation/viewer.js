var Viewer = function (options) {

    this.mirador = Mirador(options);
    var viewer = this;

    if (window.opener && window.opener.viewer) {
        this.windows = window.opener.viewer.windows;
        this.synced = window.opener.viewer.synced;
        this.active = window.opener.viewer.active;
    } else {
        this.windows = [window];
        this.synced = false;
        this.active = {
            window: 0,
            slot: 0
        }
    }

    this.additionalWindow = function () {
        var next = getNextCanvases()[0];
        var url = window.location.href;
        if (url.indexOf('canvas=') === -1) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + 'canvas=' + next;
        } else {
            url = url.replace(/canvas=[^&]+/, 'canvas=' + next);
        }
        viewer.windows.push(
            window.open(url, '_blank', 'height=600,width=800')
        );
    };

    this.syncViewers = function () {
        var synced = !viewer.synced;
        forEachWindow(function (w) {
            w.viewer.setSynced(synced);
        });
    };

    this.setSynced = function (synced) {
        this.synced = synced;
        jQuery('#sync-viewers span')
            .toggleClass('fa-link', !synced)
            .toggleClass('fa-unlink', synced);
        jQuery('body').toggleClass('mdid-synced', synced);
    };

    var forEachWindow = function (callback) {
        viewer.windows.forEach(function (window, windowIndex) {
            if (!window.closed) {
                callback(window, windowIndex);
            }
        });
    };

    this.forEachImageView = function (callback) {
        var slots = viewer.mirador.viewer.workspace.slots;
        slots.forEach(function (slot, slotIndex) {
            var imageView = slot.window && slot.window.focusModules.ImageView;
            if (imageView) {
                callback(imageView, slotIndex);
            }
        });
    };

    var forEachWindowAndImageViewer = function (callback) {
        forEachWindow(function (w, windowIndex) {
            w.viewer.forEachImageView(function (imageView, slotIndex) {
                callback(imageView, windowIndex, slotIndex);
            });
        });
    };

    var imageViewNavigate = function (imageView, jump) {
        var target = imageView.currentImgIndex + jump;
        target = Math.min(imageView.imagesList.length - 1, Math.max(0, target));
        if (target !== imageView.currentImgIndex) {
            imageView.eventEmitter.publish(
                'SET_CURRENT_CANVAS_ID.' + imageView.windowId,
                imageView.imagesList[target]['@id']
            );
        }
    };

    var countUsedCanvases = function () {
        var count = 0;
        forEachWindowAndImageViewer(function () {
            count++;
        });
        return count;
    };

    var whenActive = function (callback) {
        return function () {
            var imageView = arguments[0];
            if (viewer.synced ||
                    jQuery(imageView.element).parents('.mdid-active').length) {
                callback.apply(this, arguments);
            }
        };
    };

    var emitEvent = function (event, options) {
        var _emitEvent = function (window) {
            if (!window.closed) {
                window.viewer.mirador.eventEmitter.publish(event, options);
            }
        };
        if (viewer.synced) {
            forEachWindow(_emitEvent);
        } else {
            _emitEvent(viewer.windows[viewer.active.window]);
        }
    };

    var keydown = function (event) {
        var distance = viewer.synced ? countUsedCanvases() : 1;
        if (event.key === 'ArrowLeft') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                imageViewNavigate(imageView, -distance);
            }));
        } else
        if (event.key === 'ArrowRight') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                imageViewNavigate(imageView, distance);
            }));
        } else
        if (event.key === ' ') {
            viewer.markAsActive(event.shiftKey ? -1 : 1);
        } else
        if (event.key === 's') {
            viewer.syncViewers();
        } else
        if (event.key === 'r') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                imageView.osd.viewport.goHome();
            }));
        } else
        if (event.key === 'h') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                jQuery(imageView.element).toggleClass('mdid-hide-image')
            }));
        } else
        if (event.key === 'i') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                jQuery(imageView.element)
                    .find('.mirador-canvas-metadata-toggle').click();
            }));
        } else
        if (event.key === 'ArrowUp') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                jQuery(imageView.element)
                    .find('.mirador-osd-zoom-in').click();
            }));
        } else
        if (event.key === 'ArrowDown') {
            forEachWindowAndImageViewer(whenActive(function (imageView) {
                jQuery(imageView.element)
                    .find('.mirador-osd-zoom-out').click();
            }));
        } else
        if (event.key === 'u') {
            emitEvent('RESET_WORKSPACE_LAYOUT', {
                layoutDescription:
                    Mirador.layoutDescriptionFromGridString('1x1')
            });
            delayWrapper(viewer.markAsActive.bind(viewer))();
        } else
        if (event.key === 'y') {
            emitEvent('RESET_WORKSPACE_LAYOUT', {
                layoutDescription:
                    Mirador.layoutDescriptionFromGridString('1x2')
            });
            delayWrapper(viewer.markAsActive.bind(viewer))();
        } else
        if (event.key === 'x') {
            emitEvent('RESET_WORKSPACE_LAYOUT', {
                layoutDescription:
                    Mirador.layoutDescriptionFromGridString('2x1')
            });
            delayWrapper(viewer.markAsActive.bind(viewer))();
        } else
        if (event.key === 'f') {
            emitEvent('TOGGLE_FULLSCREEN');
        }
    };

    var eventWrapper = function (eventHandler, onlyWhenSynced) {
        return function (event) {
            if (!onlyWhenSynced || viewer.synced) {
                eventHandler(event);
            }
            event.stopPropagation();
        };
    };

    var mouseMove = function () {
        var mouseMoveTimeout;
        var mouseMoveHudHidden = false;
        var mouseMove = function () {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(function () {
                jQuery('.mirador-hud,.mirador-main-menu')
                    .addClass('mdid-hud-hidden');
                mouseMoveHudHidden = true;
            }, 2000);
            if (mouseMoveHudHidden) {
                jQuery('.mirador-hud,.mirador-main-menu')
                    .removeClass('mdid-hud-hidden');
                mouseMoveHudHidden = false;
            }
        };
        mouseMove();
        return mouseMove;
    }();

    document.addEventListener('keydown', eventWrapper(keydown), true);
    document.addEventListener('mousemove', mouseMove);


    var delayWrapper = function (callback) {
        return function () {
            setTimeout(callback);
        };
    };

    var getUsedCanvases = function () {
        return viewer.mirador.viewer.workspace.slots.map(function (slot) {
            return slot.window ? slot.window.canvasID : null;
        });
    };

    var getManifest = function () {
        var manifests =
            viewer.mirador.viewer.state.getStateProperty('manifests');
        for (var manifest in manifests) {
            if (!manifests.hasOwnProperty(manifest)) {
                continue;
            }
            return manifests[manifest];
        }
    };

    var getNextCanvases = function () {
        var manifest = getManifest();
        var canvases = manifest.jsonLd.sequences[0].canvases;
        var used = getUsedCanvases();
        var next = [];
        var canvasId;
        canvases.forEach(function (canvas) {
            canvasId = canvas['@id'];
            if (used.indexOf(canvasId) > -1) {
                next = [];
            } else {
                next.push(canvasId);
            }
        });
        // if no further slides found, return last one
        if (!next.length && canvasId) {
            next.push(canvasId);
        }
        return next;
    };

    var fillEmptySlots = function () {
        var next = getNextCanvases();
        var manifest = getManifest();
        viewer.mirador.viewer.workspace.slots.forEach(function (slot) {
            if (!slot.window) {
                var windowConfig = {
                    manifest: manifest,
                    canvasID: next.length === 1 ? next[0] : next.shift(),
                    viewType: 'ImageView'
                };
                viewer.mirador.eventEmitter.publish(
                    'ADD_WINDOW', windowConfig);
            }
        });
    };


    this.markAsActive = function (jump) {
        jump = jump || 0;
        var positions = [];
        var activePosition = 0;
        var active = this.active;
        forEachWindowAndImageViewer(function (imageView, windowIndex, slotIndex) {
            var element = jQuery(imageView.element)
                .parents('.slot')
                .removeClass('mdid-active')
                .removeClass('mdid-active-frame');
            positions.push({
                window: windowIndex,
                slot: slotIndex,
                element: element
            });
            if (active.window === windowIndex && active.slot === slotIndex) {
                activePosition = positions.length - 1;
            }
        });
        var count = positions.length;
        if (!count) {
            return;
        }
        activePosition = (activePosition + jump + count) % count;
        if (count > 1) {
            positions[activePosition].element.addClass('mdid-active-frame');
        }
        positions[activePosition].element.addClass('mdid-active');
        active.window = positions[activePosition].window;
        active.slot = positions[activePosition].slot;
    };


    this.mirador.eventEmitter.subscribe(
        'RESET_WORKSPACE_LAYOUT', delayWrapper(fillEmptySlots));

    this.mirador.eventEmitter.subscribe('ADD_WINDOW', function () {
        delayWrapper(viewer.markAsActive.bind(viewer))();
    });

    return this;
};