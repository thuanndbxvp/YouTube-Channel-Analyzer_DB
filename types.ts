export type Theme = 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface StoredConfig {
  theme: Theme;
  aiProvider: AiProvider;
  aiModel: string;
  youtube: {
    key: string;
  };
  gemini: {
    key: string;
  };
  openai: {
    key: string;
  };
}

export type AiProvider = 'gemini' | 'openai';

export interface VideoSnippet {
  publishedAt: string;
  title: string;
  description:string;
  thumbnails: {
    default: { url: string; };
    medium: { url: string; };
    high: { url: string; };
  };
  channelTitle: string;
  resourceId: {
    videoId: string;
  }
}

export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface VideoContentDetails {
  duration: string;
}

export interface Video {
  id: string;
  snippet: VideoSnippet;
  statistics: VideoStatistics;
  contentDetails: VideoContentDetails;
  aiSummary?: string;
}

export interface ChannelInfo {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnail: string;
    uploadsPlaylistId: string;
    country?: string;
    subscriberCount: string;
    videoCount: string;
}

export interface SavedSession {
  id: string; // Will be the channel ID
  savedAt: string; // ISO date string
  channelInfo: ChannelInfo;
  videos: Video[];
  nextPageToken?: string;
  brainstormMessages?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
// FIX: Add UserProfile interface to fix import error in googleAuthService.ts
export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: string;
  isComplete: boolean;
}

// Data structure for Supabase
export interface UserData {
    app_settings: StoredConfig;
    library_sessions: SavedSession[];
    analysis_state: AnalysisState;
}

export interface VideoAnalysis {
  verification: {
    is_match: boolean;
    found_title: string;
    found_channel: string;
  };
  analysis: {
    summary: string;
    visualStyle: string;
    contentTone: string;
    transcript: string;
  };
}