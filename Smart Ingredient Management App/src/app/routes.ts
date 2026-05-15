import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Ingredients from "./pages/Ingredients";
import AddIngredient from "./pages/AddIngredient";
import AddByReceipt from "./pages/AddByReceipt";
import Priority from "./pages/Priority";
import ShoppingList from "./pages/ShoppingList";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import MealPlan from "./pages/MealPlan";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import MyCustom from "./pages/MyCustom";
import NutritionAnalysis from "./pages/NutritionAnalysis";
import FridgeManagement from "./pages/FridgeManagement";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";
import ProfileComplete from "./pages/ProfileComplete";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotificationCenter from "./pages/NotificationCenter";
import FamilyActivity from "./pages/FamilyActivity";

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
    path: "/oauth/callback",
    Component: OAuthCallback,
  },
  {
    path: "/profile/complete",
    Component: ProfileComplete,
  },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "ingredients", Component: Ingredients },
      { path: "add-ingredient", Component: AddIngredient },
      { path: "add-by-receipt", Component: AddByReceipt },
      { path: "priority", Component: Priority },
      { path: "shopping-list", Component: ShoppingList },
      { path: "my-custom", Component: MyCustom },
      { path: "fridges", Component: FridgeManagement },
      { path: "notifications", Component: NotificationCenter },
      { path: "family-activity", Component: FamilyActivity },
      { path: "nutrition", Component: NutritionAnalysis },
      { path: "recipes", Component: Recipes },
      { path: "recipe/:id", Component: RecipeDetail },
      { path: "meal-plan", Component: MealPlan },
      { path: "*", Component: NotFound },
    ],
  },
]);