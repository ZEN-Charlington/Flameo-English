// src/components/ReviewChart.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../api/axiosClient';

const ReviewChart = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const chartRef = useRef(null);

  const barColor = useColorModeValue('#3182CE', '#63B3ED'); // blue.500 / blue.300
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Tạo fetchLearningStats thành một hàm useCallback để có thể gọi lại khi cần
  const fetchLearningStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Thêm timestamp để tránh cache khi refresh data
      const timestamp = new Date().getTime();
      
      // Gọi API để lấy thống kê từ vựng đã học theo ngày
      const response = await axiosClient.get(`/learning-stats?_t=${timestamp}`);
      
      if (response.status === 200 && response.data) {
        // Chỉ tiếp tục cập nhật nếu có dữ liệu và component vẫn mounted
        let statsData = response.data;
        
        // Chỉ hiển thị tối đa 7 ngày gần nhất
        const recentData = statsData.slice(-7);
        
        setChartData(recentData);
      }
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      setError(error.message || 'Không thể tải thống kê học tập');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Lấy dữ liệu ban đầu
    fetchLearningStats();
    
    // Xóa interval cũ nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Cleanup khi component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchLearningStats]);
  
  // Hàm format ngày
  const formatDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  // Render custom label trên đầu mỗi cột
  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill={barColor} 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };
  
  // Hàm thủ công để refresh dữ liệu
  const refreshData = () => {
    fetchLearningStats();
  };
  
  return (
    <Box 
      p={4} 
      bg={bgColor}
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      boxShadow="md"
      height="300px"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      // Ngăn hiệu ứng hover làm thay đổi background
      css={{
        '&:hover': {
          backgroundColor: useColorModeValue('white', 'var(--chakra-colors-gray-800)'),
        }
      }}
      // Gắn refreshData vào ref để có thể gọi từ bên ngoài
      ref={(node) => {
        chartRef.current = node;
        if (node) {
          node.refreshData = refreshData;
        }
      }}
    >
      <Heading size="md" mb={4}>Thống kê từ vựng học theo ngày</Heading>
      
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Text>Đang tải dữ liệu...</Text>
        </Flex>
      ) : error ? (
        <Flex justify="center" align="center" h="200px">
          <Text color="red.500">Lỗi: {error}</Text>
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Bar 
              dataKey="count" 
              name="Đã học" 
              fill={barColor} 
              radius={[4, 4, 0, 0]} 
              barSize={30} // Thu hẹp độ rộng của các cột
              label={renderCustomizedLabel} // Hiển thị số trên đầu cột
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default ReviewChart;