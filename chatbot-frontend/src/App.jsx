import './App.css'
import Navbar from './components/Navbar'
import ChatbotPage from './pages/ChatbotPage'
import DashboardPage from './pages/DashboardPage'
import ChatbotLearnPage from './pages/ChatbotLearnPage'
import ChatbotAssessPage from './pages/ChatbotAssessPage'
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";

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
        element: <DashboardPage />,
      }, 
      {
        path: "chatbot",
        element: <ChatbotPage />,
        children: [
          { path: "learn", element: <ChatbotLearnPage /> },
          { path: "assess", element: <ChatbotAssessPage /> },
          // { path: "*", element: <Navigate to="/dashboard" replace /> },
        ],
      },
      // catch all route - 404
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
