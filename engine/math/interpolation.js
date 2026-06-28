export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function inverseLerp(a, b, v) {
    if (a === b) return 0;
    return (v - a) / (b - a);
}

export function remap(v, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * inverseLerp(inMin, inMax, v);
}

export function remapClamped(v, inMin, inMax, outMin, outMax) {
    const t = Math.max(0, Math.min(1, inverseLerp(inMin, inMax, v)));
    return outMin + (outMax - outMin) * t;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function saturate(value) {
    return Math.max(0, Math.min(1, value));
}

export function lerpAngle(a, b, t) {
    const delta = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return a + delta * t;
}

export function deltaAngle(current, target) {
    let delta = (target - current) % (Math.PI * 2);
    if (delta > Math.PI)  delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
}

export function damp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function smoothDamp(current, target, velocityRef, smoothTime, maxSpeed = Infinity, dt) {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTarget = target;
    const maxChange = maxSpeed * smoothTime;
    change = Math.max(-maxChange, Math.min(maxChange, change));
    const adjustedTarget = current - change;
    const temp = (velocityRef.value + omega * change) * dt;
    velocityRef.value = (velocityRef.value - omega * temp) * exp;
    let output = adjustedTarget + (change + temp) * exp;
    if ((originalTarget - current > 0) === (output > originalTarget)) {
        output = originalTarget;
        velocityRef.value = (output - originalTarget) / dt;
    }
    return output;
}

export function repeat(t, length) {
    return t - Math.floor(t / length) * length;
}

export function pingPong(t, length) {
    const cycle = Math.abs(t % (2 * length));
    return cycle <= length ? cycle : 2 * length - cycle;
}

export function quadraticBezier(t, p0, p1, p2) {
    const u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

export function cubicBezier(t, p0, p1, p2, p3) {
    const u  = 1 - t;
    const uu = u * u;
    const tt = t * t;
    return uu * u * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + tt * t * p3;
}

export function catmullRom(t, p0, p1, p2, p3) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
        2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
}

export function lerpColor(ca, cb, t, out) {
    const r = ca.r + (cb.r - ca.r) * t;
    const g = ca.g + (cb.g - ca.g) * t;
    const b = ca.b + (cb.b - ca.b) * t;
    const a = (ca.a !== undefined && cb.a !== undefined)
        ? ca.a + (cb.a - ca.a) * t
        : 1;
    if (out) {
        out.r = r;
        out.g = g;
        out.b = b;
        out.a = a;
        return out;
    }
    return { r, g, b, a };
} 
