import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BotSelector from './components/BotSelector';
import BotChat from './components/BotChat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BotSelector />} />
        <Route path="/chat/:botId" element={<BotChat />} />
      </Routes>
    </Router>
  );
}

export default App;