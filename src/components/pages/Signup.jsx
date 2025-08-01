// src/pages/SignUpPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

function SignUpPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // 1. Add state for the confirm password field
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 2. Add validation to check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return; // Stop the function if they don't match
        }

        try {
            const response = await api.post('/signup', { username, email, password });
            localStorage.setItem('token', response.data.token);
            alert('Sign up successful! You are now logged in.');
            navigate('/');
            window.location.reload(); // Refresh to update nav bar
        } catch (err) {
            setError(err.response?.data || 'Failed to sign up. The email may already be in use.');
            console.error(err);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Create Your Account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Username" 
                    required 
                />
                <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                    required 
                />
                <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Password" 
                    required 
                />
                {/* 3. Add the new input field for password confirmation */}
                <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm Password" 
                    required 
                />
                <button 
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200" 
                    type="submit"
                >
                    Sign Up
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
            </p>
        </div>
    );
}

export default SignUpPage;
