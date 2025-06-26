import React, { useEffect, useRef, useState } from "react"
import * as Tone from "tone"
import { Haptic } from "./haptic"

const synthNotes = [
  
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4"
]

const leftPercentOffset = 8 

export const SynthPad: React.FC = () => {
  const [active, setActive] = useState(false)
  const synthRef = useRef<Tone.DuoSynth | null>(null)
  const playingRef = useRef(false)
  const padRef = useRef<HTMLDivElement>(null)

  const [feedback, setFeedback] = useState<{ x: number; y: number } | null>(null)
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth)
  
useEffect(() => {
  const handleResize = () => {
    setIsPortrait(window.innerHeight > window.innerWidth)
  }
  window.addEventListener("resize", handleResize)
  return () => window.removeEventListener("resize", handleResize)
}, [])

  useEffect(() => {
    synthRef.current = new Tone.DuoSynth().toDestination()
    Tone.Transport.bpm.value = 125
    synthRef.current.volume.value = -20

    return () => {
      synthRef.current?.dispose()
    }
  }, [])

  const getXY = (e: TouchEvent | MouseEvent) => {
    let clientX = 0
    let clientY = 0
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ("clientX" in e) {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = padRef.current?.getBoundingClientRect()
    if (!rect) return null

    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height

    if (x < 0 || x > 1 || y < 0 || y > 1) return null
    return { x, y }
  }

  const triggerAttack = async (e: TouchEvent | MouseEvent) => {
    if (!active) return
    e.preventDefault()
    await Tone.start()

    const pos = getXY(e)
    if (!pos) return

    //add touch indicator
    const rect = padRef.current?.getBoundingClientRect()
    if (rect) {
    setFeedback({
        x: rect.left + pos.x * rect.width,
        y: rect.top + pos.y * rect.height,
    })
    }



    const { x, y } = pos
    const note = synthNotes[Math.round(x * (synthNotes.length - 1))]
    synthRef.current?.triggerAttack(note)
    synthRef.current?.set({ vibratoAmount: y })
    playingRef.current = true

    Haptic(1.0,1.0);
  }

  const updateSound = (e: TouchEvent | MouseEvent) => {
    if (!active || !playingRef.current) return
    const pos = getXY(e)
    if (!pos) return

    //update touch indicator on drag
    const rect = padRef.current?.getBoundingClientRect()
    if (rect) {
    setFeedback({
        x: rect.left + pos.x * rect.width,
        y: rect.top + pos.y * rect.height,
    })
    }

    const { x, y } = pos

    const note = synthNotes[Math.round(x * (synthNotes.length - 1))]
    synthRef.current?.setNote(note)
    synthRef.current?.set({ vibratoAmount: y })

    Haptic(0.5,0.2)
  }

  const triggerRelease = () => {
    if (!active || !playingRef.current) return
    synthRef.current?.triggerRelease()
    playingRef.current = false
    //hide touch
    setFeedback(null)
  }

  useEffect(() => {
    const el = padRef.current
    if (!el) return

    el.addEventListener("touchstart", triggerAttack, { passive: false })
    el.addEventListener("touchmove", updateSound, { passive: false })
    el.addEventListener("touchend", triggerRelease)

    el.addEventListener("mousedown", triggerAttack)
    el.addEventListener("mousemove", updateSound)
    el.addEventListener("mouseup", triggerRelease)

    return () => {
      el.removeEventListener("touchstart", triggerAttack)
      el.removeEventListener("touchmove", updateSound)
      el.removeEventListener("touchend", triggerRelease)

      el.removeEventListener("mousedown", triggerAttack)
      el.removeEventListener("mousemove", updateSound)
      el.removeEventListener("mouseup", triggerRelease)
    }
  }, [active])

 

  return (
    <>
      {active && (
        <div
  ref={padRef}
  style={{
    position: "fixed",
    background: "rgba(244, 244, 244, 0.1)",
    borderRadius: "24px",
    touchAction: "none",
    zIndex: 1,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    width: "90vw",
    maxWidth: "400px",
    maxHeight: "400px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ...(isPortrait
      ? {
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          height: "90vw"
        }
      : {
          bottom: 20,
          right: 20,
          height: "90vh",
          transform: "translateY(-10%)",
          width: "90vh"
        }),
  }}
>
  {/* 8 evenly spaced vertical lines */}
  {Array.from({ length: 7 }, (_, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        left: `calc(${(i / 7) * 100}% + ${leftPercentOffset}%)`,
        top: 100,
        bottom: 100,
        width: "10px",
        background: "rgb(46, 47, 49)",
        opacity: 0.02,
        transform: "translateX(-1px)",
        pointerEvents: "none",
        borderRadius:"10px",
      }}
    />
  ))}
</div>
      )}

      {feedback && (
        <div
            style={{
            position: "fixed",
            left: feedback.x - 40,
            top: feedback.y - 40,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            pointerEvents: "none",
            transition: "opacity 0.2s ease",
            zIndex: 2,
            }}
        />
        )}

      <div
        style={{
          position: "fixed",
          bottom: 10,
          right: 20,
          zIndex: 2,
          padding: "10px 14px",
          background: "transparent",
          color: !active ? "#fff" : "#ccc",
          border: `2px solid ${!active ? "#fff" : "#888"}`,
          borderRadius: 8,
          opacity:"0.5",
          cursor: "pointer",
          fontSize: 16,
          boxShadow: "1px 1px 5px rgba(14, 1, 1, 0.2)",
          transition: "all 0.2s ease",
        }}
        onClick={() => setActive((prev) => !prev)}
      >
        <span style={{ textDecoration: active ? "line-through":"none" }}>
            Synth
            </span>
      </div>
    </>
  )
}