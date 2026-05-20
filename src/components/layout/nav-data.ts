import {
  Home,
  BookOpen,
  BarChart3,
  Settings,
  QrCode,
  User,
  CreditCard,
  Palette,
  MessageSquare,
  Gift,
  type LucideIcon,
} from 'lucide-react';

export type NavSubItem = {
  title: string;
  url: string;
};

export type NavItem = {
  title: string;
  icon: LucideIcon;
  url?: string;
  proOnly?: boolean;
  items?: NavSubItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_DATA: NavSection[] = [
  {
    label: 'Operación',
    items: [
      { title: 'Inicio', icon: Home, url: '/dashboard' },
      { title: 'Menú', icon: BookOpen, url: '/menu' },
      { title: 'Stats', icon: BarChart3, url: '/analytics', proOnly: true },
      { title: 'QR', icon: QrCode, url: '/qr' },
    ],
  },
  {
    label: 'Configuración',
    items: [
      {
        title: 'Ajustes',
        icon: Settings,
        items: [
          { title: 'General', url: '/settings' },
          { title: 'Marca', url: '/settings/brand' },
          { title: 'Facturación', url: '/settings/billing' },
          { title: 'Referidos', url: '/settings/referrals' },
          { title: 'Contacto', url: '/settings/contact' },
        ],
      },
      { title: 'Cuenta', icon: User, url: '/account' },
    ],
  },
];

export const NAV_ICONS_PRIMARY = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/menu', label: 'Menú', icon: BookOpen },
  { href: '/analytics', label: 'Stats', icon: BarChart3, proOnly: true },
  { href: '/settings', label: 'Ajustes', icon: Settings },
] as const;
