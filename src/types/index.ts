export type Gender = 'male' | 'female' | 'other'

export type ActivityLevel = 'low' | 'moderate' | 'high'

export interface Child {
  id: string
  userId: string
  name: string
  birthDate: string
  gender: Gender
  height: number
  weight: number
  activityLevel: ActivityLevel
  createdAt: string
  updatedAt: string
}

export interface MealRecord {
  id: string
  childId: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: FoodItem[]
  imageUrl?: string
  createdAt: string
}

export interface FoodItem {
  id: string
  name: string
  amount: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  vitamins: Record<string, number>
  minerals: Record<string, number>
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface GrowthRecord {
  id: string
  childId: string
  date: string
  height: number
  weight: number
  createdAt: string
}

export interface AllergyItem {
  id: string
  childId: string
  name: string
  severity: 'mild' | 'moderate' | 'severe'
  createdAt: string
}

export interface DislikedFood {
  id: string
  childId: string
  name: string
  overcame: boolean
  overcameAt?: string
  createdAt: string
}
