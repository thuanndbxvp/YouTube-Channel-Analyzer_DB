


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { LibraryModal } from './components/LibraryModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig, SavedSession, ChatMessage, Theme, AiProvider } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { generateTranscriptWithGemini, performCompetitiveAnalysis } from './services/geminiService';
import { generateTranscriptWithOpenAI } from './services/openaiService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';
import { calculateKeywordCounts, getTopKeywords } from './utils/keywords';
import { ChannelHeader } from './components/ChannelHeader';
import { CompetitiveAnalysisModal } from './components/CompetitiveAnalysisModal';
import { TrashIcon, SpinnerIcon, ClipboardCopyIcon } from './components/Icons';
import { formatDate, parseISO8601Duration } from './utils/formatters';
import { User } from '@supabase/supabase-js';
import { onAuthStateChange, signInWithGoogle, signOut } from './services/authService';
import { getUserData, saveUserData } from './services/dataService';
import { UserProfile } from './components/UserProfile';

// FIX: `declare` must be at the top level. Moved from handleExportAllToExcel.
// Make XLSX globally available from the script tag in index.html
declare const XLSX: any;

const initialConfig: StoredConfig = {
  theme: 'blue',
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-pro',
  youtube: { key: '' },
  gemini: { key: '' },
  openai: { key: '' },
};

const initialTranscriptState = {
    isOpen: false,
    video: null as Video | null,
    transcript: '',
    isLoading: false,
    error: null as string | null,
    currentVideoId: null as string | null,
};

const initialAnalysisState = {
  isLoading: false,
  error: null as string | null,
  result: '',
  isComplete: false,
};


const analysisInstructions = `### BỐI CẢNH VÀ VAI TRÒ

Bạn là một Chuyên gia Phân tích Dữ liệu YouTube cao cấp. Nhiệm vụ của bạn là phân tích dữ liệu thô (được cung cấp dưới dạng tệp CSV) từ các kênh YouTube cạnh tranh trong cùng một thị trường ngách (ví dụ: giáo dục tài chính, lịch sử kinh tế).

Sản phẩm cuối cùng của bạn phải là một **Báo cáo Phân tích Cạnh tranh** chi tiết, chuyên nghiệp, và mang tính tư vấn chiến lược bằng **tiếng Việt**. Văn phong phải sâu sắc, tự tin và dựa trên dữ liệu, tương tự như báo cáo mẫu đã được cung cấp.

### DỮ LIỆU ĐẦU VÀO

Bạn sẽ nhận được dữ liệu từ các tệp CSV, bao gồm:
1.  **Tổng Quan Thư Viện (\`Tong Quan Thu Vien.csv\`):** Chứa danh sách các kênh, Lượt Đăng Ký, Số Lượng Video.
2.  **Chi tiết Kênh (\`[Tên Kênh].csv\`):** Chứa danh sách video của kênh đó, bao gồm Tiêu đề, Ngày đăng, Lượt xem, Lượt thích, và Thời lượng.

### YÊU CẦU PHÂN TÍCH CHUYÊN SÂU

Khi tạo báo cáo, bạn phải vượt qua việc liệt kê số liệu. Hãy tập trung vào việc **DIỄN GIẢI** dữ liệu để tìm ra các insight chiến lược. Báo cáo phải so sánh trực tiếp các kênh được phân tích và bao gồm các yếuá tố sau:

1.  **Phân tích Hiệu suất (Performance):**
    * Tính toán các chỉ số trung vị (Median) cho Lượt xem, Thời lượng, và Lượt xem/Ngày (VPD) để tránh sai lệch từ các video viral.
    * **[Yếu tố mới] Tỷ lệ Tương tác (Engagement Rate):** Tính tỷ lệ Lượt thích / Lượt xem trung bình cho mỗi kênh.
    * **[Yếu tố mới] Vận tốc Nội dung (Content Velocity):** Phân tích tần suất đăng bài (ví dụ: số video/tháng) dựa trên dữ liệu ngày đăng.
    * **[Yếu tố mới] Hiệu suất Người đăng ký (Subscriber Efficiency):** Ước tính (nếu có thể) tỷ lệ Lượt xem / Lượt đăng ký để xem kênh nào tận dụng tệp khán giả tốt hơn.

2.  **Phân tích Nội dung & Tiêu đề (Content & Title):**
    * Đây là phần quan trọng nhất. Đừng chỉ liệt kê từ khóa.
    * Xác định các video "Hit" (ví dụ: Top 10% về lượt xem hoặc VPD).
    * Giải mã các **Mẫu Tiêu đề Tâm lý** thành công (ví dụ: Tạo sự Tò mò, Khẩn cấp (FOMO), Kiến thức Bí mật, Gây tranh cãi, Tuyên bố Giá trị Rõ ràng)[cite: 29, 30, 31, 32].
    * Xác định các **Trụ cột Chủ đề (Topic Pillars)** chính của mỗi kênh (ví dụ: Kênh A tập trung vào "Lịch sử", Kênh B tập trung vào "Bí mật ngành tài chính").

3.  **Phân tích Thời gian & Thời lượng (Time & Duration):**
    * Xác định các "điểm ngọt" (sweet spots) về thời lượng video cho mỗi kênh (ví dụ: 5-10 phút vs. 20+ phút)[cite: 39, 41].
    * Phân tích thời gian đăng bài (Ngày trong tuần, Khung giờ) và đưa ra nhận định[cite: 36, 37].

### CẤU TRÚC BÁO CÁO BẮT BUỘC (TUÂN THỦ NGHIÊM NGẶT)

Bạn PHẢI trình bày báo cáo của mình theo đúng 6 phần sau đây (dựa trên tệp \`.doc\` mẫu):

---

**Ngày:** [Ngày hiện tại]
**Người thực hiện:** Chuyên gia Phân tích Dữ liệu YouTube
**Các kênh phân tích:** [Liệt kê các kênh được phân tích]

**1. Tóm tắt cho Lãnh đạo (Executive Summary)**
* Tổng hợp các phát hiện chính.
* Xác định các chiến lược thành công cốt lõi (ví dụ: Kể chuyện vs. Chuyên sâu).
* Đề xuất chiến lược cấp cao cho một kênh mới.

**2. Tổng quan Hiệu suất các Kênh (Channel Performance Overview)**
* Trình bày dưới dạng **BẢNG SO SÁNH**.
* Các chỉ số bao gồm: Số video phân tích, Tổng Lượt xem, Lượt xem Trung vị/Video, Lượt xem/Ngày Trung vị (VPD), Thời lượng Trung vị, Tỷ lệ Tương tác (Likes/Views), Tần suất Đăng bài.
* Đưa ra nhận định ngắn gọn sau bảng.

**3. Phân tích Nội dung & Tiêu đề (Content & Title Analysis)**
* Liệt kê các video hiệu suất cao nhất (Theo Lượt xem tuyệt đối và Theo Lượt xem/Ngày).
* Phân tích sâu về các **Mẫu Tiêu đề Tâm lý** thành công (như đã yêu cầu ở trên).
* Phân tích các **Trụ cột Chủ đề** và Từ khóa Nổi bật.

**4. Phân tích Thời gian & Thời lượng (Time & Duration Analysis)**
* Phân tích thời gian đăng bài hiệu quả.
* Phân tích các nhóm thời lượng video thành công (ví dụ: "điểm ngọt").

**5. Các insight chính (Key Insights)**
* Trình bày 3-5 insight quan trọng nhất dưới dạng gạch đầu dòng (ví dụ: "Tâm lý học Thắng thế Từ khóa", "Hai Lối đi Rõ rệt", "Lời hứa về Giá trị là Vua")[cite: 44, 46, 48].

**6. Đề xuất Chiến lược (Xây dựng Kênh Mới)**
* Đây là phần tư vấn hành động.
* **Định vị & Khác biệt hóa:** Đề xuất tên kênh, góc tiếp cận.
* **Chiến lược Nội dung (Mô hình Hybrid):** Đề xuất sự kết hợp của Nội dung Trụ cột (Pillar Content) và Nội dung Hỗ trợ (Supporting Content)[cite: 55, 57].
* **Lịch trình Đăng bài:** Đề xuất ngày/giờ cụ thể[cite: 60, 61].
* **Chiến lược Tăng trưởng Ban đầu:** Tối ưu hóa tiêu đề, tương tác, v.v.[cite: 64, 65].
`;

interface ChannelQueueListProps {
  queue: string[];
  onAnalyze: (url: string) => void;
  onRemove: (url: string) => void;
  currentlyAnalyzingUrl: string | null;
  theme: Theme;
}

const ChannelQueueList: React.FC<ChannelQueueListProps> = ({
  queue,
  onAnalyze,
  onRemove,
  currentlyAnalyzingUrl,
  theme,
}) => {
  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Danh sách chờ phân tích ({queue.length})</h3>
      <div className="bg-[#24283b] p-4 rounded-lg space-y-3 max-h-60 overflow-y-auto">
        {queue.map((url, index) => {
          const isAnalyzing = currentlyAnalyzingUrl === url;
          const isAnotherAnalyzing = currentlyAnalyzingUrl !== null && !isAnalyzing;
          return (
            <div key={`${url}-${index}`} className="flex items-center justify-between bg-[#2d303e] p-3 rounded-md">
              <span className="text-sm text-gray-400 truncate flex-1 pr-4">{url}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAnalyze(url)}
                  disabled={isAnalyzing || isAnotherAnalyzing}
                  className={`flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50
                    bg-${theme}-600 hover:bg-${theme}-700 text-white`
                  }
                >
                  {isAnalyzing ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Phân tích'
                  )}
                </button>
                <button
                  onClick={() => onRemove(url)}
                  disabled={isAnalyzing}
                  className="bg-red-800 hover:bg-red-900 text-white p-2.5 rounded-md transition-colors disabled:opacity-50"
                  title="Xóa khỏi danh sách"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- START: Transcript Modal Component ---
interface TranscriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: Video | null;
    transcript: string;
    isLoading: boolean;
    error: string | null;
    theme: Theme;
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose, video, transcript, isLoading, error, theme }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        if (isOpen) {
            setCopyStatus('idle'); // Reset on open
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!transcript) return;
        navigator.clipboard.writeText(transcript).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <SpinnerIcon className="w-10 h-10 mx-auto animate-spin text-gray-400" />
                    <p className="mt-4 text-gray-300">AI đang lấy transcript... Quá trình này có thể mất một lúc.</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-12">
                    <p className="text-red-400">Lỗi:</p>
                    <p className="mt-2 text-sm bg-red-900/50 p-3 rounded-md">{error}</p>
                </div>
            );
        }
        return (
            <div className="bg-[#1a1b26] p-4 rounded-md h-full overflow-y-auto">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white truncate pr-4">Transcript cho: {video?.snippet.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>

                <div className="mt-6 flex justify-end items-center space-x-4">
                    <button 
                        onClick={handleCopy} 
                        disabled={isLoading || !!error || !transcript}
                        className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
                    >
                        <ClipboardCopyIcon className="w-5 h-5 mr-2" />
                        {copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép'}
                    </button>
                    <button onClick={onClose} className={`py-2 px-6 rounded-lg bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold transition-colors`}>Đóng</button>
                </div>
            </div>
        </div>
    );
};
// --- END: Transcript Modal Component ---

export default function App() {
  const [appConfig, setAppConfig] = useLocalStorage<StoredConfig>('yt-analyzer-config-v2', initialConfig);
  const [savedSessions, setSavedSessions] = useLocalStorage<SavedSession[]>('yt-analyzer-sessions-v1', []);
  const [analysisState, setAnalysisState] = useLocalStorage('yt-analyzer-analysis-v1', initialAnalysisState);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataSynced, setIsDataSynced] = useState(false);

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isCompetitiveAnalysisModalOpen, setIsCompetitiveAnalysisModalOpen] = useState(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);
  const [isLoadedFromSession, setIsLoadedFromSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brainstormMessages, setBrainstormMessages] = useState<ChatMessage[]>([]);
  
  const [channelQueue, setChannelQueue] = useState<string[]>([]);
  const [currentlyAnalyzingUrl, setCurrentlyAnalyzingUrl] = useState<string | null>(null);

  const [transcriptModalState, setTranscriptModalState] = useState(initialTranscriptState);

  const debounceTimeoutRef = useRef<number | null>(null);

  // --- Auth & Data Sync Effects ---
  useEffect(() => {
      const { subscription } = onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setIsAuthLoading(false);
      });
      return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      const syncData = async () => {
          if (user && !isDataSynced) {
              const cloudData = await getUserData();
              if (cloudData) {
                  // Merge sessions
                  const localSessions = savedSessions;
                  const cloudSessions = cloudData.library_sessions || [];
                  const mergedSessionsMap = new Map<string, SavedSession>();
                  
                  localSessions.forEach(s => mergedSessionsMap.set(s.id, s));
                  cloudSessions.forEach(s => {
                      const existing = mergedSessionsMap.get(s.id);
                      if (!existing || new Date(s.savedAt) > new Date(existing.savedAt)) {
                          mergedSessionsMap.set(s.id, s);
                      }
                  });
                  const finalSessions = Array.from(mergedSessionsMap.values());
                  setSavedSessions(finalSessions);

                  // Set analysis and config (cloud takes precedence)
                  if (cloudData.analysis_state) setAnalysisState(cloudData.analysis_state);
                  if (cloudData.app_settings) {
                      // Cloud data is the source of truth. Merge with initial config
                      // to ensure the object shape is correct, then set state.
                      const cloudConfig = { ...initialConfig, ...cloudData.app_settings };
                      setAppConfig(cloudConfig);
                  }
              }
              setIsDataSynced(true);
          }
      };
      syncData();
  }, [user, isDataSynced, savedSessions, setSavedSessions, setAnalysisState, setAppConfig]);

  // Debounced save to Supabase
  useEffect(() => {
    if (user && isDataSynced) {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = window.setTimeout(() => {
            console.log("Saving data to cloud...");
            saveUserData({
                app_settings: appConfig,
                library_sessions: savedSessions,
                analysis_state: analysisState,
            });
        }, 2000); // 2-second debounce
    }

    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, [appConfig, savedSessions, analysisState, user, isDataSynced]);


  useEffect(() => {
    // Prevent analysis from being stuck in a loading state on page reload
    if (analysisState.isLoading) {
      setAnalysisState(prev => ({ ...prev, isLoading: false }));
    }
  }, []); // Run only once on component mount

  const createInitialBrainstormMessage = useCallback((chInfo: ChannelInfo, keywords: string[]): ChatMessage[] => {
      if (!chInfo || keywords.length === 0) return [];
      const systemPrompt = `Xin chào! Tôi là trợ lý AI sáng tạo của bạn. Tôi đã xem qua kênh "${chInfo.title}" và nhận thấy các chủ đề nổi bật gần đây là: **${keywords.join(', ')}**.
      
Làm thế nào để tôi có thể giúp bạn brainstorm ý tưởng video mới hôm nay? Bạn có thể hỏi tôi về:
- 5 ý tưởng video mới dựa trên từ khóa "abc".
- Gợi ý một tiêu đề hấp dẫn cho video về "xyz".
- Phân tích đối tượng khán giả của kênh.`;
      
      return [{ role: 'model', content: systemPrompt }];
  }, []);

  const handleFetchVideos = useCallback(async (channelUrl: string) => {
    const youtubeApiKey = appConfig.youtube.key;
    if (!youtubeApiKey) {
      setError('Vui lòng thêm YouTube API Key của bạn trong cài đặt API.');
      setIsApiModalOpen(true);
      return;
    }
    setIsLoading(true);
    setIsLoadedFromSession(false);
    setError(null);
    setVideos([]);
    setChannelInfo(null);
    setNextPageToken(undefined);
    setBrainstormMessages([]);

    try {
      const info = await getChannelInfoByUrl(channelUrl, youtubeApiKey);
      setChannelInfo(info);

      const videoData = await fetchVideosPage(info.uploadsPlaylistId, youtubeApiKey);
      setVideos(videoData.videos);
      setNextPageToken(videoData.nextPageToken);

      const keywordCounts = calculateKeywordCounts(videoData.videos);
      const topKeywords = getTopKeywords(keywordCounts, 10);
      const newBrainstormMessages = createInitialBrainstormMessage(info, topKeywords);
      setBrainstormMessages(newBrainstormMessages);
      
      // Auto-save session
      const newSession: SavedSession = {
        id: info.id,
        savedAt: new Date().toISOString(),
        channelInfo: info,
        videos: videoData.videos,
        nextPageToken: videoData.nextPageToken,
        brainstormMessages: newBrainstormMessages,
      };

      setSavedSessions(prevSessions => {
          const newSessionsList = [...prevSessions];
          const existingIndex = newSessionsList.findIndex(s => s.id === newSession.id);
          if (existingIndex > -1) {
              newSessionsList[existingIndex] = newSession;
          } else {
              newSessionsList.push(newSession);
          }
          return newSessionsList;
      });
      
      // On success, remove from queue
      setChannelQueue(prev => prev.filter(url => url !== channelUrl));

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
      setCurrentlyAnalyzingUrl(null);
    }
  }, [appConfig, createInitialBrainstormMessage, setSavedSessions]);

  const handleQueueSubmit = (urlsText: string) => {
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.includes('youtube.com/') || url.includes('youtu.be/')));
    
    if (urls.length > 0) {
      setChannelQueue(prev => {
        const newUrls = urls.filter(url => !prev.includes(url));
        return [...prev, ...newUrls];
      });
    }
  };

  const handleRemoveFromQueue = (urlToRemove: string) => {
    setChannelQueue(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleAnalyzeFromQueue = async (url: string) => {
    if (currentlyAnalyzingUrl) return;
    setCurrentlyAnalyzingUrl(url);
    await handleFetchVideos(url);
  };


  const handleLoadMore = useCallback(async () => {
    const youtubeApiKey = appConfig.youtube.key;
    if (!nextPageToken || !channelInfo || !youtubeApiKey) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const videoData = await fetchVideosPage(channelInfo.uploadsPlaylistId, youtubeApiKey, nextPageToken);
      setVideos(prev => [...prev, ...videoData.videos]);
      setNextPageToken(videoData.nextPageToken);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải thêm video.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, channelInfo, appConfig]);

  const handleLoadSession = (sessionId: string) => {
    const session = savedSessions.find(s => s.id === sessionId);
    if (session) {
      setChannelInfo(session.channelInfo);
      setVideos(session.videos);
      setNextPageToken(session.nextPageToken);
      
      if (session.brainstormMessages && session.brainstormMessages.length > 0) {
        setBrainstormMessages(session.brainstormMessages);
      } else {
        const keywordCounts = calculateKeywordCounts(session.videos);
        const topKeywords = getTopKeywords(keywordCounts, 10);
        setBrainstormMessages(createInitialBrainstormMessage(session.channelInfo, topKeywords));
      }

      setIsLoadedFromSession(true);
      setIsLibraryModalOpen(false);
      setError(null);
    }
  };

  const handleUpdateChannel = useCallback(async () => {
    if (!channelInfo || !appConfig.youtube.key) {
        setError('Không có thông tin kênh hoặc thiếu API key để cập nhật.');
        return;
    }
    setIsUpdating(true);
    setError(null);
    
    try {
      const urlToFetch = channelInfo.customUrl 
          ? `https://www.youtube.com/${channelInfo.customUrl}` 
          : `https://www.youtube.com/channel/${channelInfo.id}`;
      
      const newInfo = await getChannelInfoByUrl(urlToFetch, appConfig.youtube.key);
      setChannelInfo(newInfo);

      const videoData = await fetchVideosPage(newInfo.uploadsPlaylistId, appConfig.youtube.key);
      setVideos(videoData.videos);
      setNextPageToken(videoData.nextPageToken);
      
      const keywordCounts = calculateKeywordCounts(videoData.videos);
      const topKeywords = getTopKeywords(keywordCounts, 10);
      const newBrainstormMessages = createInitialBrainstormMessage(newInfo, topKeywords);
      setBrainstormMessages(newBrainstormMessages);

      // Auto-save the updated session silently in the background
      const updatedSession: SavedSession = {
          id: newInfo.id,
          savedAt: new Date().toISOString(),
          channelInfo: newInfo,
          videos: videoData.videos,
          nextPageToken: videoData.nextPageToken,
          brainstormMessages: newBrainstormMessages,
      };
      
      setSavedSessions(prevSessions => {
          const newSessionsList = [...prevSessions];
          const existingIndex = newSessionsList.findIndex(s => s.id === updatedSession.id);
          if (existingIndex > -1) {
              newSessionsList[existingIndex] = updatedSession;
          }
          return newSessionsList;
      });
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể cập nhật kênh.');
    } finally {
      setIsUpdating(false);
    }
  }, [channelInfo, appConfig.youtube.key, setSavedSessions, createInitialBrainstormMessage]);
  
  const handleUpdateSession = useCallback(async (sessionId: string) => {
      const sessionToUpdate = savedSessions.find(s => s.id === sessionId);
      if (!sessionToUpdate || !appConfig.youtube.key) {
          setError('Không tìm thấy phiên hoặc thiếu API key để cập nhật.');
          return;
      }
      setUpdatingSessionId(sessionId);
      setError(null);
      
      try {
          const urlToFetch = sessionToUpdate.channelInfo.customUrl 
              ? `https://www.youtube.com/${sessionToUpdate.channelInfo.customUrl}` 
              : `https://www.youtube.com/channel/${sessionToUpdate.channelInfo.id}`;
        
          const newInfo = await getChannelInfoByUrl(urlToFetch, appConfig.youtube.key);
          const videoData = await fetchVideosPage(newInfo.uploadsPlaylistId, appConfig.youtube.key);
          
          const keywordCounts = calculateKeywordCounts(videoData.videos);
          const topKeywords = getTopKeywords(keywordCounts, 10);
          const newBrainstormMessages = createInitialBrainstormMessage(newInfo, topKeywords);

          const updatedSession: SavedSession = {
              id: newInfo.id,
              savedAt: new Date().toISOString(),
              channelInfo: newInfo,
              videos: videoData.videos,
              nextPageToken: videoData.nextPageToken,
              brainstormMessages: newBrainstormMessages,
          };
        
          setSavedSessions(prevSessions => {
              const newSessionsList = [...prevSessions];
              const existingIndex = newSessionsList.findIndex(s => s.id === updatedSession.id);
              if (existingIndex > -1) {
                  newSessionsList[existingIndex] = updatedSession;
              }
              return newSessionsList;
          });
        
      } catch (err) {
          const errorMsg = err instanceof Error ? err.message : `Không thể cập nhật kênh ${sessionToUpdate.channelInfo.title}.`;
          console.error(err);
          // Set error temporarily to show user
          setError(errorMsg);
          // Clear error after a few seconds
          setTimeout(() => setError(null), 5000);
      } finally {
          setUpdatingSessionId(null);
      }
  }, [savedSessions, appConfig.youtube.key, setSavedSessions, createInitialBrainstormMessage]);


  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên này không?')) {
        const newSessionsList = savedSessions.filter(s => s.id !== sessionId);
        try {
            setSavedSessions(newSessionsList);
        } catch(e) {
            setError(e instanceof Error ? e.message : "Không thể xóa phiên.");
        }
    }
  };

  const handleImportSessions = async (importedSessions: SavedSession[]) => {
    if (!Array.isArray(importedSessions)) {
      setError('Tệp nhập không hợp lệ.');
      alert('Tệp nhập không hợp lệ.');
      return;
    }

    if (importedSessions.length > 0) {
        const firstItem = importedSessions[0];
        if (typeof firstItem.id !== 'string' || typeof firstItem.channelInfo?.id !== 'string' || !Array.isArray(firstItem.videos)) {
            const msg = 'Định dạng dữ liệu trong tệp nhập không chính xác.';
            setError(msg);
            alert(msg);
            return;
        }
    }

    const mergedSessionsMap = new Map<string, SavedSession>();
    savedSessions.forEach(session => mergedSessionsMap.set(session.id, session));
    importedSessions.forEach(session => mergedSessionsMap.set(session.id, session));
    
    const newSessionsList = Array.from(mergedSessionsMap.values());

    try {
      setSavedSessions(newSessionsList);
      setIsLibraryModalOpen(false);
      alert(`Đã nhập và hợp nhất thành công ${importedSessions.length} phiên. Tổng số phiên hiện tại: ${newSessionsList.length}.`);
    } catch(e) {
      const errorMsg = e instanceof Error ? e.message : "Không thể lưu các phiên đã nhập.";
      setError(errorMsg);
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  const handleExportExcel = () => {
    if (savedSessions.length === 0) {
        alert('Không có phiên nào để xuất.');
        return;
    }

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = savedSessions.map(session => ({
        'Tên Kênh': session.channelInfo.title,
        'Lượt Đăng Ký': parseInt(session.channelInfo.subscriberCount, 10),
        'Số Lượng Video': parseInt(session.channelInfo.videoCount, 10),
        'Ngày Lưu': new Date(session.savedAt).toLocaleString('vi-VN'),
    }));
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Tổng Quan Thư Viện');

    // Individual Channel Sheets
    savedSessions.forEach(session => {
        const videoData = session.videos.map(video => ({
            'Tiêu đề': video.snippet.title,
            'Ngày đăng': formatDate(video.snippet.publishedAt),
            'Lượt xem': parseInt(video.statistics.viewCount, 10),
            'Lượt thích': parseInt(video.statistics.likeCount, 10),
            'Thời lượng': parseISO8601Duration(video.contentDetails.duration),
            'URL': `https://www.youtube.com/watch?v=${video.id}`
        }));
        const videoWorksheet = XLSX.utils.json_to_sheet(videoData);
        videoWorksheet['!cols'] = [{ wch: 70 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 45 }];
        // Sheet names have a 31-character limit
        const safeSheetName = session.channelInfo.title.replace(/[^\w\s]/gi, '').substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, videoWorksheet, safeSheetName);
    });

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Thu_vien_kenh_YouTube_${date}.xlsx`);
  };

  const handleExportJson = () => {
    if (savedSessions.length === 0) {
        alert('Không có phiên nào để xuất.');
        return;
    }

    try {
        const dataStr = JSON.stringify(savedSessions, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `Thu_vien_kenh_YouTube_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Không thể tạo tệp JSON.";
        setError(errorMsg);
        alert(`Lỗi: ${errorMsg}`);
    }
  };


  const handleGetTranscript = async (video: Video) => {
      setTranscriptModalState({
          isOpen: true,
          video,
          transcript: '',
          isLoading: true,
          error: null,
          currentVideoId: video.id,
      });

      const { aiProvider, gemini, openai } = appConfig;
      let providerHasKey = false;
      let providerName = '';

      if (aiProvider === 'gemini') {
          providerHasKey = !!gemini.key && gemini.key.trim() !== '';
          providerName = 'Gemini';
      } else { // 'openai'
          providerHasKey = !!openai.key && openai.key.trim() !== '';
          providerName = 'OpenAI';
      }

      if (!providerHasKey) {
          const errorMsg = `Vui lòng thêm API Key cho ${providerName} và chọn model tương ứng trong phần cài đặt API để sử dụng tính năng này.`;
          setTranscriptModalState(s => (s.currentVideoId === video.id ? { ...s, isLoading: false, error: errorMsg } : s));
          setIsApiModalOpen(true);
          return;
      }

      try {
          let transcriptText: string;
          if (aiProvider === 'gemini') {
              transcriptText = await generateTranscriptWithGemini(
                  gemini.key,
                  appConfig.aiModel,
                  video.id
              );
          } else { // openai
              transcriptText = await generateTranscriptWithOpenAI(
                  openai.key,
                  appConfig.aiModel,
                  video.id
              );
          }
          setTranscriptModalState(s => (s.currentVideoId === video.id ? { ...s, isLoading: false, transcript: transcriptText } : s));
      } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
          setTranscriptModalState(s => (s.currentVideoId === video.id ? { ...s, isLoading: false, error: errorMsg } : s));
      }
  };

  const handleStartCompetitiveAnalysis = async (selectedChannelIds: string[]) => {
      if (selectedChannelIds.length < 2) return;

      if (appConfig.aiProvider !== 'gemini') {
        setAnalysisState({
          isLoading: false,
          error: 'Tính năng này yêu cầu chọn một model của Gemini trong cài đặt API.',
          result: '',
          isComplete: true,
        });
        return;
      }
      
      setAnalysisState({ isLoading: true, error: null, result: '', isComplete: false });

      try {
        const selectedSessions = savedSessions.filter(s => selectedChannelIds.includes(s.id));
        const channelNames = selectedSessions.map(s => s.channelInfo.title);

        const headers = ["Channel Name", "Video Title", "Publish Date", "View Count", "Likes", "Duration (ISO 8601)"];
        const rows = selectedSessions.flatMap(session => 
            session.videos.map(video => [
                `"${session.channelInfo.title.replace(/"/g, '""')}"`,
                `"${video.snippet.title.replace(/"/g, '""')}"`,
                video.snippet.publishedAt,
                video.statistics.viewCount || '0',
                video.statistics.likeCount || '0',
                video.contentDetails.duration || 'PT0S'
            ].join(','))
        );
        const csvData = [headers.join(','), ...rows].join('\n');
        
        const result = await performCompetitiveAnalysis(
            appConfig.gemini.key,
            appConfig.aiModel,
            csvData,
            analysisInstructions,
            channelNames
        );

        setAnalysisState({ isLoading: false, error: null, result: result, isComplete: true });

      } catch (err) {
        setAnalysisState({ 
          isLoading: false, 
          error: err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.', 
          result: '', 
          isComplete: true 
        });
      }
  };

  const handleCloseCompetitiveAnalysisModal = () => {
    setIsCompetitiveAnalysisModalOpen(false);
  };

  const handleResetCompetitiveAnalysis = () => {
    setAnalysisState(initialAnalysisState);
  };


  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] font-sans">
      <ApiModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)}
        config={appConfig}
        setConfig={setAppConfig}
        theme={appConfig.theme}
      />
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
        onUpdate={handleUpdateSession}
        updatingSessionId={updatingSessionId}
        theme={appConfig.theme}
        onExportExcel={handleExportExcel}
        onExportJson={handleExportJson}
        onImport={handleImportSessions}
      />
      <CompetitiveAnalysisModal
        isOpen={isCompetitiveAnalysisModalOpen}
        onClose={handleCloseCompetitiveAnalysisModal}
        sessions={savedSessions}
        appConfig={appConfig}
        theme={appConfig.theme}
        onStartAnalysis={handleStartCompetitiveAnalysis}
        analysisState={analysisState}
        onResetAnalysis={handleResetCompetitiveAnalysis}
      />
      <TranscriptModal 
        isOpen={transcriptModalState.isOpen}
        onClose={() => setTranscriptModalState(initialTranscriptState)}
        video={transcriptModalState.video}
        transcript={transcriptModalState.transcript}
        isLoading={transcriptModalState.isLoading}
        error={transcriptModalState.error}
        theme={appConfig.theme}
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header 
            onApiClick={() => setIsApiModalOpen(true)}
            onLibraryClick={() => setIsLibraryModalOpen(true)}
            theme={appConfig.theme}
            setAppConfig={setAppConfig}
            onCompetitiveAnalysisClick={() => setIsCompetitiveAnalysisModalOpen(true)}
            isCompetitiveAnalysisAvailable={savedSessions.length >= 2}
            analysisState={analysisState}
            user={user}
            isAuthLoading={isAuthLoading}
            onLogin={signInWithGoogle}
            onLogout={signOut}
        />
        <main className="mt-8">
          <ChannelInputForm onSubmit={handleQueueSubmit} isLoading={!!currentlyAnalyzingUrl} theme={appConfig.theme} />
          
          <ChannelQueueList
            queue={channelQueue}
            onAnalyze={handleAnalyzeFromQueue}
            onRemove={handleRemoveFromQueue}
            currentlyAnalyzingUrl={currentlyAnalyzingUrl}
            theme={appConfig.theme}
          />
          
          {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          
          {isLoading && (
              <div className="text-center py-12">
                  <SpinnerIcon className="w-10 h-10 mx-auto animate-spin text-gray-400" />
                  <p className="mt-4 text-gray-300">Đang tải dữ liệu kênh...</p>
              </div>
          )}

          {videos.length > 0 && channelInfo && !isLoading && (
            <div className="mt-8 p-6 bg-[#24283b] rounded-lg">
                <ChannelHeader channelInfo={channelInfo} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 mb-6">
                    <div className="lg:col-span-2">
                        <KeywordAnalysis videos={videos} channelInfo={channelInfo} theme={appConfig.theme} />
                    </div>
                    <div>
                        <AnalysisTools 
                          videos={videos}
                          channelInfo={channelInfo} 
                          appConfig={appConfig} 
                          brainstormMessages={brainstormMessages}
                          setBrainstormMessages={setBrainstormMessages}
                          theme={appConfig.theme}
                          onUpdateChannel={handleUpdateChannel}
                          isUpdating={isUpdating}
                          isLoadedFromSession={isLoadedFromSession}
                        />
                    </div>
                </div>
                <VideoTable videos={videos} theme={appConfig.theme} onGetTranscript={handleGetTranscript} />
                 {nextPageToken && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className={`bg-${appConfig.theme}-600 hover:bg-${appConfig.theme}-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50`}
                      >
                        {isLoadingMore ? 'Đang tải...' : 'Tải thêm 50 video'}
                      </button>
                    </div>
                  )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}