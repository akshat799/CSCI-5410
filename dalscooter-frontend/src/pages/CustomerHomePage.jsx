import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function CustomerHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null; // prevent UI flicker before redirect

  return (
    <>
      <Navbar />
      <div className="container max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to DALScooter!</h2>
        <p className="mb-6 text-gray-700">
          You are successfully logged in as a registered customer.
        </p>

        <div className="bg-white shadow-md rounded p-4">
          <h4 className="text-xl font-semibold mb-3">Your Dashboard</h4>
          <ul className="list-disc pl-6 space-y-1 text-gray-800">
            <li>View available scooters near you</li>
            <li>Check your ride history</li>
            <li>Update your profile</li>
            <li>Start a new ride</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default CustomerHomePage;
