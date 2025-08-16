"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Floating orbs
    const orbs: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      opacity: number
      color: string
    }> = []

    // Create orbs
    for (let i = 0; i < 15; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: ["#8b5cf6", "#10b981", "#fbbf24"][Math.floor(Math.random() * 3)],
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off edges
        if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1
        if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1

        // Draw orb with glow
        ctx.save()
        ctx.globalAlpha = orb.opacity
        ctx.fillStyle = orb.color
        ctx.shadowBlur = 20
        ctx.shadowColor = orb.color
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw connections between nearby orbs
      orbs.forEach((orb1, i) => {
        orbs.slice(i + 1).forEach((orb2) => {
          const dx = orb1.x - orb2.x
          const dy = orb1.y - orb2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.save()
            ctx.globalAlpha = ((150 - distance) / 150) * 0.2
            ctx.strokeStyle = "#8b5cf6"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(orb1.x, orb1.y)
            ctx.lineTo(orb2.x, orb2.y)
            ctx.stroke()
            ctx.restore()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" }}
    />
  )
}
