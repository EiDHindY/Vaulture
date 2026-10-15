import React from 'react';
import {
  SiGoogle, SiGoogleHex,
  SiGmail, SiGmailHex,
  SiFacebook, SiFacebookHex,
  SiX,
  SiInstagram, SiInstagramHex,
  SiGithub,
  SiGitlab, SiGitlabHex,
  SiDiscord, SiDiscordHex,
  SiSpotify, SiSpotifyHex,
  SiNetflix, SiNetflixHex,
  SiSteam,
  SiPaypal, SiPaypalHex,
  SiReddit, SiRedditHex,
  SiWhatsapp, SiWhatsappHex,
  SiTelegram, SiTelegramHex,
  SiTwitch, SiTwitchHex,
  SiProton, SiProtonHex,
  SiBitwarden, SiBitwardenHex,
  Si1password, Si1passwordHex,
  SiLastpass, SiLastpassHex,
  SiKeepassxc, SiKeepassxcHex,
  SiDropbox, SiDropboxHex,
  SiNotion,
  SiFigma, SiFigmaHex,
  SiDocker, SiDockerHex,
  SiCloudflare, SiCloudflareHex,
  SiClaude,
  SiHuggingface,
  SiSignal, SiSignalHex,
  SiMessenger, SiMessengerHex,
  SiSnapchat, SiSnapchatHex,
  SiPinterest, SiPinterestHex,
  SiEpicgames,
  SiRiotgames, SiRiotgamesHex,
  SiBattledotnet, SiBattledotnetHex,
  SiRoblox,
  SiSoundcloud, SiSoundcloudHex,
  SiEbay, SiEbayHex,
  SiCoinbase, SiCoinbaseHex,
  SiBinance, SiBinanceHex,
  SiWise, SiWiseHex,
  SiRevolut,
  SiShopify, SiShopifyHex,
  SiUber,
  SiAirbnb, SiAirbnbHex,
  SiZoom, SiZoomHex,
  SiMega, SiMegaHex,
  SiAtlassian, SiAtlassianHex,
  SiJira, SiJiraHex,
  SiTrello, SiTrelloHex,
} from '@icons-pack/react-simple-icons';

import {
  FaMicrosoft,
  FaApple,
  FaAmazon,
  FaYoutube,
  FaLinkedin,
  FaTiktok,
  FaSlack,
  FaPlaystation,
  FaXbox,
  FaStripe,
  FaBitcoin,
  FaEthereum,
  FaCcVisa,
  FaCcMastercard,
  FaYahoo
} from 'react-icons/fa6';

import {
  Key,
  Globe,
  Folder,
  ShieldCheck,
  Terminal,
  Database,
  Server,
  Mail,
  Lock,
  User,
  Briefcase,
  CreditCard,
  Cloud,
  ShoppingBag,
  Gamepad2,
  Music,
  Video,
  Bookmark,
  Star,
  Heart,
  Archive,
  Code,
  Smartphone,
  Laptop,
  Wifi,
  HardDrive,
  Cpu,
  Bot,
  Hash,
  FileText
} from 'lucide-react';

export type IconCategory = 'popular' | 'tech' | 'social' | 'entertainment' | 'finance' | 'system';

export interface IconDefinition {
  id: string;
  name: string;
  category: IconCategory;
  color: string;
  keywords: string[];
  component: React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
}

export const ICON_REGISTRY: IconDefinition[] = [
  // --- POPULAR BRANDS ---
  {
    id: 'google',
    name: 'Google',
    category: 'popular',
    color: SiGoogleHex,
    keywords: ['google', 'search', 'drive', 'alphabet'],
    component: SiGoogle,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'popular',
    color: SiGmailHex,
    keywords: ['gmail', 'google', 'email', 'mail', 'inbox'],
    component: SiGmail,
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    category: 'popular',
    color: '#00A4EF',
    keywords: ['microsoft', 'windows', 'office', '365', 'outlook', 'azure'],
    component: FaMicrosoft,
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'popular',
    color: '#E5E7EB',
    keywords: ['apple', 'icloud', 'ios', 'mac', 'appstore'],
    component: FaApple,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'popular',
    color: '#FF9900',
    keywords: ['amazon', 'shopping', 'prime', 'aws'],
    component: FaAmazon,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'popular',
    color: '#F0F6FC',
    keywords: ['github', 'git', 'code', 'repository', 'developer'],
    component: SiGithub,
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'popular',
    color: SiDiscordHex,
    keywords: ['discord', 'chat', 'gaming', 'voice', 'community'],
    component: SiDiscord,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'popular',
    color: SiSpotifyHex,
    keywords: ['spotify', 'music', 'streaming', 'audio', 'podcast'],
    component: SiSpotify,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'popular',
    color: SiNetflixHex,
    keywords: ['netflix', 'movies', 'series', 'streaming', 'video'],
    component: SiNetflix,
  },
  {
    id: 'steam',
    name: 'Steam',
    category: 'popular',
    color: '#66C0F4',
    keywords: ['steam', 'valve', 'gaming', 'games', 'store'],
    component: SiSteam,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'popular',
    color: SiPaypalHex,
    keywords: ['paypal', 'payment', 'money', 'banking', 'checkout'],
    component: SiPaypal,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'popular',
    color: '#FF0000',
    keywords: ['youtube', 'video', 'google', 'streaming', 'creator'],
    component: FaYoutube,
  },

  // --- TECH & PRODUCTIVITY ---
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'tech',
    color: SiGitlabHex,
    keywords: ['gitlab', 'git', 'code', 'devops'],
    component: SiGitlab,
  },
  {
    id: 'proton',
    name: 'Proton',
    category: 'tech',
    color: SiProtonHex,
    keywords: ['proton', 'protonmail', 'vpn', 'email', 'privacy'],
    component: SiProton,
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    category: 'tech',
    color: SiBitwardenHex,
    keywords: ['bitwarden', 'vault', 'password', 'manager'],
    component: SiBitwarden,
  },
  {
    id: '1password',
    name: '1Password',
    category: 'tech',
    color: Si1passwordHex,
    keywords: ['1password', 'vault', 'password', 'manager'],
    component: Si1password,
  },
  {
    id: 'lastpass',
    name: 'LastPass',
    category: 'tech',
    color: SiLastpassHex,
    keywords: ['lastpass', 'password', 'vault'],
    component: SiLastpass,
  },
  {
    id: 'keepass',
    name: 'KeePass',
    category: 'tech',
    color: SiKeepassxcHex,
    keywords: ['keepass', 'keepassxc', 'password', 'database'],
    component: SiKeepassxc,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'tech',
    color: SiDropboxHex,
    keywords: ['dropbox', 'cloud', 'files', 'storage', 'backup'],
    component: SiDropbox,
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'tech',
    color: '#FFFFFF',
    keywords: ['notion', 'notes', 'workspace', 'wiki', 'docs'],
    component: SiNotion,
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'tech',
    color: SiFigmaHex,
    keywords: ['figma', 'design', 'ui', 'ux', 'vector'],
    component: SiFigma,
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'tech',
    color: SiDockerHex,
    keywords: ['docker', 'containers', 'devops', 'kubernetes'],
    component: SiDocker,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'tech',
    color: SiCloudflareHex,
    keywords: ['cloudflare', 'cdn', 'dns', 'security', 'domain'],
    component: SiCloudflare,
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'tech',
    color: '#ECB22E',
    keywords: ['slack', 'chat', 'workplace', 'messaging', 'team'],
    component: FaSlack,
  },
  {
    id: 'claude',
    name: 'Claude / Anthropic',
    category: 'tech',
    color: '#D97706',
    keywords: ['claude', 'anthropic', 'ai', 'assistant', 'llm'],
    component: SiClaude,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'tech',
    color: '#FFD21E',
    keywords: ['huggingface', 'ai', 'models', 'machine learning'],
    component: SiHuggingface,
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    category: 'tech',
    color: SiAtlassianHex,
    keywords: ['atlassian', 'jira', 'confluence'],
    component: SiAtlassian,
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'tech',
    color: SiJiraHex,
    keywords: ['jira', 'atlassian', 'tickets', 'scrum', 'agile'],
    component: SiJira,
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'tech',
    color: SiTrelloHex,
    keywords: ['trello', 'kanban', 'tasks', 'board'],
    component: SiTrello,
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'tech',
    color: SiZoomHex,
    keywords: ['zoom', 'meeting', 'video', 'calls', 'conference'],
    component: SiZoom,
  },
  {
    id: 'mega',
    name: 'MEGA',
    category: 'tech',
    color: SiMegaHex,
    keywords: ['mega', 'cloud', 'storage', 'encryption', 'nz'],
    component: SiMega,
  },

  // --- SOCIAL & COMMUNICATION ---
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    color: SiFacebookHex,
    keywords: ['facebook', 'meta', 'social', 'friends'],
    component: SiFacebook,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    category: 'social',
    color: '#F3F4F6',
    keywords: ['x', 'twitter', 'social', 'tweets'],
    component: SiX,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    color: SiInstagramHex,
    keywords: ['instagram', 'meta', 'photos', 'stories', 'reels'],
    component: SiInstagram,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'social',
    color: SiWhatsappHex,
    keywords: ['whatsapp', 'meta', 'chat', 'messaging', 'phone'],
    component: SiWhatsapp,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'social',
    color: SiTelegramHex,
    keywords: ['telegram', 'chat', 'messaging', 'channel'],
    component: SiTelegram,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'social',
    color: SiRedditHex,
    keywords: ['reddit', 'forum', 'community', 'posts', 'karma'],
    component: SiReddit,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    color: '#0A66C2',
    keywords: ['linkedin', 'career', 'jobs', 'networking', 'business'],
    component: FaLinkedin,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    color: '#FE2C55',
    keywords: ['tiktok', 'video', 'shortform', 'social'],
    component: FaTiktok,
  },
  {
    id: 'signal',
    name: 'Signal',
    category: 'social',
    color: SiSignalHex,
    keywords: ['signal', 'chat', 'messaging', 'privacy', 'encrypted'],
    component: SiSignal,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    category: 'social',
    color: SiMessengerHex,
    keywords: ['messenger', 'facebook', 'meta', 'chat'],
    component: SiMessenger,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    category: 'social',
    color: SiSnapchatHex,
    keywords: ['snapchat', 'snaps', 'social', 'camera'],
    component: SiSnapchat,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    color: SiPinterestHex,
    keywords: ['pinterest', 'pins', 'boards', 'images'],
    component: SiPinterest,
  },

  // --- ENTERTAINMENT & GAMING ---
  {
    id: 'playstation',
    name: 'PlayStation',
    category: 'entertainment',
    color: '#0070D1',
    keywords: ['playstation', 'sony', 'psn', 'ps4', 'ps5', 'gaming'],
    component: FaPlaystation,
  },
  {
    id: 'xbox',
    name: 'Xbox',
    category: 'entertainment',
    color: '#107C10',
    keywords: ['xbox', 'microsoft', 'gamepass', 'gaming', 'console'],
    component: FaXbox,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'entertainment',
    color: SiTwitchHex,
    keywords: ['twitch', 'stream', 'live', 'gaming', 'broadcast'],
    component: SiTwitch,
  },
  {
    id: 'epicgames',
    name: 'Epic Games',
    category: 'entertainment',
    color: '#FFFFFF',
    keywords: ['epicgames', 'epic', 'fortnite', 'unreal', 'store'],
    component: SiEpicgames,
  },
  {
    id: 'riotgames',
    name: 'Riot Games',
    category: 'entertainment',
    color: SiRiotgamesHex,
    keywords: ['riotgames', 'league of legends', 'valorant', 'tft'],
    component: SiRiotgames,
  },
  {
    id: 'battlenet',
    name: 'Battle.net',
    category: 'entertainment',
    color: SiBattledotnetHex,
    keywords: ['battlenet', 'blizzard', 'world of warcraft', 'overwatch', 'diablo'],
    component: SiBattledotnet,
  },
  {
    id: 'roblox',
    name: 'Roblox',
    category: 'entertainment',
    color: '#E2E8F0',
    keywords: ['roblox', 'gaming', 'metaverse', 'avatar'],
    component: SiRoblox,
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'entertainment',
    color: SiSoundcloudHex,
    keywords: ['soundcloud', 'music', 'audio', 'tracks', 'dj'],
    component: SiSoundcloud,
  },

  // --- FINANCE & SHOPPING ---
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'finance',
    color: '#635BFF',
    keywords: ['stripe', 'payments', 'billing', 'credit card'],
    component: FaStripe,
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    category: 'finance',
    color: SiCoinbaseHex,
    keywords: ['coinbase', 'crypto', 'bitcoin', 'wallet', 'exchange'],
    component: SiCoinbase,
  },
  {
    id: 'binance',
    name: 'Binance',
    category: 'finance',
    color: SiBinanceHex,
    keywords: ['binance', 'crypto', 'bitcoin', 'trading', 'exchange'],
    component: SiBinance,
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    category: 'finance',
    color: '#F7931A',
    keywords: ['bitcoin', 'btc', 'crypto', 'wallet'],
    component: FaBitcoin,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    category: 'finance',
    color: '#627EEA',
    keywords: ['ethereum', 'eth', 'crypto', 'web3', 'defi'],
    component: FaEthereum,
  },
  {
    id: 'wise',
    name: 'Wise',
    category: 'finance',
    color: SiWiseHex,
    keywords: ['wise', 'transferwise', 'money', 'banking', 'fx', 'currency'],
    component: SiWise,
  },
  {
    id: 'revolut',
    name: 'Revolut',
    category: 'finance',
    color: '#FFFFFF',
    keywords: ['revolut', 'bank', 'cards', 'finance', 'fintech'],
    component: SiRevolut,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'finance',
    color: SiShopifyHex,
    keywords: ['shopify', 'ecommerce', 'store', 'shop'],
    component: SiShopify,
  },
  {
    id: 'ebay',
    name: 'eBay',
    category: 'finance',
    color: SiEbayHex,
    keywords: ['ebay', 'auction', 'shopping', 'store', 'bidding'],
    component: SiEbay,
  },
  {
    id: 'visa',
    name: 'Visa',
    category: 'finance',
    color: '#1A1F71',
    keywords: ['visa', 'card', 'credit', 'payment'],
    component: FaCcVisa,
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    category: 'finance',
    color: '#EB001B',
    keywords: ['mastercard', 'card', 'credit', 'payment'],
    component: FaCcMastercard,
  },
  {
    id: 'uber',
    name: 'Uber',
    category: 'finance',
    color: '#FFFFFF',
    keywords: ['uber', 'rides', 'eats', 'travel', 'taxi'],
    component: SiUber,
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    category: 'finance',
    color: SiAirbnbHex,
    keywords: ['airbnb', 'hotel', 'travel', 'vacation', 'stay'],
    component: SiAirbnb,
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    category: 'finance',
    color: '#6001D2',
    keywords: ['yahoo', 'finance', 'mail', 'news'],
    component: FaYahoo,
  },

  // --- SYSTEM & GENERIC CATEGORY ---
  {
    id: 'key',
    name: 'Key',
    category: 'system',
    color: '#F59E0B',
    keywords: ['key', 'login', 'access', 'password', 'token'],
    component: Key,
  },
  {
    id: 'globe',
    name: 'Website',
    category: 'system',
    color: '#3B82F6',
    keywords: ['globe', 'web', 'internet', 'online', 'browser', 'url'],
    component: Globe,
  },
  {
    id: 'folder',
    name: 'Folder',
    category: 'system',
    color: '#60A5FA',
    keywords: ['folder', 'directory', 'group', 'collection'],
    component: Folder,
  },
  {
    id: 'shield',
    name: 'Shield',
    category: 'system',
    color: '#10B981',
    keywords: ['shield', 'security', 'protection', 'safe', 'verified'],
    component: ShieldCheck,
  },
  {
    id: 'lock',
    name: 'Lock',
    category: 'system',
    color: '#EAB308',
    keywords: ['lock', 'padlock', 'private', 'secure'],
    component: Lock,
  },
  {
    id: 'user',
    name: 'User Profile',
    category: 'system',
    color: '#8B5CF6',
    keywords: ['user', 'profile', 'account', 'personal', 'identity'],
    component: User,
  },
  {
    id: 'work',
    name: 'Work / Business',
    category: 'system',
    color: '#F97316',
    keywords: ['briefcase', 'work', 'office', 'job', 'business'],
    component: Briefcase,
  },
  {
    id: 'card',
    name: 'Credit Card',
    category: 'system',
    color: '#3B82F6',
    keywords: ['card', 'credit card', 'banking', 'payment', 'wallet'],
    component: CreditCard,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    category: 'system',
    color: '#A855F7',
    keywords: ['terminal', 'cli', 'console', 'bash', 'developer', 'code'],
    component: Terminal,
  },
  {
    id: 'database',
    name: 'Database',
    category: 'system',
    color: '#EC4899',
    keywords: ['database', 'sql', 'storage', 'data'],
    component: Database,
  },
  {
    id: 'server',
    name: 'Server',
    category: 'system',
    color: '#06B6D4',
    keywords: ['server', 'cloud', 'hosting', 'infrastructure'],
    component: Server,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    category: 'system',
    color: '#38BDF8',
    keywords: ['cloud', 'sync', 'online', 'drive'],
    component: Cloud,
  },
  {
    id: 'mail',
    name: 'Mail',
    category: 'system',
    color: '#F43F5E',
    keywords: ['mail', 'email', 'inbox', 'letter', 'messages'],
    component: Mail,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    category: 'system',
    color: '#F43F5E',
    keywords: ['bag', 'shopping', 'store', 'cart', 'buy'],
    component: ShoppingBag,
  },
  {
    id: 'gamepad',
    name: 'Gaming',
    category: 'system',
    color: '#A855F7',
    keywords: ['gamepad', 'controller', 'games', 'play'],
    component: Gamepad2,
  },
  {
    id: 'music',
    name: 'Music',
    category: 'system',
    color: '#EC4899',
    keywords: ['music', 'audio', 'sound', 'song'],
    component: Music,
  },
  {
    id: 'video',
    name: 'Video',
    category: 'system',
    color: '#EF4444',
    keywords: ['video', 'camera', 'film', 'movies'],
    component: Video,
  },
  {
    id: 'star',
    name: 'Favorite',
    category: 'system',
    color: '#EAB308',
    keywords: ['star', 'favorite', 'pinned', 'important'],
    component: Star,
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'system',
    color: '#EF4444',
    keywords: ['heart', 'love', 'personal', 'favorite'],
    component: Heart,
  },
  {
    id: 'bookmark',
    name: 'Bookmark',
    category: 'system',
    color: '#F59E0B',
    keywords: ['bookmark', 'save', 'reading', 'link'],
    component: Bookmark,
  },
  {
    id: 'archive',
    name: 'Archive',
    category: 'system',
    color: '#94A3B8',
    keywords: ['archive', 'box', 'history', 'stored'],
    component: Archive,
  },
  {
    id: 'code',
    name: 'Code',
    category: 'system',
    color: '#10B981',
    keywords: ['code', 'programming', 'script', 'tags'],
    component: Code,
  },
  {
    id: 'phone',
    name: 'Mobile Phone',
    category: 'system',
    color: '#38BDF8',
    keywords: ['phone', 'mobile', 'smartphone', 'android', 'ios'],
    component: Smartphone,
  },
  {
    id: 'laptop',
    name: 'Laptop / PC',
    category: 'system',
    color: '#A855F7',
    keywords: ['laptop', 'pc', 'computer', 'desktop', 'macbook'],
    component: Laptop,
  },
  {
    id: 'wifi',
    name: 'Wi-Fi / Network',
    category: 'system',
    color: '#10B981',
    keywords: ['wifi', 'network', 'router', 'internet', 'wireless'],
    component: Wifi,
  },
  {
    id: 'drive',
    name: 'Hard Drive',
    category: 'system',
    color: '#64748B',
    keywords: ['harddrive', 'disk', 'hardware', 'drive'],
    component: HardDrive,
  },
  {
    id: 'cpu',
    name: 'CPU / Hardware',
    category: 'system',
    color: '#F97316',
    keywords: ['cpu', 'processor', 'chip', 'hardware'],
    component: Cpu,
  },
  {
    id: 'bot',
    name: 'Bot / AI',
    category: 'system',
    color: '#10B981',
    keywords: ['bot', 'ai', 'robot', 'automation'],
    component: Bot,
  },
  {
    id: 'pin',
    name: 'PIN / Hash',
    category: 'system',
    color: '#A855F7',
    keywords: ['hash', 'pin', 'number', 'tag', 'code'],
    component: Hash,
  },
  {
    id: 'file',
    name: 'Document / File',
    category: 'system',
    color: '#60A5FA',
    keywords: ['file', 'document', 'text', 'note'],
    component: FileText,
  },
];

export function isCustomUploadedIcon(iconId?: string | null): boolean {
  if (!iconId) return false;
  return (
    iconId.startsWith('data:image/') ||
    iconId.startsWith('http://') ||
    iconId.startsWith('https://') ||
    iconId.startsWith('blob:')
  );
}

export function getIconDefinition(id?: string | null): IconDefinition | undefined {
  if (!id) return undefined;
  return ICON_REGISTRY.find(item => item.id.toLowerCase() === id.toLowerCase());
}

export interface VaultIconProps {
  iconId?: string | null;
  defaultType?: 'entry' | 'folder';
  url?: string;
  size?: number;
  className?: string;
}

export const VaultIcon: React.FC<VaultIconProps> = ({
  iconId,
  defaultType = 'entry',
  url,
  size = 18,
  className = ''
}) => {
  // If it is a custom uploaded image or URL
  if (isCustomUploadedIcon(iconId)) {
    return (
      <img
        src={iconId!}
        alt="icon"
        className={`object-contain rounded shrink-0 select-none pointer-events-none ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  const custom = getIconDefinition(iconId);
  if (custom) {
    const Comp = custom.component;
    return (
      <Comp
        size={size}
        color={custom.color}
        className={className}
        style={{ color: custom.color }}
      />
    );
  }

  // Fallback defaults:
  if (defaultType === 'folder') {
    return <Folder size={size} className={className} />;
  }

  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return <Globe size={size} className={className} />;
  }

  return <Key size={size} className={className} />;
};

