export declare class Particle {
    note: number;
    x: number;
    y: number;
    lastTriggerTime: number;
    constructor(note: number, x: number, y: number);
}
export declare type Callback = (wheel: Wheel, particle: Particle, time: number, distance: number) => void;
export declare class Wheel {
    radius: number;
    numSegments: number;
    speed: number;
    octave: number;
    x: number;
    y: number;
    constructor(radius: number, numSegments: number, speed: number, octave: number, x: number, y: number);
    process(particles: Particle[], callback: Callback, from: number, to: number): void;
}
