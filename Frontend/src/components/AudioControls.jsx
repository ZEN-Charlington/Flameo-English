// src/components/AudioControls.jsx
import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  Text,
  Spinner,
  Box,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlay, FaPause, FaVolumeUp, FaExclamationTriangle } from 'react-icons/fa';
import { useAudio } from '../utils/AudioProvider';

const AudioControls = () => {
  const { 
    isPlaying, 
    isLoading, 
    volume, 
    error, 
    togglePlay, 
    changeVolume, 
    reload 
  } = useAudio();

  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  
  const volumeIconColor = useColorModeValue('gray.600', 'gray.300');
  const popoverBg = useColorModeValue('white', 'gray.800');

  const handleVolumeChange = (value) => {
    changeVolume(value / 100);
  };

  if (error) {
    return (
      <Tooltip label={`Lỗi audio: ${error}`} hasArrow>
        <IconButton
          aria-label="Lỗi audio"
          icon={<FaExclamationTriangle />}
          variant="ghost"
          size="sm"
          colorScheme="red"
          onClick={reload}
        />
      </Tooltip>
    );
  }

  if (isLoading) {
    return (
      <Tooltip label="Đang tải nhạc..." hasArrow>
        <Box>
          <Spinner size="sm" />
        </Box>
      </Tooltip>
    );
  }

  return (
    <>
      {/* Play/Pause Button */}
      <Tooltip label={isPlaying ? "Tạm dừng nhạc nền" : "Phát nhạc nền"} hasArrow>
        <IconButton
          aria-label={isPlaying ? "Pause" : "Play"}
          icon={isPlaying ? <FaPause /> : <FaPlay />}
          onClick={togglePlay}
          variant="ghost"
          size="sm"
        />
      </Tooltip>

      {/* Volume Control */}
      <Popover 
        isOpen={isVolumeOpen} 
        onClose={() => setIsVolumeOpen(false)}
        placement="bottom"
      >
        <PopoverTrigger>
          <IconButton
            aria-label="Điều chỉnh âm lượng"
            icon={<FaVolumeUp />}
            onClick={() => setIsVolumeOpen(!isVolumeOpen)}
            variant="ghost"
            size="sm"
            color={volumeIconColor}
          />
        </PopoverTrigger>
        <PopoverContent w="180px" bg={popoverBg}>
          <PopoverBody>
            <VStack spacing={3}>
              <Text fontSize="sm" fontWeight="medium">
                Âm lượng
              </Text>
              <Slider
                value={volume * 100}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                step={5}
                colorScheme="blue"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text fontSize="xs" color="gray.500">
                {Math.round(volume * 100)}%
              </Text>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default AudioControls;