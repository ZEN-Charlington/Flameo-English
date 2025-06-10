import React, { useState, useRef, useCallback } from 'react';
import { Box, Button, Flex, Text, IconButton, Alert, AlertIcon, Progress, VStack, HStack, Link, Code, useToast, Badge } from '@chakra-ui/react';
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaUpload, FaExternalLinkAlt, FaCopy, FaCheckCircle } from 'react-icons/fa';
import useAdminStore from '../store/adminStore';

const AudioRecorder = ({ onAudioUploaded }) => {
  const { loading, uploadAudio } = useAdminStore();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(null);
  const [uploadedLocalPath, setUploadedLocalPath] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const toast = useToast();

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Đã sao chép!",
        description: "URL đã được sao chép vào clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Lỗi",
        description: "Không thể sao chép URL",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setUploadedAudioUrl(null);
      setUploadedLocalPath(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } 
      });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        stopTimer();
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
    } catch (err) {
      setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadedAudioUrl(null);
    setUploadedLocalPath(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setError(null);
  };

  const convertToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Lỗi đọc file audio'));
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      setError('Không có file audio để upload');
      return;
    }
    try {
      setError(null);
      setIsUploading(true);
      console.log('Bắt đầu upload audio...');
      const base64Data = await convertToBase64(audioBlob);
      console.log('Đã convert sang base64, length:', base64Data.length);
      const filename = `pronunciation_${Date.now()}.webm`;
      const result = await uploadAudio(base64Data, filename);
      console.log('Upload result:', result);
      
      if (result && result.audio_url) {
        const audioUrl = result.audio_url;
        const localPath = result.local_path || result.audio_url;
        
        console.log('Upload thành công, audio URL:', audioUrl);
        setUploadedAudioUrl(audioUrl);
        setUploadedLocalPath(localPath);
        
        if (onAudioUploaded && typeof onAudioUploaded === 'function') {
          onAudioUploaded(audioUrl);
        }
        
        // Clear recording after successful upload
        clearRecording();
        
        toast({
          title: "Upload thành công!",
          description: "File audio đã được upload và có thể truy cập công khai",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Không nhận được URL audio từ server');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Lỗi upload: ${err.message || 'Không xác định'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold">Ghi âm phát âm</Text>
        
        {error && (
          <Alert status="error" size="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {uploadedAudioUrl && (
          <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
            <VStack spacing={3} align="stretch">
              <HStack spacing={2}>
                <FaCheckCircle color="green" />
                <Text fontSize="sm" fontWeight="bold" color="green.600">
                  ✅ Upload thành công!
                </Text>
                <Badge colorScheme="green">Có thể truy cập công khai</Badge>
              </HStack>
              
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" fontWeight="medium">Public URL:</Text>
                <HStack spacing={2}>
                  <Code fontSize="xs" p={2} maxW="300px" isTruncated>
                    {uploadedAudioUrl}
                  </Code>
                  <IconButton
                    aria-label="Copy URL"
                    icon={<FaCopy />}
                    size="xs"
                    onClick={() => copyToClipboard(uploadedAudioUrl)}
                  />
                  <Link href={uploadedAudioUrl} isExternal>
                    <IconButton
                      aria-label="Open URL"
                      icon={<FaExternalLinkAlt />}
                      size="xs"
                      colorScheme="blue"
                    />
                  </Link>
                </HStack>
              </VStack>
              
              {uploadedLocalPath && uploadedLocalPath !== uploadedAudioUrl && (
                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" fontWeight="medium">Local Path (for development):</Text>
                  <HStack spacing={2}>
                    <Code fontSize="xs" p={2} maxW="300px" isTruncated>
                      {uploadedLocalPath}
                    </Code>
                    <IconButton
                      aria-label="Copy local path"
                      icon={<FaCopy />}
                      size="xs"
                      onClick={() => copyToClipboard(uploadedLocalPath)}
                    />
                  </HStack>
                </VStack>
              )}
              
              <HStack spacing={2}>
                <Button 
                  size="xs" 
                  onClick={() => new Audio(uploadedAudioUrl).play()} 
                  leftIcon={<FaPlay />}
                  colorScheme="green"
                >
                  Nghe thử
                </Button>
                <Button 
                  size="xs" 
                  onClick={clearRecording}
                  variant="outline"
                >
                  Đóng
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        <Flex justify="center">
          {!isRecording ? (
            <Button leftIcon={<FaMicrophone />} colorScheme="red" size="lg" onClick={startRecording}>
              Bắt đầu ghi âm
            </Button>
          ) : (
            <VStack spacing={2}>
              <Button leftIcon={<FaStop />} colorScheme="gray" size="lg" onClick={stopRecording}>
                Dừng ghi âm
              </Button>
              <Text color="red.500" fontWeight="bold">
                🔴 {formatTime(recordingTime)}
              </Text>
            </VStack>
          )}
        </Flex>
        
        {audioUrl && !uploadedAudioUrl && (
          <VStack spacing={3}>
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onEnded={() => setIsPlaying(false)} 
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  const duration = audioRef.current.duration;
                  if (duration && duration !== Infinity) {
                    setRecordingTime(Math.floor(duration));
                  }
                }
              }} 
            />
            <HStack spacing={2}>
              <IconButton 
                icon={isPlaying ? <FaPause /> : <FaPlay />} 
                onClick={isPlaying ? pauseAudio : playAudio} 
                colorScheme="blue" 
                size="sm" 
              />
              <Text fontSize="sm">Thời lượng: {formatTime(recordingTime)}</Text>
              <IconButton 
                icon={<FaTrash />} 
                onClick={clearRecording} 
                colorScheme="red" 
                variant="ghost" 
                size="sm" 
              />
            </HStack>
            <Button 
              leftIcon={<FaUpload />} 
              colorScheme="green" 
              onClick={handleUpload} 
              isLoading={isUploading || loading.uploading} 
              loadingText="Đang upload..." 
              size="sm" 
              disabled={!audioBlob}
            >
              Upload âm thanh
            </Button>
          </VStack>
        )}
        
        {(isUploading || loading.uploading) && (
          <Progress size="sm" isIndeterminate colorScheme="green" />
        )}
      </VStack>
    </Box>
  );
};

export default AudioRecorder;