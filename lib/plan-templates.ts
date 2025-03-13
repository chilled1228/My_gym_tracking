// Workout Plan Templates

export interface Exercise {
  name: string
  sets: string
  reps: number
  completed: boolean
  tooltip?: string
}

export interface WorkoutDay {
  name: string
  exercises: Exercise[]
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
  days: WorkoutDay[]
}

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

// Default Workout Plans
export const workoutPlans: WorkoutPlan[] = [
  {
    id: "default",
    name: "5-Day Split",
    description: "A 5-day workout split targeting different muscle groups each day",
    days: [
      {
        name: "Day 1: Chest & Triceps",
        exercises: [
          { 
            name: "Bench Press", 
            sets: "4x8-10", 
            reps: 0, 
            completed: false,
            tooltip: "Keep your feet flat on the floor, shoulders back, and maintain a slight arch in your lower back."
          },
          { 
            name: "Incline Dumbbell Press", 
            sets: "4x8-10", 
            reps: 0, 
            completed: false,
            tooltip: "Set the bench at a 30-45 degree angle. Lower the weights until your elbows are at 90 degrees."
          },
          { 
            name: "Cable Flys", 
            sets: "3x12", 
            reps: 0, 
            completed: false,
            tooltip: "Keep a slight bend in your elbows throughout the movement. Focus on squeezing your chest."
          },
          { 
            name: "Dips", 
            sets: "3x10", 
            reps: 0, 
            completed: false,
            tooltip: "Lean forward slightly to target chest more. Keep elbows close to body for triceps focus."
          },
          { 
            name: "Skull Crushers", 
            sets: "4x10", 
            reps: 0, 
            completed: false,
            tooltip: "Keep your upper arms stationary and perpendicular to the floor. Lower the weight to your forehead."
          },
          { 
            name: "Rope Triceps Pushdown", 
            sets: "3x12", 
            reps: 0, 
            completed: false,
            tooltip: "Keep your elbows close to your body. Focus on the contraction at the bottom of the movement."
          },
        ],
      },
      {
        name: "Day 2: Back & Biceps",
        exercises: [
          { name: "Deadlifts", sets: "4x6-8", reps: 0, completed: false },
          { name: "Pull-Ups", sets: "4x10", reps: 0, completed: false },
          { name: "Bent-over Rows", sets: "4x8-10", reps: 0, completed: false },
          { name: "Lat Pulldown", sets: "3x12", reps: 0, completed: false },
          { name: "Barbell Bicep Curls", sets: "4x10", reps: 0, completed: false },
          { name: "Hammer Curls", sets: "3x12", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 3: Legs & Abs",
        exercises: [
          { name: "Squats", sets: "4x8-10", reps: 0, completed: false },
          { name: "Romanian Deadlifts", sets: "3x10", reps: 0, completed: false },
          { name: "Leg Press", sets: "4x12", reps: 0, completed: false },
          { name: "Leg Curls", sets: "3x12", reps: 0, completed: false },
          { name: "Hanging Leg Raises", sets: "4x12", reps: 0, completed: false },
          { name: "Cable Crunches", sets: "3x15", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 4: Shoulders & Traps",
        exercises: [
          { name: "Overhead Press", sets: "4x8-10", reps: 0, completed: false },
          { name: "Lateral Raises", sets: "4x12", reps: 0, completed: false },
          { name: "Rear Delt Flys", sets: "3x12", reps: 0, completed: false },
          { name: "Shrugs", sets: "4x15", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 5: Arms & Abs",
        exercises: [
          { name: "Barbell Biceps Curl", sets: "4x10", reps: 0, completed: false },
          { name: "Close-Grip Bench Press", sets: "4x10", reps: 0, completed: false },
          { name: "Concentration Curls", sets: "3x12", reps: 0, completed: false },
          { name: "Rope Pushdowns", sets: "3x12", reps: 0, completed: false },
          { name: "Hanging Leg Raises", sets: "4x12", reps: 0, completed: false },
          { name: "Planks", sets: "3x1 min", reps: 0, completed: false },
        ],
      },
    ]
  },
  {
    id: "push-pull-legs",
    name: "Push Pull Legs",
    description: "A 3-day split focusing on push, pull, and leg movements",
    days: [
      {
        name: "Day 1: Push (Chest, Shoulders, Triceps)",
        exercises: [
          { name: "Bench Press", sets: "4x8-10", reps: 0, completed: false },
          { name: "Overhead Press", sets: "4x8-10", reps: 0, completed: false },
          { name: "Incline Dumbbell Press", sets: "3x10", reps: 0, completed: false },
          { name: "Lateral Raises", sets: "3x12", reps: 0, completed: false },
          { name: "Tricep Pushdowns", sets: "3x12", reps: 0, completed: false },
          { name: "Overhead Tricep Extension", sets: "3x12", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 2: Pull (Back, Biceps)",
        exercises: [
          { name: "Deadlifts", sets: "4x6-8", reps: 0, completed: false },
          { name: "Pull-Ups/Lat Pulldowns", sets: "4x8-10", reps: 0, completed: false },
          { name: "Barbell Rows", sets: "3x10", reps: 0, completed: false },
          { name: "Face Pulls", sets: "3x12", reps: 0, completed: false },
          { name: "Barbell Curls", sets: "3x10", reps: 0, completed: false },
          { name: "Hammer Curls", sets: "3x12", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 3: Legs (Quads, Hamstrings, Calves, Abs)",
        exercises: [
          { name: "Squats", sets: "4x8-10", reps: 0, completed: false },
          { name: "Romanian Deadlifts", sets: "3x10", reps: 0, completed: false },
          { name: "Leg Press", sets: "3x12", reps: 0, completed: false },
          { name: "Leg Curls", sets: "3x12", reps: 0, completed: false },
          { name: "Calf Raises", sets: "4x15", reps: 0, completed: false },
          { name: "Hanging Leg Raises", sets: "3x12", reps: 0, completed: false },
        ],
      },
    ]
  },
  {
    id: "full-body",
    name: "Full Body Workout",
    description: "A 3-day full body workout plan",
    days: [
      {
        name: "Day 1: Full Body A",
        exercises: [
          { name: "Squats", sets: "3x8-10", reps: 0, completed: false },
          { name: "Bench Press", sets: "3x8-10", reps: 0, completed: false },
          { name: "Bent-over Rows", sets: "3x8-10", reps: 0, completed: false },
          { name: "Overhead Press", sets: "3x8-10", reps: 0, completed: false },
          { name: "Bicep Curls", sets: "3x10-12", reps: 0, completed: false },
          { name: "Planks", sets: "3x30-60s", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 2: Full Body B",
        exercises: [
          { name: "Deadlifts", sets: "3x6-8", reps: 0, completed: false },
          { name: "Incline Press", sets: "3x8-10", reps: 0, completed: false },
          { name: "Pull-Ups/Lat Pulldowns", sets: "3x8-10", reps: 0, completed: false },
          { name: "Lateral Raises", sets: "3x10-12", reps: 0, completed: false },
          { name: "Tricep Extensions", sets: "3x10-12", reps: 0, completed: false },
          { name: "Leg Raises", sets: "3x10-15", reps: 0, completed: false },
        ],
      },
      {
        name: "Day 3: Full Body C",
        exercises: [
          { name: "Leg Press", sets: "3x10-12", reps: 0, completed: false },
          { name: "Dumbbell Press", sets: "3x8-10", reps: 0, completed: false },
          { name: "Cable Rows", sets: "3x10-12", reps: 0, completed: false },
          { name: "Dips", sets: "3x8-10", reps: 0, completed: false },
          { name: "Hammer Curls", sets: "3x10-12", reps: 0, completed: false },
          { name: "Russian Twists", sets: "3x15-20", reps: 0, completed: false },
        ],
      },
    ]
  }
];

// Default Diet Plans
export const dietPlans: DietPlan[] = [
  {
    id: "default",
    name: "High Protein Diet",
    description: "A high protein diet for muscle building",
    targetCalories: 2500,
    targetProtein: 200,
    targetCarbs: 250,
    targetFats: 70,
    meals: [
      {
        time: "5:30 AM",
        name: "Pre-Workout",
        items: [
          { name: "1 Banana", completed: false, calories: 105, protein: 1, carbs: 27, fats: 0 },
          { name: "5g Creatine with Water", completed: false, calories: 15, protein: 0, carbs: 3, fats: 0 },
        ],
        calories: 120,
        protein: 1,
        carbs: 30,
        fats: 0,
      },
      {
        time: "9:30 AM",
        name: "Post-Workout",
        items: [
          { name: "100g Soya Chunks", completed: false, calories: 345, protein: 52, carbs: 26, fats: 0.5 },
          { name: "200ml Milk", completed: false, calories: 65, protein: 3, carbs: 4, fats: 4.5 },
          { name: "3 Whole Eggs", completed: false, calories: 90, protein: 0, carbs: 0, fats: 10 },
        ],
        calories: 500,
        protein: 55,
        carbs: 30,
        fats: 15,
      },
      {
        time: "10:30 AM",
        name: "Breakfast",
        items: [
          { name: "100g Oats", completed: false, calories: 350, protein: 13, carbs: 60, fats: 7 },
          { name: "30g Peanut Butter", completed: false, calories: 85, protein: 14, carbs: 1, fats: 7 },
          { name: "1 Scoop Whey Protein", completed: false, calories: 120, protein: 24, carbs: 3, fats: 1.5 },
        ],
        calories: 555,
        protein: 51,
        carbs: 64,
        fats: 15.5,
      },
      {
        time: "1:30 PM",
        name: "Lunch",
        items: [
          { name: "200g Chicken Breast", completed: false, calories: 330, protein: 62, carbs: 0, fats: 7 },
          { name: "100g Rice", completed: false, calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
          { name: "Mixed Vegetables", completed: false, calories: 50, protein: 2, carbs: 10, fats: 0 },
        ],
        calories: 510,
        protein: 66.7,
        carbs: 38,
        fats: 7.3,
      },
      {
        time: "4:30 PM",
        name: "Snack",
        items: [
          { name: "Greek Yogurt", completed: false, calories: 100, protein: 10, carbs: 3, fats: 5 },
          { name: "1 Apple", completed: false, calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
        ],
        calories: 195,
        protein: 10.5,
        carbs: 28,
        fats: 5.3,
      },
      {
        time: "8:30 PM",
        name: "Dinner",
        items: [
          { name: "200g Fish/Chicken", completed: false, calories: 330, protein: 62, carbs: 0, fats: 7 },
          { name: "Sweet Potato", completed: false, calories: 115, protein: 2, carbs: 27, fats: 0 },
          { name: "Mixed Vegetables", completed: false, calories: 50, protein: 2, carbs: 10, fats: 0 },
        ],
        calories: 495,
        protein: 66,
        carbs: 37,
        fats: 7,
      },
    ]
  },
  {
    id: "low-carb",
    name: "Low Carb Diet",
    description: "A low carb diet for fat loss",
    targetCalories: 2000,
    targetProtein: 180,
    targetCarbs: 100,
    targetFats: 110,
    meals: [
      {
        time: "7:00 AM",
        name: "Breakfast",
        items: [
          { name: "3 Whole Eggs", completed: false, calories: 210, protein: 18, carbs: 0, fats: 15 },
          { name: "1/2 Avocado", completed: false, calories: 120, protein: 1, carbs: 6, fats: 10 },
          { name: "Spinach", completed: false, calories: 20, protein: 2, carbs: 3, fats: 0 },
        ],
        calories: 350,
        protein: 21,
        carbs: 9,
        fats: 25,
      },
      {
        time: "10:00 AM",
        name: "Snack",
        items: [
          { name: "30g Almonds", completed: false, calories: 180, protein: 6, carbs: 6, fats: 15 },
          { name: "String Cheese", completed: false, calories: 80, protein: 7, carbs: 1, fats: 6 },
        ],
        calories: 260,
        protein: 13,
        carbs: 7,
        fats: 21,
      },
      {
        time: "1:00 PM",
        name: "Lunch",
        items: [
          { name: "150g Grilled Chicken", completed: false, calories: 250, protein: 47, carbs: 0, fats: 5 },
          { name: "Large Salad with Olive Oil", completed: false, calories: 200, protein: 3, carbs: 10, fats: 16 },
        ],
        calories: 450,
        protein: 50,
        carbs: 10,
        fats: 21,
      },
      {
        time: "4:00 PM",
        name: "Snack",
        items: [
          { name: "1 Scoop Whey Protein", completed: false, calories: 120, protein: 24, carbs: 3, fats: 1.5 },
          { name: "1 Tbsp Peanut Butter", completed: false, calories: 90, protein: 4, carbs: 3, fats: 8 },
        ],
        calories: 210,
        protein: 28,
        carbs: 6,
        fats: 9.5,
      },
      {
        time: "7:00 PM",
        name: "Dinner",
        items: [
          { name: "200g Salmon", completed: false, calories: 400, protein: 40, carbs: 0, fats: 26 },
          { name: "Broccoli", completed: false, calories: 55, protein: 4, carbs: 10, fats: 0 },
          { name: "1/2 Avocado", completed: false, calories: 120, protein: 1, carbs: 6, fats: 10 },
        ],
        calories: 575,
        protein: 45,
        carbs: 16,
        fats: 36,
      },
    ]
  },
  {
    id: "vegetarian",
    name: "Vegetarian Diet",
    description: "A balanced vegetarian diet",
    targetCalories: 2200,
    targetProtein: 130,
    targetCarbs: 270,
    targetFats: 70,
    meals: [
      {
        time: "7:00 AM",
        name: "Breakfast",
        items: [
          { name: "Greek Yogurt", completed: false, calories: 150, protein: 15, carbs: 8, fats: 5 },
          { name: "Granola", completed: false, calories: 200, protein: 5, carbs: 30, fats: 8 },
          { name: "Berries", completed: false, calories: 50, protein: 1, carbs: 12, fats: 0 },
        ],
        calories: 400,
        protein: 21,
        carbs: 50,
        fats: 13,
      },
      {
        time: "10:30 AM",
        name: "Snack",
        items: [
          { name: "Apple", completed: false, calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
          { name: "2 Tbsp Almond Butter", completed: false, calories: 180, protein: 6, carbs: 6, fats: 16 },
        ],
        calories: 275,
        protein: 6.5,
        carbs: 31,
        fats: 16.3,
      },
      {
        time: "1:00 PM",
        name: "Lunch",
        items: [
          { name: "Lentil Soup", completed: false, calories: 230, protein: 18, carbs: 40, fats: 1 },
          { name: "Whole Grain Bread", completed: false, calories: 150, protein: 6, carbs: 30, fats: 2 },
          { name: "Side Salad", completed: false, calories: 50, protein: 2, carbs: 10, fats: 0 },
        ],
        calories: 430,
        protein: 26,
        carbs: 80,
        fats: 3,
      },
      {
        time: "4:00 PM",
        name: "Snack",
        items: [
          { name: "Protein Shake", completed: false, calories: 150, protein: 25, carbs: 5, fats: 2 },
          { name: "Banana", completed: false, calories: 105, protein: 1, carbs: 27, fats: 0 },
        ],
        calories: 255,
        protein: 26,
        carbs: 32,
        fats: 2,
      },
      {
        time: "7:00 PM",
        name: "Dinner",
        items: [
          { name: "Tofu Stir Fry", completed: false, calories: 300, protein: 20, carbs: 15, fats: 18 },
          { name: "Brown Rice", completed: false, calories: 150, protein: 3, carbs: 32, fats: 1 },
          { name: "Steamed Vegetables", completed: false, calories: 80, protein: 4, carbs: 16, fats: 0 },
        ],
        calories: 530,
        protein: 27,
        carbs: 63,
        fats: 19,
      },
    ]
  }
]; 