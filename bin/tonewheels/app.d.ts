import { Callback, Particle, Wheel } from "./model.js";
export declare class ToneWheels {
    readonly canvas: HTMLCanvasElement;
    readonly wheels: Wheel[];
    readonly particles: Particle[];
    readonly graphics: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement);
    createWheel(radius: number, numSegments: number, speed: number, octave: number, x: number, y: number): void;
    createParticle(note: number, x: number, y: number): void;
    process(callback: Callback, from: number, to: number): void;
    render(currentTime: number, musicalTime: number): void;
    initEvents(): void;
}
