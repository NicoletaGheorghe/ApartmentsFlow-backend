"use client";

import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import ProfileCard from '../components/ProfileCard';

const ProfilePage = () => {
  const { user, loading, deleteAccount } = useAuth();
  const [confirmMessage, setConfirmMessage] = useState(false);

  const handleDelete = async () => {
        try{
          await deleteAccount();
          window.location.href = "/auth/login";
        } catch (error) {
          alert("Failed to delete account.");
        }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to view your profile.</p>;

  return (
    <div className='grid grid-cols-1 justify-items-center max-w-3xl mx-auto h-full px-4 sm:px-6 lg:px-8 pt-20 pb-16'>
      <h1 className='font-bold text-xl m-3'>{user?.name}'s Profile</h1>
      <ProfileCard user={user} />
      <button onClick={() => setConfirmMessage(true)} className="text-red-600 mt-4">
        Delete Account
      </button>
      {confirmMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6 text-sm text-gray-700">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmMessage(false)} className="text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button onClick={handleDelete} className="text-white bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
