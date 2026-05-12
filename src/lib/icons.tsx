import React from 'react'
import type { LucideProps } from 'lucide-react'
import {
  Download, Upload, Globe, Star, Zap, Gift, Trophy, Gamepad,
  Monitor, Smartphone, Play, Tv, ShoppingCart, CreditCard,
  DollarSign, Wallet, Lock, Unlock, CheckCircle, ArrowRight,
  ExternalLink, Link, FileText, Film, Music, Headphones, Mic,
  Camera, Image, Video, Search, Package, Box, Layers, LayoutGrid,
  Tag, Bookmark, Heart, ThumbsUp, Users, User, Shield, Key,
  Settings, Wrench, Code, Terminal, Cpu, Database, Server, Cloud,
  Wifi, Bluetooth, Battery, Power, Flag, Map, Navigation, Target,
  Award, Crown, Flame, Rocket, Sparkles, Lightbulb, Eye, Clock,
  Calendar, Bell, Mail, MessageSquare, Share2, RefreshCw, RotateCcw,
  Shuffle, TrendingUp, Euro, Coins, Medal,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Download, Upload, Globe, Star, Zap, Gift, Trophy, Gamepad,
  Monitor, Smartphone, Play, Tv, ShoppingCart, CreditCard,
  DollarSign, Wallet, Lock, Unlock, CheckCircle, ArrowRight,
  ExternalLink, Link, FileText, Film, Music, Headphones, Mic,
  Camera, Image, Video, Search, Package, Box, Layers, LayoutGrid,
  Tag, Bookmark, Heart, ThumbsUp, Users, User, Shield, Key,
  Settings, Wrench, Code, Terminal, Cpu, Database, Server, Cloud,
  Wifi, Bluetooth, Battery, Power, Flag, Map, Navigation, Target,
  Award, Crown, Flame, Rocket, Sparkles, Lightbulb, Eye, Clock,
  Calendar, Bell, Mail, MessageSquare, Share2, RefreshCw, RotateCcw,
  Shuffle, TrendingUp, Euro, Coins, Medal,
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
