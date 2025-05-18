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
  Divider,
  VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaSignOutAlt, FaUser, FaBook, FaStar, FaBookOpen, FaChartLine } from "react-icons/fa";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserSettingsModal from './UserSettingsModal';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/FlameoLogo.png';

const Navbar = () => {
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarBg = useColorModeValue("gray.200", "gray.600");
  const avatarColor = useColorModeValue("black", "white");
  const menuBg = useColorModeValue("white", "gray.800");

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { to: "/review", label: "Ôn tập", icon: FaBookOpen },
    { to: "/learn", label: "Học từ mới", icon: FaStar },
    { to: "/notebook", label: "Sổ tay", icon: FaBook },
    { to: "/progress", label: "Tiến độ", icon: FaChartLine }
  ];

  return (
    <>
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
          {/* Logo */}
          <Link to="/review">
            <Image src={flameoLogo} alt="Flameo" h="50px" />
          </Link>

          {/* Desktop Navigation */}
          <Flex
            gap={6}
            justify="center"
            flex={1}
            display={{ base: "none", md: "flex" }}
          >
            {navLinks.map((link) => (
              <NavButton
                key={link.to}
                to={link.to}
                label={link.label}
                isActive={isActive(link.to)}
                icon={link.icon}
              />
            ))}
          </Flex>

          {/* Dark Mode + Avatar */}
          <HStack spacing={2}>
            <IconButton
              aria-label="Đổi giao diện"
              icon={colorMode === 'light' ? <IoMoon /> : <LuSun />}
              onClick={toggleColorMode}
              variant="ghost"
            />

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
                    bg={avatarBg}
                    color={avatarColor}
                  />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {user?.display_name || 'Flameos'}
                  </Text>
                </Flex>
              </MenuButton>
              <MenuList bg={menuBg} borderColor={borderColor}>
                <Text px={3} py={1} fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                  Xin chào, {user?.display_name || user?.email || "Học viên"}
                </Text>
                <Divider my={1} />
                <MenuItem icon={<FaUser />} onClick={onSettingsOpen}>
                  Cài đặt tài khoản
                </MenuItem>
                <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                  Đăng xuất
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Bottom navigation bar for mobile */}
      <Box
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom={0}
        width="100%"
        bg={bg}
        borderTop="1px solid"
        borderColor={borderColor}
        justifyContent="space-around"
        py={2}
        zIndex={99}
      >
        {navLinks.map((link) => (
          <Link to={link.to} key={link.to}>
            <VStack
              spacing={0.5}
              align="center"
              opacity={isActive(link.to) ? 1 : 0.6}
              _hover={{ opacity: 1 }}
              cursor="pointer"
            >
              <Icon as={link.icon} boxSize="20px" color={isActive(link.to) ? "flameo.500" : "inherit"} />
              <Text fontSize="xs">{link.label}</Text>
            </VStack>
          </Link>
        ))}
      </Box>

      {/* Modal cài đặt tài khoản */}
      <UserSettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />
    </>
  );
};

const NavButton = ({ to, label, isActive, icon }) => {
  const bgActive = useColorModeValue("blue.50", "blue.900");
  const bgHover = useColorModeValue("gray.100", "gray.700");
  const IconComponent = icon;

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
        {icon && <Icon as={IconComponent} mb={1} boxSize="18px" />}
        <Text>{label}</Text>
      </Flex>
    </Link>
  );
};

export default Navbar;
