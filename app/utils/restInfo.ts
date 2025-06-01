import logo from '@/assets/images/logo-bg-removed.png';
import brandImage from '@/assets/images/restname.png';
import mainCover from '@/assets/images/brunette-portada.jpg';

export const restInfo = {
  logo,
  brandImage,
  mainCover,
  name: 'Bodega',
  description: 'Sushi and loft',
  address: 'Blvd Real del Mar 1632, Real Del Mar, Tijuana, Mexico, 22563',
  phone: '664 974 6842',
  schedule: [
    {
      id: 1,
      name: 'Lunes - Martes',
      time: 'Cerrado',
    },
    {
      id: 2,
      name: 'Miércoles - Jueves',
      time: '9 AM - 10 PM',
    },
    {
      id: 3,
      name: 'Viernes - Sábado',
      time: '9 AM - 12 PM',
    },
    {
      id: 4,
      name: 'Domingo',
      time: '8 AM - 8 PM',
    },
  ],
  socials: [
    {
      id: 1,
      name: 'Facebook',
      icon: 'icon-park-outline:facebook',
      url: 'https://www.facebook.com/brunette.realdelmar',
    },
    {
      id: 2,
      name: 'Instagram',
      icon: 'icon-park-outline:instagram',
      url: 'https://www.instagram.com/brunette.realdelmar/',
    },
  ],
};
