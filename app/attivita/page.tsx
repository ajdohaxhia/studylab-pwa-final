"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskManager from "@/components/task-manager"
import PomodoroTimer from "@/components/pomodoro-timer"
import CalendarView from "@/components/calendar-view"
import { CalendarIcon, Clock, CalendarDaysIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function TaskPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "tasks")

  // Update active tab when URL parameters change
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestione Attività</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Attività
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center">
            <CalendarDaysIcon className="mr-2 h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Pomodoro Timer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManager />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView />
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-6">
          <PomodoroTimer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

