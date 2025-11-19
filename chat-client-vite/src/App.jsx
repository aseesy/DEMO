import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { LoginSignup } from './components/LoginSignup.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - shows landing or dashboard based on auth */}
        <Route path="/" element={<ChatRoom />} />

        {/* Sign in route - dedicated login/signup page */}
        <Route path="/signin" element={<LoginSignup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
