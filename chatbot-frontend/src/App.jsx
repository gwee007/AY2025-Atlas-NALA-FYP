import './App.css'
import Navbar from './components/Navbar'
import ChatbotPage from './pages/ChatbotPage'
import DashboardPage from './pages/DashboardPage'
import ChatbotAssessPage from './pages/ChatbotAssessPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";

const basename = import.meta.env.NALA_BASE_URL;

function RootLayout() {
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
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
      }, 
      {
        path: "chatbot",
        element: <ProtectedRoute><ChatbotPage /></ProtectedRoute>,
      },
      {
        path: "chatbot/:userId/:conversationId",
        element: <ProtectedRoute><ChatbotAssessPage /></ProtectedRoute>,
      },
      {
        path: "chatbot/assess",
        element: <ProtectedRoute><ChatbotAssessPage /></ProtectedRoute>,
      },
      // catch all route - 404
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
], {
  basename: basename,
});

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
