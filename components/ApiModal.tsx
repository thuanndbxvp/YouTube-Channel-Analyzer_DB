import React, { useState, useEffect, useRef } from 'react';
import { StoredConfig, Theme, AiProvider } from '../types';
import { validateSingleApiKey as validateYoutubeKey } from '../services/youtubeService';
import { validateSingleApiKey as validateGeminiKey } from '../services/geminiService';
import { validateSingleApiKey as validateOpenAIKey } from '../services/openaiService';
import { CheckCircleIcon, XCircleIcon, TrashIcon, SpinnerIcon, UploadIcon, DownloadIcon } from './Icons';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoredConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
  theme: Theme;
}

const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];
const OPENAI_MODELS_MAP = {
    'gpt-5': 'GPT-5 (Mới nhất)',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
};
const OPENAI_MODELS = Object.keys(OPENAI_MODELS_MAP);


interface KeyWithStatus {
  id: number;
  value: string;
  status: 'idle' | 'validating' | 'valid' | 'invalid';
}

const ApiKeyManager: React.FC<{
    keys: KeyWithStatus[];
    setKeys: React.Dispatch<React.SetStateAction<KeyWithStatus[]>>;
    validateFn: (key: string) => Promise<boolean>;
    placeholder: string;
    theme: Theme;
}> = ({ keys, setKeys, validateFn, placeholder, theme }) => {
    
    const handleAddKey = () => {
        setKeys(prev => [...prev, { id: Date.now(), value: '', status: 'idle' }]);
    };
    
    const handleDeleteKey = (id: number) => {
        setKeys(prev => prev.filter(k => k.id !== id));
    };

    const handleUpdateKey = (id: number, value: string) => {
        setKeys(prev => prev.map(k => k.id === id ? { ...k, value, status: 'idle' } : k));
    };

    const handleValidateKey = async (id: number) => {
        const keyToValidate = keys.find(k => k.id === id);
        if (!keyToValidate) return;

        setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'validating' } : k));
        
        const isValid = await validateFn(keyToValidate.value);

        setKeys(prev => prev.map(k => k.id === id ? { ...k, status: isValid ? 'valid' : 'invalid' } : k));
    };

    return (
        <div className="space-y-2">
            {keys.map((keyItem) => (
                <div key={keyItem.id} className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={keyItem.value}
                            onChange={(e) => handleUpdateKey(keyItem.id, e.target.value)}
                            placeholder={placeholder}
                            className={`w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-${theme}-500 outline-none pr-10`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {keyItem.status === 'validating' && <SpinnerIcon className="w-5 h-5 text-gray-400 animate-spin" />}
                            {keyItem.status === 'valid' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                            {keyItem.status === 'invalid' && <XCircleIcon className="w-5 h-5 text-red-400" />}
                        </div>
                    </div>
                     <button 
                        type="button"
                        onClick={() => handleValidateKey(keyItem.id)} 
                        disabled={!keyItem.value || keyItem.status === 'validating'}
                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50"
                    >
                        Kiểm tra
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleDeleteKey(keyItem.id)} 
                        className="p-2 bg-red-800 hover:bg-red-900 text-white rounded-md transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button 
                type="button"
                onClick={handleAddKey} 
                className={`text-sm text-${theme}-300 hover:text-${theme}-200 font-semibold`}
            >
                + Thêm Key
            </button>
        </div>
    );
};


const HowToGetApiKey: React.FC<{theme: Theme}> = ({ theme }) => (
    <details className="text-sm mt-2 cursor-pointer">
        <summary className="text-gray-400 hover:text-white">Làm thế nào để lấy API Key?</summary>
        <div className="mt-2 p-3 bg-[#1a1b26] rounded-md text-gray-300 space-y-2">
            <p><strong>1. YouTube Data API:</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className={`text-${theme}-400 underline`}>Google Cloud Console</a>.</li>
                <li>Tạo một dự án mới.</li>
                <li>Vào "APIs & Services" &gt; "Library", tìm và bật "YouTube Data API v3".</li>
                <li>Vào "APIs & Services" &gt; "Credentials", tạo một API key mới.</li>
                <li>Sao chép key và dán vào ô ở trên.</li>
            </ol>
             <p><strong>2. Google Gemini API:</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={`text-${theme}-400 underline`}>Google AI Studio</a>.</li>
                <li>Đăng nhập bằng tài khoản Google của bạn.</li>
                <li>Nhấp vào "Create API key" để tạo một key mới.</li>
            </ol>
             <p><strong>3. OpenAI API (ChatGPT):</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className={`text-${theme}-400 underline`}>OpenAI API Keys page</a>.</li>
                <li>Đăng nhập hoặc tạo một tài khoản mới.</li>
                <li>Nhấp vào "Create new secret key".</li>
            </ol>
        </div>
    </details>
);

const parseKeysString = (keysString: string): KeyWithStatus[] => 
    keysString.split(/[\n,]+/).filter(Boolean).map(value => ({
        id: Date.now() + Math.random(),
        value,
        status: 'idle',
    }));

const joinKeys = (keys: KeyWithStatus[]): string =>
    keys.map(k => k.value.trim()).filter(Boolean).join('\n');

export const ApiModal: React.FC<ApiModalProps> = ({ isOpen, onClose, config, setConfig, theme }) => {
  const [youtubeKeys, setYoutubeKeys] = useState<KeyWithStatus[]>([]);
  const [geminiKeys, setGeminiKeys] = useState<KeyWithStatus[]>([]);
  const [openaiKeys, setOpenaiKeys] = useState<KeyWithStatus[]>([]);
  
  const [activeAi, setActiveAi] = useState(`${config.aiProvider}:${config.aiModel}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setYoutubeKeys(parseKeysString(config.youtube.key));
      setGeminiKeys(parseKeysString(config.gemini.key));
      setOpenaiKeys(parseKeysString(config.openai.key));
      setActiveAi(`${config.aiProvider}:${config.aiModel}`);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSaveAndClose = () => {
    const [provider, model] = activeAi.split(':');
    setConfig(prev => ({
        ...prev,
        youtube: { key: joinKeys(youtubeKeys) },
        gemini: { key: joinKeys(geminiKeys) },
        openai: { key: joinKeys(openaiKeys) },
        aiProvider: provider as AiProvider,
        aiModel: model,
    }));
    onClose();
  };
  
  const handleExportKeys = () => {
    const keysToExport = {
      youtube: joinKeys(youtubeKeys),
      gemini: joinKeys(geminiKeys),
      openai: joinKeys(openaiKeys),
    };
    const dataStr = JSON.stringify(keysToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'youtube_analyzer_api_keys.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const parsedKeys = JSON.parse(result);
                if (
                    typeof parsedKeys.youtube === 'string' &&
                    typeof parsedKeys.gemini === 'string' &&
                    typeof parsedKeys.openai === 'string'
                ) {
                    setYoutubeKeys(parseKeysString(parsedKeys.youtube));
                    setGeminiKeys(parseKeysString(parsedKeys.gemini));
                    setOpenaiKeys(parseKeysString(parsedKeys.openai));
                    alert('Đã nhập API keys thành công!');
                } else {
                    throw new Error('Định dạng tệp JSON không hợp lệ.');
                }
            }
        } catch (error) {
            alert(`Lỗi: Không thể đọc hoặc phân tích tệp JSON. ${error instanceof Error ? error.message : ''}`);
            console.error("JSON parsing error:", error);
        }
    };
    reader.onerror = () => {
        alert('Lỗi: Không thể đọc tệp.');
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Quản lý API Keys</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-3">
            {/* YouTube Section */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">YouTube Data API</h3>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Keys (Bắt buộc)</label>
              <ApiKeyManager 
                keys={youtubeKeys}
                setKeys={setYoutubeKeys}
                validateFn={validateYoutubeKey}
                placeholder="Dán API Key YouTube vào đây"
                theme={theme}
              />
              <HowToGetApiKey theme={theme} />
            </div>

            {/* AI Model Selection */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Mô hình AI</h3>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mô hình AI hoạt động</label>
              <p className="text-xs text-gray-400 mb-2">Chọn mô hình AI mặc định để sử dụng cho các tính năng như Brainstorm và Phân tích.</p>
              <select
                value={activeAi}
                onChange={e => setActiveAi(e.target.value)}
                className={`w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-${theme}-500 outline-none`}
              >
                <optgroup label="Google Gemini">
                  {GEMINI_MODELS.map(m => <option key={m} value={`gemini:${m}`}>{m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, ' ')}</option>)}
                </optgroup>
                <optgroup label="OpenAI">
                  {OPENAI_MODELS.map(m => <option key={m} value={`openai:${m}`}>{OPENAI_MODELS_MAP[m as keyof typeof OPENAI_MODELS_MAP]}</option>)}
                </optgroup>
              </select>
            </div>
            
            {/* Gemini Section */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Google Gemini API Keys</h3>
              <ApiKeyManager 
                keys={geminiKeys}
                setKeys={setGeminiKeys}
                validateFn={validateGeminiKey}
                placeholder="Dán API Key Gemini vào đây"
                theme={theme}
              />
            </div>

            {/* OpenAI Section */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">OpenAI API Keys</h3>
                <ApiKeyManager 
                    keys={openaiKeys}
                    setKeys={setOpenaiKeys}
                    validateFn={validateOpenAIKey}
                    placeholder="Dán API Key OpenAI vào đây"
                    theme={theme}
                />
            </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                 <button 
                    onClick={handleImportClick}
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                    title="Nhập các keys từ tệp .json"
                >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Nhập Keys
                </button>
                 <button 
                    onClick={handleExportKeys}
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                    title="Xuất tất cả các keys ra tệp .json"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Xuất Keys
                </button>
            </div>
          <button onClick={handleSaveAndClose} className={`py-2 px-6 rounded-lg bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold transition-colors`}>Lưu và Đóng</button>
        </div>
      </div>
    </div>
  );
};