import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FudiMenu',
    short_name: 'FudiMenu',
    description: 'El menú de tu restaurante, sin PDFs lentos.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FFFCF5',
    theme_color: '#F4B400',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
