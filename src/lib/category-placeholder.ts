const categoryEmojiByName: Record<string, string> = {
  acompanamientos: '🍟',
  alimentos: '🥪',
  bebidas: '🥤',
  'bebidas frias': '🧋',
  bowls: '🥗',
  cafe: '☕',
  cafes: '☕',
  ensaladas: '🥗',
  entradas: '🥟',
  especiales: '⭐',
  hamburguesas: '🍔',
  jugos: '🧃',
  menu: '🍽️',
  nigiris: '🍣',
  otros: '🍽️',
  panaderia: '🥐',
  pastas: '🍝',
  pizzas: '🍕',
  postres: '🍰',
  rollos: '🍣',
  tacos: '🌮',
};

function normalizeCategoryName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getCategoryEmoji(categoryName?: string | null) {
  if (!categoryName) return categoryEmojiByName.otros;

  const normalized = normalizeCategoryName(categoryName);
  return categoryEmojiByName[normalized] ?? categoryEmojiByName.otros;
}
