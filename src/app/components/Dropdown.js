'use client'
import React, { useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Dropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoggedIn, logout, user } = useAuth();
    const pathName = usePathname();

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };
    const handleLogout = () =>{
        logout();
        closeDropdown();
    }
    useEffect(() => {
        closeDropdown();
    }, [pathName])
     
    return (
        <div>
            <div className="relative inline-block">
                <button
                    type="button"
                    className="avatar-button w-8 h-8 rounded-full overflow-hidden focus:outline-none"
                    onClick={toggleDropdown}
                >
                    <img 
                        src={user?.avatar || '/default-avatar.png'} 
                        alt="avatar" 
                        className="w-full h-full object-cover block"
                        style={{ height: 'auto' }}
                    />
                       
                </button>

                {isOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 p-2 w-44 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <ul role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            <li>
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={closeDropdown}
                                >
                                    My profile
                                </Link>
                            </li>
                       
                         {!isLoggedIn && (
                            <li>
                                <Link href="/auth/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Login</Link>
                            </li>)}
                         {isLoggedIn && (
                            <li>
                                <button onClick={handleLogout} className="block p-2 text-sm text-gray-700 hover:bg-gray-100">
                                    Logout
                                </button>
                            </li>)}
                         </ul>        
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dropdown;