import { defaultRestaurantThemeConfig } from './restaurant-theme'

export const demoRestaurantSlugs = ['brasa-norte', 'casa-marea'] as const

export const demoRestaurants = [
  {
    name: 'Brasa Norte',
    slug: 'brasa-norte',
    description:
      'Carnes, tacos y platos para compartir en un ambiente casual pensado para grupos pequeños.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
    address: 'Av. Constitución 245',
    city: 'Tijuana',
    zone: 'Zona Río',
    phone: '+52 664 123 4567',
    whatsapp: '+52 664 123 4567',
    cuisineType: 'Mexicana contemporánea',
    businessHours: 'Lun-Dom 1:00 PM - 11:00 PM',
    isPublished: true,
    themeConfig: {
      ...defaultRestaurantThemeConfig,
      primary: 'amber',
      neutral: 'stone',
      radius: '0.375'
    },
    categories: [
      {
        name: 'Entradas',
        slug: 'entradas',
        sortOrder: 1,
        items: [
          {
            name: 'Queso fundido con chorizo',
            description: 'Servido con tortillas de harina recién hechas.',
            price: '129.00',
            sortOrder: 1
          },
          {
            name: 'Guacamole de la casa',
            description: 'Preparado al momento con totopos artesanales.',
            price: '98.00',
            sortOrder: 2
          }
        ]
      },
      {
        name: 'Tacos',
        slug: 'tacos',
        sortOrder: 2,
        items: [
          {
            name: 'Taco de rib eye',
            description: 'Rib eye, cebolla asada y salsa tatemada.',
            price: '74.00',
            sortOrder: 1
          },
          {
            name: 'Taco gobernador',
            description: 'Camarón, queso gratinado y tortilla dorada.',
            price: '68.00',
            sortOrder: 2
          },
          {
            name: 'Taco vegetariano',
            description: 'Hongos al ajillo, calabaza y crema de cilantro.',
            price: '59.00',
            isAvailable: false,
            sortOrder: 3
          }
        ]
      },
      {
        name: 'Bebidas',
        slug: 'bebidas',
        sortOrder: 3,
        items: [
          {
            name: 'Limonada mineral',
            price: '48.00',
            sortOrder: 1
          },
          {
            name: 'Agua fresca del día',
            price: '39.00',
            sortOrder: 2
          }
        ]
      }
    ]
  },
  {
    name: 'Casa Marea',
    slug: 'casa-marea',
    description:
      'Mariscos frescos, ceviches y platos ligeros con una propuesta ideal para comida familiar.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
    address: 'Blvd. Agua Caliente 1120',
    city: 'Tijuana',
    zone: 'Hipódromo',
    phone: '+52 664 987 6543',
    whatsapp: '+52 664 987 6543',
    cuisineType: 'Mariscos',
    businessHours: 'Mar-Dom 12:00 PM - 10:00 PM',
    isPublished: true,
    themeConfig: {
      ...defaultRestaurantThemeConfig,
      primary: 'cyan',
      neutral: 'slate',
      radius: '0.25'
    },
    categories: [
      {
        name: 'Ceviches',
        slug: 'ceviches',
        sortOrder: 1,
        items: [
          {
            name: 'Ceviche clásico',
            description: 'Pescado blanco, pepino, cebolla morada y aguacate.',
            price: '165.00',
            sortOrder: 1
          },
          {
            name: 'Ceviche tropical',
            description: 'Mango, habanero, camarón y leche de tigre.',
            price: '179.00',
            sortOrder: 2
          }
        ]
      },
      {
        name: 'Platos fuertes',
        slug: 'platos-fuertes',
        sortOrder: 2,
        items: [
          {
            name: 'Tostada de atún',
            description: 'Atún fresco, alioli de chipotle y poro frito.',
            price: '112.00',
            sortOrder: 1
          },
          {
            name: 'Filete zarandeado',
            description: 'Con arroz de coco y vegetales salteados.',
            price: '248.00',
            sortOrder: 2
          }
        ]
      },
      {
        name: 'Postres',
        slug: 'postres',
        sortOrder: 3,
        isActive: true,
        items: [
          {
            name: 'Pay de limón',
            price: '76.00',
            sortOrder: 1
          },
          {
            name: 'Flan de coco',
            price: '79.00',
            isAvailable: false,
            sortOrder: 2
          }
        ]
      }
    ]
  }
] as const
