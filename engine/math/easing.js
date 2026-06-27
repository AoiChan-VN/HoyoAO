const _c1 = 1.70158;
const _c2 = _c1 * 1.525;
const _c3 = _c1 + 1;
const _c4 = (2 * Math.PI) / 3;
const _c5 = (2 * Math.PI) / 4.5;

export function easeLinear(t) {
    return t;
}

export function easeInQuad(t) {
    return t * t;
}

export function easeOutQuad(t) {
    const u = 1 - t;
    return 1 - u * u;
}

export function easeInOutQuad(t) {
    const u = -2 * t + 2;
    return t < 0.5 ? 2 * t * t : 1 - u * u / 2;
}

export function easeInCubic(t) {
    return t * t * t;
}

export function easeOutCubic(t) {
    const u = 1 - t;
    return 1 - u * u * u;
}

export function easeInOutCubic(t) {
    const u = -2 * t + 2;
    return t < 0.5 ? 4 * t * t * t : 1 - u * u * u / 2;
}

export function easeInQuart(t) {
    return t * t * t * t;
}

export function easeOutQuart(t) {
    const u = 1 - t;
    return 1 - u * u * u * u;
}

export function easeInOutQuart(t) {
    const u = -2 * t + 2;
    return t < 0.5 ? 8 * t * t * t * t : 1 - u * u * u * u / 2;
}

export function easeInQuint(t) {
    return t * t * t * t * t;
}

export function easeOutQuint(t) {
    const u = 1 - t;
    return 1 - u * u * u * u * u;
}

export function easeInOutQuint(t) {
    const u = -2 * t + 2;
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - u * u * u * u * u / 2;
}

export function easeInSine(t) {
    return 1 - Math.cos(t * Math.PI / 2);
}

export function easeOutSine(t) {
    return Math.sin(t * Math.PI / 2);
}

export function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
        ?  Math.pow(2,  20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export function easeInCirc(t) {
    return 1 - Math.sqrt(1 - t * t);
}

export function easeOutCirc(t) {
    const u = t - 1;
    return Math.sqrt(1 - u * u);
}

export function easeInOutCirc(t) {
    const a = 2 * t;
    const b = -2 * t + 2;
    return t < 0.5
        ? (1 - Math.sqrt(1 - a * a)) / 2
        : (Math.sqrt(1 - b * b) + 1) / 2;
}

export function easeInBack(t) {
    return _c3 * t * t * t - _c1 * t * t;
}

export function easeOutBack(t) {
    const u = t - 1;
    return 1 + _c3 * u * u * u + _c1 * u * u;
}

export function easeInOutBack(t) {
    const u = 2 * t;
    const v = 2 * t - 2;
    return t < 0.5
        ? u * u * ((_c2 + 1) * u - _c2) / 2
        : (v * v * ((_c2 + 1) * v + _c2) + 2) / 2;
}

export function easeInElastic(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * _c4);
}

export function easeOutElastic(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * _c4) + 1;
}

export function easeInOutElastic(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
        ? -(Math.pow(2,  20 * t - 10) * Math.sin((20 * t - 11.125) * _c5)) / 2
        :  (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * _c5)) / 2 + 1;
}

export function easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    let x = t;
    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
    } else if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
    } else {
        x -= 2.625 / d1;
        return n1 * x * x + 0.984375;
    }
}

export function easeInBounce(t) {
    return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t) {
    return t < 0.5
        ? (1 - easeOutBounce(1 - 2 * t)) / 2
        : (1 + easeOutBounce(2 * t - 1)) / 2;
}

export function smoothStep(t) {
    return t * t * (3 - 2 * t);
}

export function smootherStep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

export const Easing = {
    linear:       easeLinear,
    inQuad:       easeInQuad,       outQuad:       easeOutQuad,       inOutQuad:       easeInOutQuad,
    inCubic:      easeInCubic,      outCubic:      easeOutCubic,      inOutCubic:      easeInOutCubic,
    inQuart:      easeInQuart,      outQuart:      easeOutQuart,      inOutQuart:      easeInOutQuart,
    inQuint:      easeInQuint,      outQuint:      easeOutQuint,      inOutQuint:      easeInOutQuint,
    inSine:       easeInSine,       outSine:       easeOutSine,       inOutSine:       easeInOutSine,
    inExpo:       easeInExpo,       outExpo:       easeOutExpo,       inOutExpo:       easeInOutExpo,
    inCirc:       easeInCirc,       outCirc:       easeOutCirc,       inOutCirc:       easeInOutCirc,
    inBack:       easeInBack,       outBack:       easeOutBack,       inOutBack:       easeInOutBack,
    inElastic:    easeInElastic,    outElastic:    easeOutElastic,    inOutElastic:    easeInOutElastic,
    inBounce:     easeInBounce,     outBounce:     easeOutBounce,     inOutBounce:     easeInOutBounce,
    smoothStep,
    smootherStep,
}; 
