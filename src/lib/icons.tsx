import React from 'react'
import type { LucideProps } from 'lucide-react'
import {
  // Core / original
  Download, Upload, Globe, Star, Zap, Gift, Trophy, Gamepad,
  Monitor, Smartphone, Play, Tv, ShoppingCart, CreditCard,
  DollarSign, Wallet, Lock, ArrowRight,
  ExternalLink, Link, FileText, Film, Music, Headphones, Mic,
  Camera, Image, Video, Search, Package, Box, Layers, LayoutGrid,
  Tag, Bookmark, Heart, ThumbsUp, Users, User, Shield, Key,
  Settings, Wrench, Code, Terminal, Cpu, Database, Server, Cloud,
  Wifi, Bluetooth, Battery, Power, Flag, Map, Navigation, Target,
  Award, Crown, Flame, Rocket, Sparkles, Lightbulb, Eye, Clock,
  Calendar, Bell, Mail, MessageSquare, Share2, RefreshCw, RotateCcw,
  Shuffle, TrendingUp, Euro, Coins, Medal,
  // Navigation & Arrows
  ArrowLeft, ArrowUp, ArrowDown, ArrowLeftRight, ArrowUpDown, ArrowUpRight,
  ArrowDownLeft, ArrowDownRight, ChevronsUp, ChevronsDown, ChevronsLeft,
  ChevronsRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoveUp, MoveDown, MoveLeft, MoveRight, Move, CornerUpRight, CornerDownRight,
  CircleArrowRight, CircleArrowLeft, CircleArrowUp, CircleArrowDown,
  // Media & Entertainment
  Pause, SkipForward, SkipBack, FastForward, Rewind,
  Volume, Volume1, Volume2, VolumeX, Radio, Podcast,
  Clapperboard, Projector, Captions, ListMusic,
  VideoOff, MicOff, Speaker, AudioLines, SquarePlay,
  // Gaming & Fun
  Gamepad2, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  Puzzle, Swords, Joystick, Ghost, Skull, Wand, Lasso,
  CircleDot, Crosshair, Dices,
  // Tech & Devices
  Laptop, Tablet, TabletSmartphone, Watch, Printer,
  Mouse, Keyboard, HardDrive, HardDriveDownload, HardDriveUpload,
  MemoryStick, Usb, MonitorSmartphone, MonitorDot, MonitorPlay,
  TvMinimal, Cast, AirVent, Router, Network, Cable, Plug, PlugZap, Glasses,
  // Files & Data
  File, FilePlus, FileMinus, FileCheck, FileX, FileCode, FileImage,
  FileArchive, FileSpreadsheet, FolderOpen,
  Folder, FolderPlus, FolderMinus, FolderCheck, Archive, ArchiveRestore,
  ClipboardList, ClipboardCheck, Clipboard, ScrollText, NotepadText,
  BookOpen, Book, BookMarked, Newspaper, Receipt,
  // Commerce & Money
  BadgeDollarSign, Banknote, PiggyBank, HandCoins, CircleDollarSign,
  Store, ShoppingBag, ShoppingBasket, Percent, TrendingDown,
  ChartBar, ChartLine, ChartPie, ChartArea,
  // People & Social
  UserPlus, UserMinus, UserCheck, UserX, UserCog, UsersRound,
  PersonStanding, Contact, Handshake, ThumbsDown, MessageCircle,
  MessagesSquare, Send, SendHorizontal, AtSign, Hash, Rss,
  // Security & Access
  ShieldCheck, ShieldAlert, ShieldOff, ShieldPlus, LockOpen, LockKeyhole,
  ScanFace, Scan, QrCode, Barcode, BadgeCheck, BadgeAlert,
  CircleCheck, CircleX, CircleAlert, Info, TriangleAlert,
  OctagonAlert, Ban, OctagonX,
  // Nature & Misc
  Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Umbrella,
  Leaf, TreePine, Flower, Flower2, Apple, Cherry, Grape, Pizza, Coffee,
  Beer, Utensils, Car, Bike, Plane, Ship, Truck, Bus,
  House, Building, Building2, Hotel, Hospital, GraduationCap, Backpack,
  // Status & UI
  Loader, LoaderCircle, Ellipsis, EllipsisVertical, Menu, X, Plus, Minus,
  Check, Equal, Slash, CirclePlus, CircleMinus, SquarePlus, SquareMinus,
  SquareCheck, Square, Circle, Triangle, Diamond, Hexagon, Octagon,
  ToggleLeft, ToggleRight, SlidersHorizontal, SlidersVertical, ListFilter,
  ArrowUpAZ, ArrowDownAZ, List, ListOrdered, Grid2x2, Grid3x3,
  Columns2, Columns3, Rows2, Rows3, Maximize, Minimize,
  Expand, Shrink, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // Core / original
  Download, Upload, Globe, Star, Zap, Gift, Trophy, Gamepad,
  Monitor, Smartphone, Play, Tv, ShoppingCart, CreditCard,
  DollarSign, Wallet, Lock, ArrowRight,
  ExternalLink, Link, FileText, Film, Music, Headphones, Mic,
  Camera, Image, Video, Search, Package, Box, Layers, LayoutGrid,
  Tag, Bookmark, Heart, ThumbsUp, Users, User, Shield, Key,
  Settings, Wrench, Code, Terminal, Cpu, Database, Server, Cloud,
  Wifi, Bluetooth, Battery, Power, Flag, Map, Navigation, Target,
  Award, Crown, Flame, Rocket, Sparkles, Lightbulb, Eye, Clock,
  Calendar, Bell, Mail, MessageSquare, Share2, RefreshCw, RotateCcw,
  Shuffle, TrendingUp, Euro, Coins, Medal,
  // Navigation & Arrows
  ArrowLeft, ArrowUp, ArrowDown, ArrowLeftRight, ArrowUpDown, ArrowUpRight,
  ArrowDownLeft, ArrowDownRight, ChevronsUp, ChevronsDown, ChevronsLeft,
  ChevronsRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoveUp, MoveDown, MoveLeft, MoveRight, Move, CornerUpRight, CornerDownRight,
  CircleArrowRight, CircleArrowLeft, CircleArrowUp, CircleArrowDown,
  // Media & Entertainment
  Pause, SkipForward, SkipBack, FastForward, Rewind,
  Volume, Volume1, Volume2, VolumeX, Radio, Podcast,
  Clapperboard, Projector, Captions, ListMusic,
  VideoOff, MicOff, Speaker, AudioLines, SquarePlay,
  // Gaming & Fun
  Gamepad2, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  Puzzle, Swords, Joystick, Ghost, Skull, Wand, Lasso,
  CircleDot, Crosshair, Dices,
  // Tech & Devices
  Laptop, Tablet, TabletSmartphone, Watch, Printer,
  Mouse, Keyboard, HardDrive, HardDriveDownload, HardDriveUpload,
  MemoryStick, Usb, MonitorSmartphone, MonitorDot, MonitorPlay,
  TvMinimal, Cast, AirVent, Router, Network, Cable, Plug, PlugZap, Glasses,
  // Files & Data
  File, FilePlus, FileMinus, FileCheck, FileX, FileCode, FileImage,
  FileArchive, FileSpreadsheet, FolderOpen,
  Folder, FolderPlus, FolderMinus, FolderCheck, Archive, ArchiveRestore,
  ClipboardList, ClipboardCheck, Clipboard, ScrollText, NotepadText,
  BookOpen, Book, BookMarked, Newspaper, Receipt,
  // Commerce & Money
  BadgeDollarSign, Banknote, PiggyBank, HandCoins, CircleDollarSign,
  Store, ShoppingBag, ShoppingBasket, Percent, TrendingDown,
  ChartBar, ChartLine, ChartPie, ChartArea,
  // People & Social
  UserPlus, UserMinus, UserCheck, UserX, UserCog, UsersRound,
  PersonStanding, Contact, Handshake, ThumbsDown, MessageCircle,
  MessagesSquare, Send, SendHorizontal, AtSign, Hash, Rss,
  // Security & Access
  ShieldCheck, ShieldAlert, ShieldOff, ShieldPlus, LockOpen, LockKeyhole,
  ScanFace, Scan, QrCode, Barcode, BadgeCheck, BadgeAlert,
  CircleCheck, CircleX, CircleAlert, Info, TriangleAlert,
  OctagonAlert, Ban, OctagonX,
  // Nature & Misc
  Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Umbrella,
  Leaf, TreePine, Flower, Flower2, Apple, Cherry, Grape, Pizza, Coffee,
  Beer, Utensils, Car, Bike, Plane, Ship, Truck, Bus,
  House, Building, Building2, Hotel, Hospital, GraduationCap, Backpack,
  // Status & UI
  Loader, LoaderCircle, Ellipsis, EllipsisVertical, Menu, X, Plus, Minus,
  Check, Equal, Slash, CirclePlus, CircleMinus, SquarePlus, SquareMinus,
  SquareCheck, Square, Circle, Triangle, Diamond, Hexagon, Octagon,
  ToggleLeft, ToggleRight, SlidersHorizontal, SlidersVertical, ListFilter,
  ArrowUpAZ, ArrowDownAZ, List, ListOrdered, Grid2x2, Grid3x3,
  Columns2, Columns3, Rows2, Rows3, Maximize, Minimize,
  Expand, Shrink, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical,
}

export const ICON_NAMES: string[] = Object.keys(ICON_MAP)

export function renderIcon(
  name: string | null,
  fallback: string,
  props?: LucideProps
): React.ReactElement | null {
  const resolved = name && ICON_MAP[name] ? name : fallback
  const Icon = ICON_MAP[resolved]
  if (!Icon) return null
  return React.createElement(Icon, props ?? {})
}
