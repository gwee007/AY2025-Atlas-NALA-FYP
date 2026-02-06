import './App.css'
import Navbar from './components/Navbar'
import ChatbotPage from './pages/ChatbotPage'
import DashboardPage from './pages/DashboardPage'
import ChatbotAssessPage from './pages/ChatbotAssessPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";

/**
 * Layout that includes the Navbar. 
 * Use this only for pages where the Navbar should be visible.
 */
function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    // The top-level element is now a plain Outlet so it doesn't 
    // force a Navbar on every child route.
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      {
        path: "login",
        element: <LoginPage /> // Rendered without MainLayout (no Navbar)
      },
      {
        // Wrap all protected routes that need the Navbar in MainLayout
        element: <MainLayout />,
        children: [
          {
            path: "dashboard",
            element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
          }, 
          {
            path: "chatbot",
            element: <ProtectedRoute><ChatbotPage /></ProtectedRoute>,
          },
          {
            path: "chatbot/assess",
            element: <ProtectedRoute><ChatbotAssessPage /></ProtectedRoute>,
          },
        ]
      },
      // Catch-all route redirects to login
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
], {
  // This preserves your /nala-assess prefix automatically 
  // based on your Vite/environment configuration.
  basename: import.meta.env.BASE_URL, 
});

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}