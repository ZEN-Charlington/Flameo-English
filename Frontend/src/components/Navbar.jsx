import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  Image,
  Icon,
  Divider
} from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserSettingsModal from './UserSettingsModal';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/FlameoLogo.png';

const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Kiểm tra route nào đang active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <Box 
      position="fixed" 
      top={0} 
      width="100%" 
      zIndex={100}
      bg={bg} 
      boxShadow="sm"
      borderBottom="1px"
      borderColor={borderColor}
      py={2}
      px={6}
    >
      <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
        {/* Logo bên trái */}
        <Link to="/review">
          <Image src={flameoLogo} alt="Flameo" h="50px" />
        </Link>
        
        {/* Menu điều hướng chính */}
        <Flex gap={6} justify="center" flex={1}>
          <NavButton 
            to="/review" 
            label="Ôn tập" 
            isActive={isActive('/review')} 
          />
          <NavButton 
            to="/learn" 
            label="Học từ mới" 
            isActive={isActive('/learn')} 
          />
          <NavButton 
            to="/notebook" 
            label="Sổ tay" 
            isActive={isActive('/notebook')} 
          />
          <NavButton 
            to="/progress" 
            label="Tiến độ" 
            isActive={isActive('/progress')} 
          />
        </Flex>
        
        {/* Nút chuyển màu sắc và avatar người dùng */}
        <HStack spacing={2}>
          <IconButton
            aria-label="Đổi giao diện"
            icon={colorMode === 'light' ? <IoMoon /> : <LuSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          
          {/* Menu người dùng */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<ChevronDownIcon />}
            >
              <Flex align="center" gap={2}>
                <Avatar 
                  size="sm" 
                  name={user?.display_name} 
                  src={user?.profile?.profile_picture} 
                  bg="flameo.500"
                />
                <Text display={{ base: 'none', md: 'block' }}>
                  {user?.display_name || 'Flameos'}
                </Text>
              </Flex>
            </MenuButton>
            <MenuList>
              <Text px={3} py={1} fontSize="sm" color="gray.500">
                Xin chào, {user?.display_name || user?.email || "Học viên"}
              </Text>
              <Divider my={1} />
              <MenuItem icon={<FaUser />} onClick={onOpen}>
                Cài đặt tài khoản
              </MenuItem>
              <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                Đăng xuất
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* Modal cài đặt tài khoản */}
      <UserSettingsModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

// Component nút điều hướng
const NavButton = ({ to, label, isActive }) => {
  const bgActive = useColorModeValue("blue.50", "blue.900");
  const bgHover = useColorModeValue("gray.100", "gray.700");
  
  return (
    <Link to={to}>
      <Flex 
        direction="column" 
        align="center" 
        p={2}
        px={4}
        borderRadius="md"
        bg={isActive ? bgActive : "transparent"}
        color={isActive ? "flameo.500" : "inherit"}
        fontWeight={isActive ? "bold" : "medium"}
        _hover={{ bg: isActive ? bgActive : bgHover }}
        transition="all 0.2s"
      >
        <Text>{label}</Text>
      </Flex>
    </Link>
  );
};

export default Navbar;