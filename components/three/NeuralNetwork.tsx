'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

interface NeuralNode {
  mesh: THREE.Mesh
  position: THREE.Vector3
  velocity: THREE.Vector3
}

interface EnergyPacket {
  mesh: THREE.Mesh
  fromIdx: number
  toIdx: number
  progress: number
  speed: number
}

const NODE_COUNT = 120
const CONNECTION_DIST = 160
const MAX_SEGMENTS = 600
const PACKET_COUNT = 12

export default function NeuralNetwork({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isActiveRef = useRef(isActive)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 1.0
    const canvas = renderer.domElement
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;'
    container.appendChild(canvas)

    // ── Scene & Camera ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030915)
    scene.fog = new THREE.FogExp2(0x030915, 0.0007)
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000)
    camera.position.set(0, 0, 650)

    // ── Post-processing ──
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8, 0.3, 0.22
    )
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    // ── Nodes ──
    const nodes: NeuralNode[] = []
    const geometries = [
      new THREE.IcosahedronGeometry(3, 0),
      new THREE.IcosahedronGeometry(4, 0),
      new THREE.OctahedronGeometry(4, 0),
      new THREE.TetrahedronGeometry(5, 0),
    ]

    for (let i = 0; i < NODE_COUNT; i++) {
      const geoIdx = Math.floor(Math.random() * geometries.length)
      const wireframe = Math.random() < 0.35
      const isGreen = Math.random() < 0.15
      const mat = new THREE.MeshBasicMaterial({
        color: isGreen ? 0x39ff14 : 0x00d4ff,
        wireframe,
        transparent: true,
        opacity: wireframe ? 0.28 : 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geometries[geoIdx], mat)
      mesh.position.set(
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 700,
        (Math.random() - 0.5) * 500
      )
      mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0)
      scene.add(mesh)
      nodes.push({
        mesh,
        position: mesh.position,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.12
        ),
      })
    }

    // ── Connection Lines (pre-allocated LineSegments) ──
    const linePositions = new Float32Array(MAX_SEGMENTS * 2 * 3)
    const lineColors = new Float32Array(MAX_SEGMENTS * 2 * 3)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
    lineGeo.setDrawRange(0, 0)
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    scene.add(new THREE.LineSegments(lineGeo, lineMat))

    // ── Energy Packets ──
    const packetGeo = new THREE.SphereGeometry(2.5, 8, 8)
    const packets: EnergyPacket[] = []

    function getConnected(idx: number): number[] {
      const result: number[] = []
      const pos = nodes[idx].position
      for (let i = 0; i < nodes.length; i++) {
        if (i !== idx && pos.distanceTo(nodes[i].position) < CONNECTION_DIST) result.push(i)
      }
      return result
    }

    function spawnPacket(fromIdx?: number): EnergyPacket {
      const from = fromIdx ?? Math.floor(Math.random() * NODE_COUNT)
      const connected = getConnected(from)
      const to = connected.length > 0
        ? connected[Math.floor(Math.random() * connected.length)]
        : Math.floor(Math.random() * NODE_COUNT)
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff4757,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(packetGeo, mat)
      mesh.position.copy(nodes[from].position)
      scene.add(mesh)
      return { mesh, fromIdx: from, toIdx: to, progress: 0, speed: 0.008 + Math.random() * 0.012 }
    }

    for (let i = 0; i < PACKET_COUNT; i++) {
      packets.push(spawnPacket())
    }

    // ── Mouse ──
    let mouseX = 0, mouseY = 0
    let targetX = 0, targetY = 0
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 120
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 80
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation Loop ──
    let raf: number
    let time = 0

    function animate() {
      raf = requestAnimationFrame(animate)
      time += 0.016

      // Camera parallax
      targetX += (mouseX - targetX) * 0.04
      targetY += (mouseY - targetY) * 0.04
      camera.position.x = targetX
      camera.position.y = targetY
      camera.lookAt(0, 0, 0)

      // Update nodes
      nodes.forEach((node, i) => {
        node.position.add(node.velocity)
        node.mesh.rotation.x += 0.004
        node.mesh.rotation.y += 0.006

        if (Math.abs(node.position.x) > 450) node.velocity.x *= -1
        if (Math.abs(node.position.y) > 350) node.velocity.y *= -1
        if (Math.abs(node.position.z) > 250) node.velocity.z *= -1

        // Activation wave when AI is running
        if (isActiveRef.current) {
          const dist = node.position.length()
          const wave = Math.sin(dist * 0.012 - time * 3) * 0.5 + 0.5
          const mat = node.mesh.material as THREE.MeshBasicMaterial
          mat.opacity = 0.3 + wave * 0.7
          const h = 0.52 + wave * 0.15
          mat.color.setHSL(h, 1, 0.5 + wave * 0.3)
        } else {
          const mat = node.mesh.material as THREE.MeshBasicMaterial
          const isGreenNode = (i % 7 === 0)
          mat.opacity = isGreenNode ? 0.28 : (mat.wireframe ? 0.28 : 0.5)
        }
      })

      // Update connections
      let segCount = 0
      for (let i = 0; i < nodes.length && segCount < MAX_SEGMENTS; i++) {
        for (let j = i + 1; j < nodes.length && segCount < MAX_SEGMENTS; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position)
          if (dist < CONNECTION_DIST) {
            const fade = (1 - dist / CONNECTION_DIST) * 0.25
            const finalFade = fade * (isActiveRef.current ? 1.8 : 1)
            const base = segCount * 6
            linePositions[base] = nodes[i].position.x
            linePositions[base + 1] = nodes[i].position.y
            linePositions[base + 2] = nodes[i].position.z
            linePositions[base + 3] = nodes[j].position.x
            linePositions[base + 4] = nodes[j].position.y
            linePositions[base + 5] = nodes[j].position.z
            const r = 0
            const g = isActiveRef.current ? finalFade * 0.5 : finalFade * 0.2
            const b = isActiveRef.current ? finalFade * 0.7 : finalFade
            lineColors[base] = r; lineColors[base + 1] = g; lineColors[base + 2] = b + finalFade
            lineColors[base + 3] = r; lineColors[base + 4] = g; lineColors[base + 5] = b + finalFade
            segCount++
          }
        }
      }
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.attributes.color.needsUpdate = true
      lineGeo.setDrawRange(0, segCount * 2)

      // Update energy packets
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i]
        p.progress += p.speed
        if (p.progress >= 1) {
          scene.remove(p.mesh)
          const newFrom = p.toIdx
          packets[i] = spawnPacket(newFrom)
        } else {
          p.mesh.position.lerpVectors(nodes[p.fromIdx].position, nodes[p.toIdx].position, p.progress)
          const mat = p.mesh.material as THREE.MeshBasicMaterial
          const pulse = Math.sin(p.progress * Math.PI)
          mat.opacity = 0.5 + pulse * 0.5
        }
      }

      composer.render()
    }

    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      geometries.forEach(g => g.dispose())
      lineGeo.dispose()
      lineMat.dispose()
      packetGeo.dispose()
      renderer.dispose()
      composer.dispose()
      container.removeChild(canvas)
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />
}
