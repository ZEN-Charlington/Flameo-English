// src/utils/AudioProvider.jsx
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [error, setError] = useState(null);

  const AUDIO_FILE = "/audio/like-a-dino.mp3";
  
  useEffect(() => {
    loadTrack();
  }, []);

  const loadTrack = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create audio element with local file
      if (audioRef.current) {
        audioRef.current.src = AUDIO_FILE;
        audioRef.current.volume = volume;
        audioRef.current.loop = true;
        audioRef.current.preload = 'metadata';
      } else {
        audioRef.current = new Audio(AUDIO_FILE);
        audioRef.current.volume = volume;
        audioRef.current.loop = true;
        audioRef.current.preload = 'metadata';
      }
      
      // Add event listeners
      audioRef.current.addEventListener('canplaythrough', () => {
        setIsLoading(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setError('Không thể tải file nhạc');
        setIsLoading(false);
      });
      
      audioRef.current.addEventListener('loadstart', () => {
        setIsLoading(true);
      });
      
    } catch (err) {
      console.error('Audio load error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const getSoundCloudClientId = async () => {
    // This function is no longer needed for local files
    return null;
  };

  const play = async () => {
    if (audioRef.current && !isLoading) {
      try {
        // Check if audio is ready to play
        if (audioRef.current.readyState >= 2) {
          await audioRef.current.play();
          setIsPlaying(true);
        } else {
          // Wait for audio to be ready
          audioRef.current.addEventListener('canplaythrough', async () => {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch (error) {
              console.error('Play error:', error);
              setError('Không thể phát nhạc');
            }
          }, { once: true });
        }
      } catch (error) {
        console.error('Play error:', error);
        setError('Không thể phát nhạc');
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const value = {
    isPlaying,
    isLoading,
    volume,
    error,
    play,
    pause,
    togglePlay,
    changeVolume,
    reload: loadTrack
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};