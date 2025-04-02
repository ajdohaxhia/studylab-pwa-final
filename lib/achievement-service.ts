"use client"

// Achievement service for gamification
import { get, put, getAll, type Achievement } from "./db"
import { useToast } from "@/components/ui/use-toast"

// Update achievement progress
export async function updateAchievementProgress(id: string, progress: number): Promise<Achievement | null> {
  try {
    const achievement = await get("achievements", id)
    if (!achievement) return null

    // Update progress
    const updatedAchievement = {
      ...achievement,
      progress: Math.min(progress, achievement.maxProgress),
    }

    // Check if achievement is unlocked
    if (updatedAchievement.progress >= updatedAchievement.maxProgress && !updatedAchievement.unlocked) {
      updatedAchievement.unlocked = true
      updatedAchievement.unlockedAt = Date.now()
    }

    // Save updated achievement
    await put("achievements", updatedAchievement)

    return updatedAchievement
  } catch (error) {
    console.error("Error updating achievement progress:", error)
    return null
  }
}

// Increment achievement progress
export async function incrementAchievementProgress(id: string, increment = 1): Promise<Achievement | null> {
  try {
    const achievement = await get("achievements", id)
    if (!achievement) return null

    return updateAchievementProgress(id, achievement.progress + increment)
  } catch (error) {
    console.error("Error incrementing achievement progress:", error)
    return null
  }
}

// Get all achievements
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    return await getAll("achievements")
  } catch (error) {
    console.error("Error getting achievements:", error)
    return []
  }
}

// Get unlocked achievements
export async function getUnlockedAchievements(): Promise<Achievement[]> {
  try {
    const achievements = await getAll("achievements")
    return achievements.filter((a) => a.unlocked)
  } catch (error) {
    console.error("Error getting unlocked achievements:", error)
    return []
  }
}

// Check for newly unlocked achievements and show notifications
export async function checkAchievements(): Promise<void> {
  try {
    const achievements = await getAll("achievements")
    const newlyUnlocked = achievements.filter((a) => a.unlocked && a.unlockedAt && Date.now() - a.unlockedAt < 60000)

    if (newlyUnlocked.length > 0) {
      // Show notifications for newly unlocked achievements
      for (const achievement of newlyUnlocked) {
        // In a real component, you would use the useToast hook
        // Here we're just logging to the console
        console.log(`Achievement unlocked: ${achievement.title}`)
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error)
  }
}

// React hook for achievements
export function useAchievements() {
  const { toast } = useToast()

  const unlockAchievement = async (id: string) => {
    const achievement = await updateAchievementProgress(id, Number.MAX_SAFE_INTEGER)

    if (achievement && achievement.unlocked) {
      toast({
        title: "🏆 Achievement Sbloccato!",
        description: achievement.description,
      })
    }

    return achievement
  }

  return {
    updateProgress: updateAchievementProgress,
    incrementProgress: incrementAchievementProgress,
    getAll: getAllAchievements,
    getUnlocked: getUnlockedAchievements,
    unlock: unlockAchievement,
  }
}

