import type { NavigationMenuItem } from '@nuxt/ui';

export const navLinks: NavigationMenuItem[] = [
  {
    label: 'Inicio',
    icon: 'i-lucide-house',
    to: '/',
  },
  {
    label: 'Menú',
    icon: 'i-lucide-book-open-text',
    to: '/menu',
  },
  {
    label: 'Eventos',
    icon: 'i-lucide-calendar-range',
    to: '/eventos',
  },
  {
    label: 'Encuesta',
    icon: 'i-lucide-book-heart',
    to: '/encuesta',
  },
];

export const featuredEventImage =
  'https://res.cloudinary.com/rafamed-dev/image/upload/v1741120031/jueves-italiano_shyyv7.jpg';
