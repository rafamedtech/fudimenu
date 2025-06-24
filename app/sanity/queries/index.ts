export const allCategories = groq`
*[_type == 'category']{
  _id,
  _createdAt,
  name,
  "slug": slug.current,
  "cover": cover.asset->url
}`;

export const currentCategory = groq`
*[_type == 'category' && slug.current == $slug]{
    _id,
  _createdAt,
  name,
  description,
  "cover": cover.asset->url,
  sections[]->{
    _id,
    _createdAt,
    name,
    description,
    "slug": slug.current,
    "cover": cover.asset->url,
    items[]->{
      _id,
      _createdAt,
      name,
      "cover": cover.asset->url,
      description,
      price,
      variants[]->{
        _id,
        name,
        price
      }
    }
  }
}[0]
`;

export const allEvents = groq`
*[_type == 'event']{
  _id,
  _createdAt,
  name,
  description,
  "cover": cover.asset->url,
  startDate,
  endDate
}`;
export const allQuestions = groq`
*[_type == 'question']{
  _id,
  text,
  rating
}`;
