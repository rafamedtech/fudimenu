export type NavLink = {
  label: string;
  icon: string;
  to: string;
  click?: () => void;
};

export type Category = {
  title: string;
  description?: string;
  slug: string;
  cover: string;
};
