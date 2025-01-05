export function debounce<T extends (...args: string[]) => void>(func: T, delay: number) {
    let timeoutId: NodeJS.Timeout | null = null;
  
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
  
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
}