import { Video } from '../types';

export const vietnameseStopWords = new Set([
    'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'bị', 'bởi', 'cả',
    'cần', 'càng', 'chắc', 'chắn', 'chỉ', 'chiếc', 'cho', 'chứ', 'chưa', 'có', 'có thể',
    'cứ', 'của', 'cùng', 'cũng', 'đã', 'đang', 'đây', 'để', 'đến', 'đều', 'điều', 'do',
    'đó', 'được', 'gì', 'hơn', 'hết', 'khi', 'không', 'là', 'làm', 'lại', 'lên', 'lúc',
    'mà', 'mỗi', 'một cách', 'này', 'nên', 'nếu', 'ngay', 'nhiều', 'như', 'nhưng',
    'những', 'nơi', 'nữa', 'phải', 'qua', 'ra', 'rằng', 'rất', 'rồi', 'sau', 'sẽ',
    'so', 'sự', 'tại', 'theo', 'thì', 'trên', 'trước', 'từ', 'từng', 'và', 'vào', 'vẫn',
    'về', 'vì', 'với', 'vừa', 'thứ', 'anh', 'em', 'chị', 'bạn', 'tôi', 'cách', 'để có', 'làm sao',
    // English common words
    'a','an','the','and','or','but','for','in','on','at','to','of','i','you','he','she','it','we','they','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','can','could','not','no','this','that','these','those','my','your','his','her','its','our','their', 'with', 'from', 'by', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'how', 'what', 'when', 'where', 'why',
    // Common YouTube title filler
    'new', 'hot', 'top', 'best', 'official', 'video', 'music', 'live', 'full', 'hd', 'mv', 'ep', 'part', 'series', 'episode'
]);

export const calculateKeywordCounts = (videos: Video[]): Map<string, number> => {
    const counts = new Map<string, number>();
    
    videos.forEach(video => {
      const title = video.snippet.title.toLowerCase();
      
      const originalWords = title.split(/\s+/).filter(Boolean);

      // Generate N-grams (phrases of 1, 2, and 3 words)
      for (let n = 1; n <= 3; n++) {
        if(originalWords.length < n) continue;
        for (let i = 0; i <= originalWords.length - n; i++) {
          const ngramWords = originalWords.slice(i, i + n);
          
          if (vietnameseStopWords.has(ngramWords[0]) || vietnameseStopWords.has(ngramWords[n - 1])) {
              continue;
          }

          const phrase = ngramWords.join(' ').replace(/[/,.\-()|[\]"“”:?!]+/g, '').trim();
          
          if (phrase && phrase.length > 2 && isNaN(parseInt(phrase))) {
             counts.set(phrase, (counts.get(phrase) || 0) + 1);
          }
        }
      }
    });

    const filteredCounts = new Map<string, number>();
    for(const [key, value] of counts.entries()) {
        if(value > 1) { // Only include keywords/phrases that appear more than once
            filteredCounts.set(key, value);
        }
    }
    
    return new Map([...filteredCounts.entries()].sort((a, b) => b[1] - a[1]));
};

export const getTopKeywords = (keywordCounts: Map<string, number>, count: number): string[] => {
    return Array.from(keywordCounts.keys()).slice(0, count);
};
