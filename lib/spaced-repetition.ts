// Spaced repetition algorithm based on SuperMemo-2
// Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export interface ReviewData {
  easeFactor: number // Ease factor (1.3 - 2.5)
  interval: number // Interval in days
  repetitions: number // Number of successful repetitions
  dueDate: number // Next review date (timestamp)
  lastReview: number // Last review date (timestamp)
}

// Default review data for new cards
export function createDefaultReviewData(): ReviewData {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(),
    lastReview: 0,
  }
}

// Calculate next review data based on performance
// quality: 0 (complete blackout) to 5 (perfect recall)
export function calculateNextReview(currentData: ReviewData, quality: number): ReviewData {
  // Ensure quality is between 0 and 5
  quality = Math.max(0, Math.min(5, quality))

  // Clone current data
  const newData: ReviewData = { ...currentData }

  // Update last review date
  newData.lastReview = Date.now()

  // If quality < 3, reset repetitions (card failed)
  if (quality < 3) {
    newData.repetitions = 0
    newData.interval = 1 // Review again in 1 day
  } else {
    // Card passed, calculate new interval
    newData.repetitions += 1

    if (newData.repetitions === 1) {
      newData.interval = 1 // First successful review: 1 day
    } else if (newData.repetitions === 2) {
      newData.interval = 6 // Second successful review: 6 days
    } else {
      // Third or later successful review: interval * ease factor
      newData.interval = Math.round(newData.interval * newData.easeFactor)
    }

    // Update ease factor based on quality
    newData.easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)

    // Ensure ease factor stays within bounds
    newData.easeFactor = Math.max(1.3, Math.min(2.5, newData.easeFactor))
  }

  // Cap maximum interval at 365 days (1 year)
  newData.interval = Math.min(365, newData.interval)

  // Calculate next due date
  const now = new Date()
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + newData.interval)
  newData.dueDate = nextDate.getTime()

  return newData
}

// Check if a card is due for review
export function isDue(reviewData: ReviewData): boolean {
  return Date.now() >= reviewData.dueDate
}

// Get cards due for review
export function getDueCards<T extends { reviewData: ReviewData }>(cards: T[]): T[] {
  return cards.filter((card) => isDue(card.reviewData))
}

// Sort cards by due date (earliest first)
export function sortByDueDate<T extends { reviewData: ReviewData }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => a.reviewData.dueDate - b.reviewData.dueDate)
}

// Calculate days until next review
export function daysUntilReview(reviewData: ReviewData): number {
  const now = Date.now()
  const daysMs = reviewData.dueDate - now
  return Math.max(0, Math.ceil(daysMs / (1000 * 60 * 60 * 24)))
}

// Format due date as a human-readable string
export function formatDueDate(reviewData: ReviewData): string {
  const days = daysUntilReview(reviewData)

  if (days === 0) {
    return "Oggi"
  } else if (days === 1) {
    return "Domani"
  } else {
    return `Tra ${days} giorni`
  }
}

