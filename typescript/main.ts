import {barsToSeconds, dbToGain, midiToHz} from "./audio/common.js"
import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet, StereoMeterWorklet} from "./audio/meter/worklet.js"
import {Sequencer} from "./audio/sequencing.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {ObservableValueImpl} from "./lib/common.js"
import {HTML} from "./lib/dom.js"
import {ToneWheels} from "./tonewheels/app.js"

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader")
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()))
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"))
    const context = newAudioContext()
    boot.registerProcess(LimiterWorklet.loadModule(context))
    boot.registerProcess(MeterWorklet.loadModule(context))
    await boot.waitForCompletion()

    const echo = (context: AudioContext, input: AudioNode, output: AudioNode, delayTime: number, feedback: number, wetLevel: number): void => {
        const delay = context.createDelay()
        delay.delayTime.value = delayTime
        const feedbackGain = context.createGain()
        feedbackGain.gain.value = feedback
        const wetGain = context.createGain()
        wetGain.gain.value = wetLevel
        input.connect(delay).connect(feedbackGain).connect(delay)
        feedbackGain.connect(wetGain).connect(output)
    }

    const canvas: HTMLCanvasElement = HTML.query('canvas')
    const toneWheels = new ToneWheels(canvas)
    const meterWorklet = new StereoMeterWorklet(context)
    const meter = meterWorklet.domElement
    meter.style.left = '50%'
    meter.style.transform = 'translate(-50%, 24px)'
    HTML.query('main').appendChild(meter)
    const setup = () => {
        toneWheels.createParticle(0, -96, -112)
        toneWheels.createParticle(3, -208, -120)
        toneWheels.createParticle(5, -80, -16)
        toneWheels.createParticle(8, 80, 102)
        toneWheels.createParticle(10, 80, 48)
        toneWheels.createWheel(128, 2, 0.5, 4, 112, 144)
        toneWheels.createWheel(128, 5, 0.25, 5, -4, 16)
        toneWheels.createWheel(128, 3, 0.25, 6, -144, -112)
    }
    setup()

    const sequencer = new Sequencer(context, new ObservableValueImpl(120))
    const master = context.createGain()
    master.gain.value = dbToGain(-9.0)
    master.connect(meterWorklet).connect(context.destination)
    echo(context, master, context.destination, barsToSeconds(3.0 / 16.0, sequencer.bpm.get()), 0.5, 0.3)
    sequencer.moving.addObserver(() => toneWheels.process((wheel, particle, delta, pan) => {
        const startTime = particle.lastTriggerTime = sequencer.toSeconds(sequencer.blockPosition + delta)
        const endTime = startTime + 0.250
        const oscillator = context.createOscillator()
        oscillator.frequency.value = midiToHz(wheel.octave * 12 + particle.note, 440.0)
        oscillator.type = "triangle"
        oscillator.start(startTime)
        oscillator.stop(endTime)
        const envelope = context.createGain()
        envelope.gain.value = 1.0
        envelope.gain.setValueAtTime(1.0, startTime)
        envelope.gain.linearRampToValueAtTime(0.0, endTime)
        const stereoPanner = context.createStereoPanner()
        stereoPanner.pan.value = pan
        oscillator.connect(envelope).connect(stereoPanner).connect(master)
    }, sequencer.blockPosition, sequencer.blockComplete))
    sequencer.start()

    // --- BOOT ENDS ---
    const frame = () => {
        toneWheels.render(context.currentTime, sequencer.bars())
        requestAnimationFrame(frame)
    }
    frame()

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), {passive: false})
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()