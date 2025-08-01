// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import LoginPage from './components/pages/LoginPage';
import CreatePostPage from './components/pages/CreatePostPage';
import SignUpPage from './components/pages/Signup';

function App() {
  const token = localStorage.getItem('token');

  const Navbar = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
      localStorage.removeItem('token');
      navigate('/login');
      window.location.reload(); // Force a refresh to update navbar
    };

    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-indigo-600">Vistagram</Link>
            <div className="flex items-center space-x-4">
              <Link to="/create" className="text-gray-700 hover:text-indigo-600 font-medium">Create Post</Link>
              {token ? (
                <button onClick={handleLogout} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Logout</button>
              ) : (
                <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <Router>
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/create" element={<CreatePostPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;