export type NavLink = {
  label: string;
  icon: string;
  to: string;
  click?: () => void;
};

export interface Item {
  name: string;
  description?: string;
  price: number | string;
}

export interface Section {
  title: string;
  description?: string;
  cover: string;
  items: Item[];
}

export type Category = {
  title: string;
  description?: string;
  slug: string;
  cover: string;
  sections: Section[];
};

export type Evento = {
  id?: string | number;
  name: string;
  description?: string;
  cover: string;
  startDate: Date | string;
  endDate: Date | string;
};
