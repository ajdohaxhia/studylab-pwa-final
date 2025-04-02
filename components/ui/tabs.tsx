"use client"

import * as React from "react"

type Tab = {
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
}

export default function Tabs({ tabs }: TabsProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`px-4 py-2 font-medium ${
              i === activeIndex ? "border-b-2 border-black" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeIndex].content}</div>
    </div>
  )
}
