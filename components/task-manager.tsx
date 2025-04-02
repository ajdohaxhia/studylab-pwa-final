"use client"

import { useState } from "react"

export default function TaskManager() {
  const [tasks, setTasks] = useState<string[]>([])
  const [input, setInput] = useState("")

  const addTask = () => {
    if (input.trim() === "") return
    setTasks([...tasks, input])
    setInput("")
  }

  const removeTask = (index: number) => {
    const updated = [...tasks]
    updated.splice(index, 1)
    setTasks(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="border px-4 py-2 w-full rounded-l"
        />
        <button onClick={addTask} className="bg-black text-white px-4 rounded-r">
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {tasks.map((task, i) => (
          <li
            key={i}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            {task}
            <button onClick={() => removeTask(i)} className="text-red-500">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
