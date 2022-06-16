import {pointer} from "../lib/dom.js"
import {Callback, Particle, Wheel} from "./model.js"

export class ToneWheels {
    readonly wheels: Wheel[] = []
    readonly particles: Particle[] = []
    readonly graphics: CanvasRenderingContext2D

    constructor(readonly canvas: HTMLCanvasElement) {
        this.graphics = this.canvas.getContext("2d")
        this.initEvents()
    }

    createWheel(radius: number, numSegments: number, speed: number, octave: number, x: number, y: number): void {
        this.wheels.push(new Wheel(radius, numSegments, speed, octave, x, y))
    }

    createParticle(note: number, x: number, y: number): void {
        this.particles.push(new Particle(note, x, y))
    }

    process(callback: Callback, from: number, to: number): void {
        for (let wheel of this.wheels) {
            wheel.process(this.particles, callback, from, to)
        }
    }

    render(currentTime: number, musicalTime: number): void {
        const canvas = this.canvas
        const graphics = this.graphics
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        canvas.width = width * devicePixelRatio
        canvas.height = height * devicePixelRatio
        graphics.save()
        graphics.scale(devicePixelRatio, devicePixelRatio)
        graphics.clearRect(0, 0, width, height)
        graphics.translate(width * 0.5, height * 0.5)
        for (let wheel of this.wheels) {
            const x = wheel.x
            const y = wheel.y
            graphics.beginPath()
            graphics.fillStyle = "#AAA"
            graphics.arc(x, wheel.y, 3.0, 0.0, Math.PI * 2.0, false)
            graphics.fill()
            graphics.beginPath()
            graphics.strokeStyle = "#999"
            const position = musicalTime * wheel.speed * Math.PI * 2.0
            const r = wheel.radius
            const step = (Math.PI * 2) / wheel.numSegments
            for (let i = 0; i < wheel.numSegments; ++i) {
                const angle = i * step + position
                const sn = Math.sin(angle)
                const cs = Math.cos(angle)
                graphics.moveTo(x + sn * 8, y + cs * -8)
                graphics.lineTo(x + sn * r, y + cs * -r)
            }
            graphics.stroke()
        }
        for (let particle of this.particles) {
            const playing = (currentTime - particle.lastTriggerTime < 0.050)
            graphics.beginPath()
            graphics.fillStyle = playing ? "#FFF" : "#888"
            graphics.arc(particle.x, particle.y, 5.0, 0.0, Math.PI * 2.0, false)
            graphics.fill()
            if (playing) {
                graphics.beginPath()
                graphics.strokeStyle = "rgba(255,255,255,0.5)"
                graphics.arc(particle.x, particle.y, 9.0, 0.0, Math.PI * 2.0, false)
                graphics.stroke()
            }
        }
        graphics.restore()
    }

    initEvents(): void {
        let target: Particle | Wheel = null
        let tx: number, ty: number, mx: number, my: number
        pointer(this.canvas, event => {
            const rect = this.canvas.getBoundingClientRect()
            mx = event.clientX - rect.x - rect.width * 0.5
            my = event.clientY - rect.y - rect.height * 0.5
            target = null
            let min: number = 8
            const test = (objects: (Particle | Wheel)[]): void => {
                for (let object of objects) {
                    const dx = object.x - mx
                    const dy = object.y - my
                    const dd = Math.sqrt(dx * dx + dy * dy)
                    if (min > dd) {
                        min = dd
                        tx = object.x
                        ty = object.y
                        target = object
                    }
                }
            }
            test(this.wheels)
            test(this.particles)
        }, event => {
            if (null === target) {
                return
            }
            const rect = this.canvas.getBoundingClientRect()
            const x = event.clientX - rect.x - rect.width * 0.5
            const y = event.clientY - rect.y - rect.height * 0.5
            target.x = tx + (x - mx)
            target.y = ty + (y - my)
        }, ignore => {
            target = null
        })
    }
}