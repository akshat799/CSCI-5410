import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MFAQuestionPage from './pages/MFAQuestionPage';
import MFACaesarPage from './pages/MFACaesarPage';
import CustomerHomePage from './pages/CustomerHomePage';
import FranchiseDashboard from './pages/FranchiseDashboard';
import BookBikePage from './pages/BookBikePage';
import OTPPage from './pages/OTPPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/mfa-question" element={<MFAQuestionPage />} />
      <Route path="/mfa-caesar" element={<MFACaesarPage />} />
      <Route path="/customer-home" element={<CustomerHomePage />} />
      <Route path="/franchise-dashboard" element={<FranchiseDashboard />} />
      <Route path="/book-bike" element={<BookBikePage />} />
      <Route path="/otp" element={<OTPPage />} />
    </Routes>
  );
}

export default App;