import { GoogleGenAI } from "@google/genai";
import { ChatMessage, VideoAnalysis } from '../types';

async function executeWithKeyRotation<T>(
    keysString: string,
    apiRequest: (key: string) => Promise<T>
): Promise<T> {
    const keys = keysString.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("Không có Gemini API key nào được cung cấp.");
    }
    let lastError: any = null;

    for (const key of keys) {
        try {
            const result = await apiRequest(key);
            return result;
        } catch (error: any) {
            lastError = error;
            console.warn(`Gemini API key ...${key.slice(-4)} thất bại. Thử key tiếp theo. Lỗi: ${error.message}`);
            continue;
        }
    }
    throw new Error(`Tất cả API key của Gemini đều không hợp lệ. Lỗi cuối cùng: ${lastError.message}`);
}

export const validateSingleApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      // A simple, low-cost call to check API key validity
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{text: 'test'}]}],
      });
      // If it doesn't throw, the key is valid.
      return !!response;
    } catch (error) {
      console.error(`Gemini key validation failed for ...${apiKey.slice(-4)}:`, error);
      return false;
    }
};


export const analyzeVideoContent = async (
  apiKeys: string,
  videoTitle: string,
  videoDescription: string
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not provided.");
    }
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Please provide a concise summary in Vietnamese for the following YouTube video.
        The summary should be about 2-3 sentences long.
        
        Video Title: "${videoTitle}"
        
        Video Description:
        ---
        ${videoDescription || 'No description provided.'}
        ---
        
        Summary:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });

      return response.text;
    } catch (error) {
      console.error("Error analyzing video with Gemini:", error);
      if (error instanceof Error) {
          throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi phân tích video.");
    }
  });
};

export const generateGeminiChatResponse = async (
  apiKeys: string,
  model: string,
  history: ChatMessage[]
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) throw new Error("Vui lòng cung cấp Gemini API key.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      return response.text;
    } catch (error) {
      console.error("Error generating chat response with Gemini:", error);
      if (error instanceof Error) {
          throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi chat với Gemini.");
    }
  });
};

export const performCompetitiveAnalysis = async (
  apiKeys: string,
  model: string,
  csvData: string,
  analysisInstructions: string,
  channelNames: string[]
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not provided.");
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const channelList = channelNames.join(', ');

      const fullPrompt = `
        Với vai trò là một chuyên gia phân tích dữ liệu YouTube, hãy thực hiện nhiệm vụ phân tích cạnh tranh dựa trên các hướng dẫn và dữ liệu được cung cấp.

        **Định nghĩa nhiệm vụ (JSON):**
        \`\`\`json
        ${analysisInstructions}
        \`\`\`

        ---

        **Dữ liệu Video (CSV):**
        Dưới đây là dữ liệu video từ nhiều kênh khác nhau. Các cột bao gồm: Channel Name, Video Title, Publish Date, View Count, Likes, Duration (ISO 8601).

        \`\`\`csv
        ${csvData}
        \`\`\`

        ---

        **Yêu cầu:**
        Hãy thực hiện phân tích theo định nghĩa nhiệm vụ trong file JSON và trả về kết quả.
        Tập trung vào việc tạo ra phần **"text_summary"** trước tiên, định dạng bằng Markdown rõ ràng, dễ đọc, tuân thủ văn phong và cấu trúc đã chỉ định. Sử dụng tiếng Việt cho toàn bộ báo cáo phân tích. Thêm một dòng "Các kênh phân tích: ${channelList}" vào bên dưới dòng "Người thực hiện:" ở đầu báo cáo.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: fullPrompt }] }],
      });

      return response.text;
    } catch (error) {
      console.error("Error performing competitive analysis with Gemini:", error);
      if (error instanceof Error) {
        throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi thực hiện phân tích cạnh tranh.");
    }
  });
};

export const analyzeVideoWithGemini = async (
    apiKeys: string,
    model: string,
    videoId: string,
    videoTitle: string,
    channelTitle: string
): Promise<VideoAnalysis> => {
    return executeWithKeyRotation(apiKeys, async (apiKey) => {
        if (!apiKey) {
            throw new Error("Gemini API key is not provided.");
        }
        try {
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `Bạn là một AI chuyên gia phân tích video YouTube có khả năng truy cập và hiểu nội dung từ URL.

**NHIỆM VỤ TỐI QUAN TRỌNG:** Phân tích chính xác và **DUY NHẤT** video tại URL sau: https://www.youtube.com/watch?v=${videoId}. KHÔNG được phân tích bất kỳ video nào khác có tiêu đề tương tự dựa trên kiến thức đã có.

**DỮ LIỆU ĐỂ XÁC MINH:**
- **Tiêu đề video mong muốn:** "${videoTitle}"
- **Kênh đăng tải mong muốn:** "${channelTitle}"

**YÊU CẦU ĐẦU RA:**
Bạn PHẢI trả lời bằng một đối tượng JSON duy nhất có cấu trúc như sau. KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON.

\`\`\`json
{
  "verification": {
    "is_match": boolean,
    "found_title": "string // Tiêu đề video bạn thực sự tìm thấy tại URL.",
    "found_channel": "string // Tên kênh bạn thực sự tìm thấy tại URL."
  },
  "analysis": {
    "summary": "string // Tóm tắt nội dung chính của video đã xác minh (3-4 câu).",
    "visualStyle": "string // Phân tích phong cách hình ảnh: tốc độ dựng, màu sắc, hiệu ứng.",
    "contentTone": "string // Phân tích giọng điệu và phong cách: trang trọng, hài hước, giáo dục, v.v.",
    "transcript": "string // Transcript đầy đủ của video. Trả về chuỗi rỗng nếu không có."
  }
}
\`\`\`

**HƯỚNG DẪN THỰC HIỆN:**
1.  Truy cập URL đã cho.
2.  So sánh tiêu đề và tên kênh bạn tìm thấy với "DỮ LIỆU ĐỂ XÁC MINH".
3.  Điền vào trường \`"is_match"\` là \`true\` nếu cả hai đều khớp, ngược lại là \`false\`.
4.  Điền vào \`"found_title"\` và \`"found_channel"\` với thông tin bạn thực sự tìm thấy tại URL.
5.  Nếu \`"is_match"\` là \`true\`, hãy tiến hành phân tích và điền vào mục \`"analysis"\`. Nếu là \`false\`, hãy để các trường trong \`"analysis"\` là chuỗi rỗng.`;
            
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                }
            });

            const jsonText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            const analysisResult = JSON.parse(jsonText) as VideoAnalysis;
            
             // Basic validation of the returned structure
            if (!analysisResult.verification || !analysisResult.analysis) {
                 throw new Error("Định dạng phản hồi từ AI không hợp lệ. Thiếu mục 'verification' hoặc 'analysis'.");
            }

            return analysisResult;
        } catch (error) {
            console.error("Error analyzing video with Gemini:", error);
            if (error instanceof Error) {
                const message = error.message.includes('JSON') ? 'AI đã trả về định dạng không hợp lệ, vui lòng thử lại.' : error.message;
                throw new Error(`Lỗi từ Gemini API: ${message}`);
            }
            throw new Error("Đã xảy ra lỗi không xác định khi phân tích video.");
        }
    });
};