import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import appRoutes from "./router/AppRouter";

const router = createBrowserRouter(appRoutes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
