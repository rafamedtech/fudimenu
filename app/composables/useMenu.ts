export function useMenu() {
  const getMenu = async () => {
    const menu = await $fetch('/api/menu');
    return menu;
  };

  return {
    getMenu,
  };
}
