import React, { useState, useRef, useEffect } from 'react';
import { LibraryIcon, KeyIcon, YouTubeIcon, ChartBarIcon, SpinnerIcon, TrashIcon } from './Icons';
import { StoredConfig, Theme } from '../types';

interface HeaderProps {
    onApiClick: () => void;
    onLibraryClick: () => void;
    theme: Theme;
    setAppConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
    onCompetitiveAnalysisClick: () => void;
    isCompetitiveAnalysisAvailable: boolean;
    analysisState: {
        isLoading: boolean;
        isComplete: boolean;
    };
}

const themes: Theme[] = ['blue', 'green', 'orange', 'red', 'purple'];
const themeColors: Record<Theme, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
};

const PaintBrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.232 5.232 3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732Z" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onApiClick, onLibraryClick, theme, setAppConfig, onCompetitiveAnalysisClick, isCompetitiveAnalysisAvailable, analysisState }) => {
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    
    const handleThemeChange = (newTheme: Theme) => {
        setAppConfig(prevConfig => ({ ...prevConfig, theme: newTheme }));
        setIsThemeDropdownOpen(false);
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
                setIsThemeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClearCache = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu đã lưu (bao gồm API keys và các phiên đã lưu trong thư viện) không? Hành động này không thể hoàn tác.')) {
            window.localStorage.clear();
            window.location.reload();
        }
    };
    
    return (
        <header className="flex flex-col items-center text-center py-2">
            <div>
                <h1 className={`text-3xl md:text-4xl font-bold`}>
                    <a href="/" className={`flex items-center justify-center text-${theme}-300 hover:text-${theme}-200 transition-colors duration-200`}>
                        <YouTubeIcon className="w-10 h-10 md:w-12 md:h-12 mr-3" />
                        Trình phân tích kênh YouTube
                    </a>
                </h1>
                <p className="text-gray-400 mt-1">
                    Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
                </p>
            </div>

            <div className="flex items-center justify-center space-x-2 mt-6">
                 <div className="relative" ref={themeDropdownRef}>
                    <button
                        onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                        className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-semibold p-1.5 rounded-md transition-colors duration-200"
                        aria-label="Chọn giao diện"
                        title="Chọn màu giao diện"
                    >
                        <PaintBrushIcon className="w-4 h-4" />
                    </button>

                    {isThemeDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-auto bg-[#2d303e] border border-[#414868] rounded-lg shadow-xl z-10 p-2">
                             <div className="flex items-center space-x-2">
                                {themes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleThemeChange(t)}
                                        className={`w-6 h-6 rounded-full transition-all ${themeColors[t]} ${theme === t ? 'ring-2 ring-offset-2 ring-offset-[#2d303e] ring-white' : 'hover:opacity-80'}`}
                                        aria-label={`Chọn giao diện màu ${t}`}
                                        title={`Màu ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
                <button 
                    onClick={onLibraryClick}
                    title="Mở thư viện các phiên đã lưu"
                    className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200">
                    <LibraryIcon className="w-4 h-4 mr-1.5" />
                    Thư viện
                </button>
                <div className="relative">
                    <button
                        onClick={onCompetitiveAnalysisClick}
                        disabled={!isCompetitiveAnalysisAvailable && !analysisState.isLoading}
                        title={!isCompetitiveAnalysisAvailable ? "Cần ít nhất 2 kênh đã lưu để phân tích đối thủ" : "Phân tích đối thủ"}
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                    >
                        {analysisState.isLoading ? (
                            <SpinnerIcon className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                            <ChartBarIcon className="w-4 h-4 mr-1.5" />
                        )}
                        {analysisState.isLoading ? 'Đang phân tích...' : 'Đối thủ'}
                    </button>
                    {analysisState.isComplete && !analysisState.isLoading && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    )}
                </div>
                <button 
                    onClick={onApiClick} 
                    title="Quản lý API Keys"
                    className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200">
                    <KeyIcon className="w-4 h-4 mr-1.5" />
                    API
                </button>
                <button 
                    onClick={handleClearCache} 
                    title="Xóa toàn bộ dữ liệu cục bộ của ứng dụng (API Keys, Thư viện, v.v.)"
                    className="flex items-center justify-center bg-red-800 hover:bg-red-900 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200">
                    <TrashIcon className="w-4 h-4 mr-1.5" />
                    Xóa Cache
                </button>
            </div>
        </header>
    );
};