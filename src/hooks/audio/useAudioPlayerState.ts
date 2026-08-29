import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayerState = (audioUrl: string | null, fallbackText?: string | null, voiceName?: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<number>(0);
  
  const usingFallback = !audioUrl && !!fallbackText;

  const stopFallbackTimer = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsEnded(false); // DO NOT mark as completed when manually stopped
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopFallbackTimer();
  }, [stopFallbackTimer]);

  useEffect(() => {
    stop();
    if (audioUrl && audioRef.current) {
      setError(null);
      setIsAudioLoaded(false);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(e => {
        console.error("Autoplay prevented", e);
        setError("Autoplay blocked. Click play to start.");
      });
    } else if (usingFallback) {
      setError(null);
      setIsAudioLoaded(true);
      
      const estimatedCharsPerSecond = 15;
      const estimatedDuration = (fallbackText?.length || 0) / estimatedCharsPerSecond;
      setDuration(estimatedDuration);
      durationRef.current = estimatedDuration;
      
      play();
    }
  }, [audioUrl, fallbackText, usingFallback]); // removed stop to prevent infinite re-renders if stop changes

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => { setIsPlaying(true); setIsEnded(false); };
    const handlePause = () => setIsPlaying(false);
    const handleEnd = () => { setIsPlaying(false); setIsEnded(true); };
    const handleLoadedData = () => {
      setIsAudioLoaded(true);
      setDuration(audio.duration);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setError("Failed to play audio. Please try again.");
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const play = useCallback(() => {
    if (audioUrl && audioRef.current) {
      setIsEnded(false);
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setError("Failed to play audio. Please try again.");
      });
    } else if (usingFallback && 'speechSynthesis' in window) {
      // Browser TTS
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsEnded(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText || '');
        
        // Try to apply the selected voice if possible
        if (voiceName) {
          const voices = window.speechSynthesis.getVoices();
          // Find voice by name, case insensitive, or fallback
          const selectedVoiceObj = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
          if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
        }

        utterance.onend = () => {
          setIsPlaying(false);
          setIsEnded(true);
          stopFallbackTimer();
          setCurrentTime(durationRef.current); // snap to end
        };
        utterance.onerror = (e) => {
          if (e.error !== 'canceled') {
            console.error("Speech synthesis error", e);
            setError("Browser speech failed.");
            setIsPlaying(false);
          }
        };
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsEnded(false);
        setCurrentTime(0);
      }
      
      stopFallbackTimer();
      fallbackIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationRef.current) {
            stopFallbackTimer();
            return durationRef.current;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  }, [audioUrl, fallbackText, usingFallback, stopFallbackTimer, voiceName]);

  const pause = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.pause();
    } else if (usingFallback && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      stopFallbackTimer();
    }
  }, [audioUrl, usingFallback, stopFallbackTimer]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = time;
    } else if (usingFallback) {
      // SpeechSynthesis doesn't natively support seeking easily without chunking.
      // We will just let the UI update but warn it's not perfect for speech.
    }
  }, [audioUrl, usingFallback]);

  const handleMuteToggle = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return {
    audioRef,
    isPlaying,
    isMuted,
    isAudioLoaded,
    isEnded,
    currentTime,
    duration,
    error,
    play,
    pause,
    stop,
    seek,
    handleTogglePlay,
    handleMuteToggle
  };
};
