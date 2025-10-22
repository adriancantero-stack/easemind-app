import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, speed: number = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    
    if (!text) {
      setIsTyping(false);
      return;
    }

    // Split text into words for word-by-word animation
    const words = text.split(' ');
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      if (currentIndex < words.length) {
        const currentText = words.slice(0, currentIndex + 1).join(' ');
        setDisplayedText(currentText);
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
