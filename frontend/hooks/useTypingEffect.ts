import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    
    if (!text) {
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, speed);

    return () => {
      clearInterval(intervalId);
      setIsTyping(false);
    };
  }, [text, speed]);

  return { displayedText, isTyping };
};
