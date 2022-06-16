export class Particle {
    constructor(note, x, y) {
        this.note = note;
        this.x = x;
        this.y = y;
        this.lastTriggerTime = Number.NEGATIVE_INFINITY;
    }
}
export class Wheel {
    constructor(radius, numSegments, speed, octave, x, y) {
        this.radius = radius;
        this.numSegments = numSegments;
        this.speed = speed;
        this.octave = octave;
        this.x = x;
        this.y = y;
    }
    process(particles, callback, from, to) {
        const p0 = (this.speed * from) % 1.0;
        const p1 = (this.speed * to) % 1.0;
        particles.forEach((particle) => {
            const dx = particle.x - this.x;
            const dy = particle.y - this.y;
            if (dx * dx + dy * dy > this.radius * this.radius) {
                return;
            }
            const abs = 1.0 + (Math.atan2(dy, dx) + Math.PI * 0.5) / (Math.PI * 2.0);
            let j = this.numSegments;
            while (--j > -1) {
                let rel = j / this.numSegments + abs;
                rel = rel - Math.floor(rel);
                if (p1 > p0) {
                    if (rel >= p0 && rel < p1) {
                        callback(this, particle, rel - p0, dx / this.radius);
                    }
                }
                else {
                    if (rel >= p0 && rel < 1.0) {
                        callback(this, particle, rel - p0, dx / this.radius);
                    }
                    else if (rel >= 0.0 && rel < p1) {
                        callback(this, particle, 1.0 - p0 + rel, dx / this.radius);
                    }
                }
            }
        });
    }
}
//# sourceMappingURL=model.js.map