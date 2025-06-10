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
import { FaSignOutAlt, FaUser, FaBook, FaStar, FaBookOpen, FaChartLine, FaCog } from "react-icons/fa";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserSettingsModal from './UserSettingsModal';
import AudioControls from './AudioControls';
import useAuthStore from '../store/authStore';
import useStudentProfileStore from '../store/studentProfileStore';
import flameoLogo from '../assets/FlameoLogo.png';

const Navbar = () => {
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { profile } = useStudentProfileStore();

  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarBg = useColorModeValue("gray.200", "gray.600");
  const avatarColor = useColorModeValue("black", "white");
  const menuBg = useColorModeValue("white", "gray.800");

  const isAdmin = () => user?.role === 'Admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const baseNavLinks = [
    { to: "/review", label: "Ôn tập", icon: FaBookOpen },
    { to: "/learn", label: "Học từ mới", icon: FaStar },
    { to: "/notebook", label: "Sổ tay", icon: FaBook },
    { to: "/progress", label: "Tiến độ", icon: FaChartLine }
  ];

  const navLinks = isAdmin() 
    ? [...baseNavLinks, { to: "/admin", label: "Quản trị", icon: FaCog }]
    : baseNavLinks;

  const displayName = user?.display_name || profile?.full_name || user?.email || 'Flameos';
  const profilePicture = profile?.profile_picture;

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
          <Link to="/review">
            <Image src={flameoLogo} alt="Flameo" h="50px" />
          </Link>
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
                isAdmin={link.to === "/admin"}
              />
            ))}
          </Flex>
          <HStack spacing={2}>
            <AudioControls />
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
                    name={displayName}
                    src={profilePicture}
                    bg={avatarBg}
                    color={avatarColor}
                  />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {displayName}
                  </Text>
                </Flex>
              </MenuButton>
              <MenuList bg={menuBg} borderColor={borderColor}>
                <Text px={3} py={1} fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                  Xin chào, {displayName}
                  {isAdmin() && (
                    <Text as="span" color={useColorModeValue("red.400", "orange.300")} fontWeight="bold" ml={2}>
                      (Admin)
                    </Text>
                  )}
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
              <Icon 
                as={link.icon} 
                boxSize="20px" 
                color={
                  isActive(link.to) 
                    ? link.to === "/admin" 
                      ? useColorModeValue("red.500", "orange.300")
                      : "flameo.500"
                    : "inherit"
                } 
              />
              <Text 
                fontSize="xs"
                color={
                  link.to === "/admin" && isActive(link.to) 
                    ? useColorModeValue("red.500", "orange.300")
                    : "inherit"
                }
              >
                {link.label}
              </Text>
            </VStack>
          </Link>
        ))}
      </Box>
      <UserSettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />
    </>
  );
};

const NavButton = ({ to, label, isActive, icon, isAdmin = false }) => {
  const bgActive = useColorModeValue(
    isAdmin ? "red.100" : "blue.50", 
    isAdmin ? "orange.900" : "blue.900"
  );
  const bgHover = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue(
    isActive ? (isAdmin ? "red.500" : "flameo.500") : "inherit",
    isActive ? (isAdmin ? "orange.300" : "flameo.500") : "inherit"
  );
  const dotColor = useColorModeValue("red.500", "orange.400");
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
        color={textColor}
        fontWeight={isActive ? "bold" : "medium"}
        _hover={{ bg: isActive ? bgActive : bgHover }}
        transition="all 0.2s"
        position="relative"
      >
        {icon && <Icon as={IconComponent} mb={1} boxSize="18px" />}
        <Text>{label}</Text>
        {isAdmin && (
          <Box
            position="absolute"
            top="0"
            right="0"
            w="8px"
            h="8px"
            bg={dotColor}
            borderRadius="full"
          />
        )}
      </Flex>
    </Link>
  );
};

export default Navbar;