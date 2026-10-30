export const useVoiceAlert = () => {
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // purani voice band karo
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.1; u.volume = 1; u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };
  return { speak };
};