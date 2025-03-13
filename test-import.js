// Test script for diet plan import functionality

// Sample diet plan in the alternative format
const alternativeFormatPlan = {
  id: "custom-diet",
  name: "My Custom Diet",
  description: "A custom diet plan",
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFats: 70,
  meals: [
    {
      meal: "Breakfast",
      time: "8:00 AM",
      foodItems: ["Eggs", "Toast", "Avocado"]
    },
    {
      meal: "Lunch",
      time: "12:00 PM",
      foodItems: ["Chicken Salad", "Brown Rice"]
    },
    {
      meal: "Dinner",
      time: "6:00 PM",
      foodItems: ["Salmon", "Broccoli", "Sweet Potato"]
    }
  ]
};

// Convert the plan to JSON
const planJson = JSON.stringify(alternativeFormatPlan, null, 2);

// Log the JSON to copy and paste into the import dialog
console.log("Diet Plan JSON to import:");
console.log(planJson);

// Instructions
console.log("\nInstructions:");
console.log("1. Copy the JSON above");
console.log("2. Open the app and go to the diet page");
console.log("3. Click on the import button");
console.log("4. Select 'Diet Plans Only' from the dropdown");
console.log("5. Paste the JSON into the textarea");
console.log("6. Click 'Import'");
console.log("7. Verify that the plan is imported correctly and can be selected without errors"); 