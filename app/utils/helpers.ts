import type { NavigationMenuItem } from '@nuxt/ui';

export const navLinks: NavigationMenuItem[] = [
  {
    label: 'Menú',
    icon: 'i-heroicons-clipboard-document-list-solid',
    to: '/menu',
  },
  {
    label: 'Eventos',
    icon: 'i-heroicons-calendar-days-solid',
    to: '/eventos',
  },
  {
    label: 'Encuesta',
    icon: 'i-heroicons-clipboard-document-check-solid',
    to: '/encuesta',
  },
  {
    label: 'Acerca de',
    icon: 'i-heroicons-building-storefront-solid',
    to: '/',
  },
];

export const featuredEventImage =
  'https://res.cloudinary.com/rafamed-dev/image/upload/v1741120031/jueves-italiano_shyyv7.jpg';
