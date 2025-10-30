"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  title: string
  content: string | null
  completed: boolean
  order_index: number
}

interface TasksSidebarProps {
  adventureId: string
  tasks: Task[]
}

export function TasksSidebar({ adventureId, tasks: initialTasks }: TasksSidebarProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    console.log("[v0] ========== ADD TASK START ==========")
    console.log("[v0] New task title:", newTaskTitle)
    console.log("[v0] Adventure ID:", adventureId)

    setIsAdding(true)
    const supabase = createClient()

    const taskData = {
      adventure_id: adventureId,
      title: newTaskTitle,
      completed: false,
      order_index: tasks.length,
    }

    console.log("[v0] Task data:", taskData)

    const { data, error } = await supabase.from("tasks").insert(taskData).select().single()

    if (error) {
      console.error("[v0] Error creating task:", error)
      console.log("[v0] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      alert("Erro ao criar tarefa: " + error.message)
      console.log("[v0] ========== ADD TASK END (ERROR) ==========")
    } else if (data) {
      console.log("[v0] Task created successfully:", data)
      setTasks([...tasks, data])
      setNewTaskTitle("")
      router.refresh()
      console.log("[v0] ========== ADD TASK END (SUCCESS) ==========")
    }

    setIsAdding(false)
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const supabase = createClient()

    await supabase.from("tasks").update({ completed }).eq("id", taskId)

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)))
    router.refresh()
  }

  const handleDeleteTask = async (taskId: string) => {
    const supabase = createClient()

    await supabase.from("tasks").delete().eq("id", taskId)

    setTasks(tasks.filter((t) => t.id !== taskId))
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#0B0A13] border-r border-[#302831] flex flex-col">
      <div className="p-4 border-b border-[#302831]">
        <h2 className="font-semibold text-[#E7D1B1] text-lg">A fazeres</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-2 p-3 rounded-lg bg-[#302831] hover:bg-[#302831]/80 group">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-[#E7D1B1] ${task.completed ? "line-through opacity-60" : ""}`}>
                {task.title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#302831]">
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Nova tarefa..."
            className="bg-[#302831] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475]"
          />
          <Button
            onClick={handleAddTask}
            disabled={isAdding || !newTaskTitle.trim()}
            size="sm"
            className="bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
