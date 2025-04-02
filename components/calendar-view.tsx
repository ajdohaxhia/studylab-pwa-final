"use client"

const CalendarView = () => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)

  return (
    <div className="grid grid-cols-7 gap-2 text-center text-sm">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="font-bold">
          {d}
        </div>
      ))}
      {days.map((day) => (
        <div key={day} className="p-2 bg-gray-100 rounded">
          {day}
        </div>
      ))}
    </div>
  )
}

export default CalendarView
