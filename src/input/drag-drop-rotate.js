/* ==========================================================================
   DRAG DROP CAMERA ROTATION
   File: src/input/drag-drop-rotate.js
   ========================================================================== */

import {
    getCameraState,
    setCameraRotation
} from '../core/store.js';

export function initializeDragDropRotate(canvas) {

    let isDragging = false;

    let lastPointerX = 0;
    let lastPointerY = 0;

    const rotationSpeed = 0.18;

    function onPointerDown(event) {

        isDragging = true;

        lastPointerX = event.clientX;
        lastPointerY = event.clientY;

        canvas.setPointerCapture(
            event.pointerId
        );
    }

    function onPointerMove(event) {

        if (!isDragging) {
            return;
        }

        const deltaX =
            event.clientX -
            lastPointerX;

        const deltaY =
            event.clientY -
            lastPointerY;

        lastPointerX =
            event.clientX;

        lastPointerY =
            event.clientY;

        const camera =
            getCameraState();

        const yaw =
            camera.yaw -
            deltaX * rotationSpeed;

        const pitch =
            camera.pitch -
            deltaY * rotationSpeed;

        setCameraRotation(
            yaw,
            pitch
        );
    }

    function onPointerUp(event) {

        isDragging = false;

        if (
            canvas.hasPointerCapture(
                event.pointerId
            )
        ) {
            canvas.releasePointerCapture(
                event.pointerId
            );
        }
    }

    function onPointerCancel(event) {

        isDragging = false;

        if (
            canvas.hasPointerCapture(
                event.pointerId
            )
        ) {
            canvas.releasePointerCapture(
                event.pointerId
            );
        }
    }

    canvas.addEventListener(
        'pointerdown',
        onPointerDown,
        { passive: true }
    );

    window.addEventListener(
        'pointermove',
        onPointerMove,
        { passive: true }
    );

    window.addEventListener(
        'pointerup',
        onPointerUp,
        { passive: true }
    );

    window.addEventListener(
        'pointercancel',
        onPointerCancel,
        { passive: true }
    );

    return function destroy() {

        canvas.removeEventListener(
            'pointerdown',
            onPointerDown
        );

        window.removeEventListener(
            'pointermove',
            onPointerMove
        );

        window.removeEventListener(
            'pointerup',
            onPointerUp
        );

        window.removeEventListener(
            'pointercancel',
            onPointerCancel
        );
    };
}
