import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Ingredients from "./pages/Ingredients";
import AddIngredient from "./pages/AddIngredient";
import Priority from "./pages/Priority";
import ShoppingList from "./pages/ShoppingList";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import MealPlan from "./pages/MealPlan";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import MyCustom from "./pages/MyCustom";
import NutritionAnalysis from "./pages/NutritionAnalysis";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "ingredients", Component: Ingredients },
      { path: "add-ingredient", Component: AddIngredient },
      { path: "priority", Component: Priority },
      { path: "shopping-list", Component: ShoppingList },
      { path: "my-custom", Component: MyCustom },
      { path: "nutrition", Component: NutritionAnalysis },
      { path: "recipes", Component: Recipes },
      { path: "recipe/:id", Component: RecipeDetail },
      { path: "meal-plan", Component: MealPlan },
      { path: "*", Component: NotFound },
    ],
  },
]);