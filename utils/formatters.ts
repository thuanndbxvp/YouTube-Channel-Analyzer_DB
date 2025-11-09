export const parseISO8601Duration = (duration: string): string => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) {
    return "00:00";
  }

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  const format = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  }
  return `${format(minutes)}:${format(seconds)}`;
};

export const formatNumber = (num: string | number): string => {
    return Number(num).toLocaleString('en-US');
}

export const formatNumberShort = (numStr: string | number): string => {
    const num = Number(numStr);
    if (isNaN(num)) return '0';
    if (num < 1000) return String(num);

    const suffixes = ["", "K", "M", "B", "T"];
    const i = Math.floor(Math.log(num) / Math.log(1000));
    
    // Handle potential edge case where i might be out of bounds for huge numbers
    if (i >= suffixes.length) {
        return num.toExponential(1);
    }
    
    const shortNum = (num / Math.pow(1000, i));

    const fixed = shortNum < 10 && i > 0 ? shortNum.toFixed(1) : shortNum.toFixed(0);

    return fixed.replace(/\.0$/, '') + suffixes[i];
};


export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '/');
}