"use client"

import React, { useEffect, useState } from "react"

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`

  return (
    <div className="text-center space-y-4">
      <h2 className="text-4xl font-bold">{formatTime(time)}</h2>
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={() => setIsRunning(!isRunning)}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
    </div>
  )
}

export default PomodoroTimer
