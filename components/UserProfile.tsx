import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { GoogleIcon, SpinnerIcon } from './Icons';
import { Theme } from '../types';

interface UserProfileProps {
    user: User | null;
    isLoading: boolean;
    onLogin: () => void;
    onLogout: () => void;
    theme: Theme;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, isLoading, onLogin, onLogout, theme }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="w-28 h-9 flex items-center justify-center">
                <SpinnerIcon className="w-5 h-5 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={onLogin}
                className="flex items-center justify-center bg-white hover:bg-gray-200 text-gray-800 font-semibold text-sm py-2 px-4 rounded-md transition-colors"
            >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Đăng nhập
            </button>
        );
    }
    
    const { email, user_metadata } = user;
    const avatarUrl = user_metadata?.avatar_url;
    const fullName = user_metadata?.full_name;

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                <img
                    src={avatarUrl}
                    alt={fullName || 'User Avatar'}
                    className="w-9 h-9 rounded-full border-2 border-gray-600 hover:border-gray-500 transition-colors"
                />
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#2d303e] border border-[#414868] rounded-lg shadow-xl z-20">
                    <div className="p-4 border-b border-gray-700">
                        <p className="font-semibold text-white truncate">{fullName}</p>
                        <p className="text-sm text-gray-400 truncate">{email}</p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={() => {
                                onLogout();
                                setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-red-800/50 rounded-md transition-colors`}
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
