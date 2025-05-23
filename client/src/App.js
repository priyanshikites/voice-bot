import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BotSelector from "./components/BotSelector";
import BotChat from "./components/BotChat";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <Router basename="/voice-bot">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <BotSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:botId"
            element={
              <ProtectedRoute>
                <BotChat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
