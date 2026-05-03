'use client'
import dynamic from 'next/dynamic'
import { useApp } from '@/context/AppContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import OutreachGenerator from '@/components/tools/OutreachGenerator'
import ABTester from '@/components/tools/ABTester'
import ResponseAnalyzer from '@/components/tools/ResponseAnalyzer'
import ObjectionSimulator from '@/components/tools/ObjectionSimulator'
import CallPrepBrief from '@/components/tools/CallPrepBrief'
import type { ToolId } from '@/types'

const NeuralNetwork = dynamic(() => import('@/components/three/NeuralNetwork'), { ssr: false })

const TOOL_COMPONENTS: Record<ToolId, React.ComponentType> = {
  outreach: OutreachGenerator,
  ab: ABTester,
  response: ResponseAnalyzer,
  objection: ObjectionSimulator,
  callprep: CallPrepBrief,
}

export default function Page() {
  const { isAIActive, activeTool, setActiveTool } = useApp()
  const ActiveTool = TOOL_COMPONENTS[activeTool]

  return (
    <>
      <NeuralNetwork isActive={isAIActive} />
      <Header />
      <Sidebar active={activeTool} onSelect={setActiveTool} />
      <main className="relative z-10 ml-16 pt-14 min-h-screen">
        {/* Dark content panel — network visible in margins, not behind readable content */}
        <div className="mx-4 my-4 border border-neural-border/40 bg-panel p-6 min-h-[calc(100vh-5rem)]">
          <ActiveTool />
        </div>
      </main>
    </>
  )
}
