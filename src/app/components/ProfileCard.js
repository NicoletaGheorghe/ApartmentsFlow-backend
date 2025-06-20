"use client";
import Link from "next/link";

const ProfileCard = ({ user }) => (
  <div>
    <img 
      src={user.avatar || '/default-avatar.png'} 
      alt="Avatar" 
      className="w-30 h-30 rounded-full"
      style={{ height: 'auto' }}
    />
    <p className="font-bold m-2">Name: {user.name}</p>
    <p className="font-bold m-2 ">Email: {user.email}</p>
    <Link href="/profile/edit" className="inline-block px-4 py-2 text-white bg-[var(--color-secondary)] rounded hover:bg-[var(--color-primary)] transition-colors duration-20">Edit Profile</Link>
  </div>
);
export default ProfileCard;