import type { Category } from '~/types';

export function useMenu() {
  const menu = ref<Category[]>([]);

  const getMenu = async () => {
    const newMenu = await $fetch('/api/menu');
    menu.value = newMenu as Category[];
    return menu;
  };

  // Get the current category based on the slug in the URL
  const getCurrentCategory = async (slug: string) => {
    if (!menu.value.length) {
      await getMenu();
    }
    return menu.value.find((category) => category.slug === slug);
  };

  return {
    getMenu,
    getCurrentCategory,
  };
}
