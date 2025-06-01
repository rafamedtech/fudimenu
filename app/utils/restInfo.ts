import logo from '@/assets/images/logo-bg-removed.png';
import brandImage from '@/assets/images/restname.png';
import mainCover from '@/assets/images/maincover.jpg';

export const restInfo = {
  logo,
  brandImage,
  mainCover,
  name: 'Bodega',
  description: 'Sushi and loft',
  address: 'Av. Guanajuato 2730-2 Col. Madero (segundo piso), Tijuana, Mexico',
  phone: '663 121 2076',
  schedule: [
    {
      id: 1,
      name: 'Lunes',
      time: 'Cerrado',
    },
    {
      id: 2,
      name: 'Martes - Miércoles - Jueves',
      time: '1 PM - 9 PM',
    },
    {
      id: 3,
      name: 'Viernes - Sábado',
      time: '1 PM - 10 PM',
    },
    {
      id: 4,
      name: 'Domingo',
      time: '1 PM - 9 PM',
    },
  ],
  socials: [
    {
      id: 1,
      name: 'Facebook',
      icon: 'icon-park-outline:facebook',
      url: 'https://www.facebook.com/bodegasushiloft',
    },
    {
      id: 2,
      name: 'Instagram',
      icon: 'icon-park-outline:instagram',
      url: 'https://www.instagram.com/bodegasushiloft/',
    },
  ],
};
