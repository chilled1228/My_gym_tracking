// Diet Plan Templates

export interface MealItem {
  name: string
  completed: boolean
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface Meal {
  time: string
  name: string
  items: MealItem[]
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface DietPlan {
  id: string
  name: string
  description: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFats: number
  meals: Meal[]
}

// Default Diet Plan
export const dietPlans: DietPlan[] = [
  {
    id: "fitness-diet",
    name: "Fitness Meal Plan",
    description: "High protein meal plan with caloric breakdown",
    targetCalories: 2200,
    targetProtein: 170,
    targetCarbs: 210,
    targetFats: 55,
    meals: [
      {
        name: "Pre-Workout",
        time: "5:30 AM",
        items: [
          {
            name: "Banana",
            completed: false,
            calories: 120,
            protein: 1,
            carbs: 30,
            fats: 0
          },
          {
            name: "Creatine with Water",
            completed: false,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0
          }
        ],
        calories: 120,
        protein: 1,
        carbs: 30,
        fats: 0
      },
      {
        name: "Post-Workout",
        time: "9:30 AM",
        items: [
          {
            name: "Soya Chunks (100g)",
            completed: false,
            calories: 300,
            protein: 52,
            carbs: 26,
            fats: 0.5
          },
          {
            name: "Milk (200ml)",
            completed: false,
            calories: 120,
            protein: 6,
            carbs: 10,
            fats: 6
          },
          {
            name: "Egg Whites (4)",
            completed: false,
            calories: 68,
            protein: 14,
            carbs: 0,
            fats: 0
          },
          {
            name: "Whole Egg (1)",
            completed: false,
            calories: 72,
            protein: 6,
            carbs: 0,
            fats: 5
          }
        ],
        calories: 500,
        protein: 60,
        carbs: 30,
        fats: 12
      },
      {
        name: "Breakfast",
        time: "10:30 AM",
        items: [
          {
            name: "Oats (100g)",
            completed: false,
            calories: 370,
            protein: 13,
            carbs: 60,
            fats: 7
          },
          {
            name: "Peanut Butter (30g)",
            completed: false,
            calories: 180,
            protein: 8,
            carbs: 6,
            fats: 15
          },
          {
            name: "Milk (200ml)",
            completed: false,
            calories: 120,
            protein: 6,
            carbs: 10,
            fats: 6
          },
          {
            name: "Curd/Probiotic (100g)",
            completed: false,
            calories: 80,
            protein: 5,
            carbs: 6,
            fats: 4
          }
        ],
        calories: 600,
        protein: 35,
        carbs: 70,
        fats: 20
      },
      {
        name: "Lunch",
        time: "2:00 PM",
        items: [
          {
            name: "Paneer (100g)",
            completed: false,
            calories: 250,
            protein: 18,
            carbs: 3,
            fats: 18
          },
          {
            name: "Cooked Rice (100g)",
            completed: false,
            calories: 130,
            protein: 3,
            carbs: 28,
            fats: 0.3
          },
          {
            name: "Bowl of Vegetables",
            completed: false,
            calories: 75,
            protein: 3,
            carbs: 15,
            fats: 0.5
          },
          {
            name: "Whole Wheat Roti (40g)",
            completed: false,
            calories: 95,
            protein: 3,
            carbs: 19,
            fats: 0.5
          }
        ],
        calories: 550,
        protein: 50,
        carbs: 65,
        fats: 22
      },
      {
        name: "Evening Snack",
        time: "6:00 PM",
        items: [
          {
            name: "Egg Whites (4)",
            completed: false,
            calories: 68,
            protein: 14,
            carbs: 0,
            fats: 0
          },
          {
            name: "Whole Egg (1)",
            completed: false,
            calories: 72,
            protein: 6,
            carbs: 0,
            fats: 5
          },
          {
            name: "Whole Wheat Roti (40g)",
            completed: false,
            calories: 95,
            protein: 3,
            carbs: 19,
            fats: 0.5
          },
          {
            name: "Peanut Butter (1 tsp)",
            completed: false,
            calories: 60,
            protein: 2,
            carbs: 2,
            fats: 5
          }
        ],
        calories: 350,
        protein: 35,
        carbs: 25,
        fats: 12
      },
      {
        name: "Dinner",
        time: "9:00 PM",
        items: [
          {
            name: "Chicken Breast (150g)",
            completed: false,
            calories: 250,
            protein: 45,
            carbs: 0,
            fats: 5
          },
          {
            name: "Bowl of Vegetables",
            completed: false,
            calories: 75,
            protein: 3,
            carbs: 15,
            fats: 0.5
          },
          {
            name: "Rice (50g)",
            completed: false,
            calories: 65,
            protein: 1.5,
            carbs: 14,
            fats: 0.1
          },
          {
            name: "Whole Wheat Roti (40g)",
            completed: false,
            calories: 95,
            protein: 3,
            carbs: 19,
            fats: 0.5
          }
        ],
        calories: 500,
        protein: 55,
        carbs: 40,
        fats: 10
      },
      {
        name: "Before Bed",
        time: "11:30 PM",
        items: [
          {
            name: "Milk (200ml)",
            completed: false,
            calories: 120,
            protein: 6,
            carbs: 10,
            fats: 5
          }
        ],
        calories: 120,
        protein: 6,
        carbs: 10,
        fats: 5
      }
    ]
  }
]; 