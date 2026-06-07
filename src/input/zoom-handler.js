/* ==========================================================================
   PINCH TO ZOOM / WHEEL ZOOM
   File: src/input/zoom-handler.js
   ========================================================================== */

import {
    getCameraState,
    setCameraFov
} from '../core/store.js';

export function initializeZoomHandler(canvas) {

    let pinchDistance = null;

    const wheelSensitivity = 0.05;
    const pinchSensitivity = 0.08;

    function getDistance(touchA, touchB) {

        const dx =
            touchA.clientX -
            touchB.clientX;

        const dy =
            touchA.clientY -
            touchB.clientY;

        return Math.hypot(dx, dy);
    }

    function onWheel(event) {

        event.preventDefault();

        const camera =
            getCameraState();

        const nextFov =
            camera.fov +
            event.deltaY *
            wheelSensitivity;

        setCameraFov(nextFov);
    }

    function onTouchStart(event) {

        if (event.touches.length !== 2) {
            return;
        }

        pinchDistance =
            getDistance(
                event.touches[0],
                event.touches[1]
            );
    }

    function onTouchMove(event) {

        if (
            event.touches.length !== 2 ||
            pinchDistance === null
        ) {
            return;
        }

        event.preventDefault();

        const currentDistance =
            getDistance(
                event.touches[0],
                event.touches[1]
            );

        const delta =
            currentDistance -
            pinchDistance;

        pinchDistance =
            currentDistance;

        const camera =
            getCameraState();

        const nextFov =
            camera.fov -
            delta *
            pinchSensitivity;

        setCameraFov(nextFov);
    }

    function onTouchEnd() {

        if (pinchDistance !== null) {
            pinchDistance = null;
        }
    }

    canvas.addEventListener(
        'wheel',
        onWheel,
        { passive: false }
    );

    canvas.addEventListener(
        'touchstart',
        onTouchStart,
        { passive: false }
    );

    canvas.addEventListener(
        'touchmove',
        onTouchMove,
        { passive: false }
    );

    canvas.addEventListener(
        'touchend',
        onTouchEnd,
        { passive: true }
    );

    canvas.addEventListener(
        'touchcancel',
        onTouchEnd,
        { passive: true }
    );

    return function destroy() {

        canvas.removeEventListener(
            'wheel',
            onWheel
        );

        canvas.removeEventListener(
            'touchstart',
            onTouchStart
        );

        canvas.removeEventListener(
            'touchmove',
            onTouchMove
        );

        canvas.removeEventListener(
            'touchend',
            onTouchEnd
        );

        canvas.removeEventListener(
            'touchcancel',
            onTouchEnd
        );
    };
} 
