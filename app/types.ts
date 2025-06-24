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

export type Survey = {
  _id: string;
  name: string;
  email: string;
  waiter: string;
  comments: string;
  new: boolean;
  questions?: Question[];
};
export type Question = {
  _id: string;
  text: string;
  rating: number;
  survey: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveyWithQuestions = Survey & {
  questions: Question[];
};

export type QuestionOutline = {
  text: string;
  rating: number;
};

export type QuestionFromApi = QuestionOutline & {
  _id: string;
};

// export type Question = QuestionOutline & {
//   id: string;
// };

export interface SurveyOutline {
  name: string;
  email: string;
  waiter: string;
  comments: string;
  new: boolean;
  questions?: QuestionOutline[];
}
