"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

interface ParticleSystemProps {
  trigger?: boolean
  type?: "damage" | "heal" | "victory" | "ambient"
  intensity?: number
}

export function ParticleSystem({ trigger, type = "ambient", intensity = 10 }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const createParticle = (x: number, y: number): Particle => {
      const colors = {
        damage: ["#ef4444", "#dc2626", "#b91c1c"],
        heal: ["#10b981", "#059669", "#047857"],
        victory: ["#fbbf24", "#f59e0b", "#d97706"],
        ambient: ["#8b5cf6", "#7c3aed", "#6d28d9"],
      }

      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: colors[type][Math.floor(Math.random() * colors[type].length)],
      }
    }

    const updateParticles = () => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.05 // gravity
        particle.life++

        return particle.life < particle.maxLife
      })
    }

    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        const alpha = 1 - particle.life / particle.maxLife
        const size = 2 + (1 - particle.life / particle.maxLife) * 3

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    const animate = () => {
      updateParticles()
      renderParticles()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [type])

  useEffect(() => {
    if (trigger && canvasRef.current) {
      const canvas = canvasRef.current
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < intensity; i++) {
        const particle = createParticle(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 100)
        particlesRef.current.push(particle)
      }
    }
  }, [trigger, intensity])

  const createParticle = (x: number, y: number): Particle => {
    const colors = {
      damage: ["#ef4444", "#dc2626", "#b91c1c"],
      heal: ["#10b981", "#059669", "#047857"],
      victory: ["#fbbf24", "#f59e0b", "#d97706"],
      ambient: ["#8b5cf6", "#7c3aed", "#6d28d9"],
    }

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 3 - 1,
      life: 0,
      maxLife: 60 + Math.random() * 40,
      color: colors[type][Math.floor(Math.random() * colors[type].length)],
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
    />
  )
}
