// import { allQuestions } from '@/sanity/queries';
import type { SurveyOutline, QuestionOutline, SurveyWithQuestions } from '@/types';

export function useSurvey() {
  //   const toast = useToast();

  const surveys = ref<SurveyWithQuestions[]>([]);
  const surveyData = reactive<SurveyOutline>({
    name: '',
    email: '',
    waiter: 'No lo sé',
    comments: '',
    new: true,
  });

  const questions = ref<QuestionOutline[]>([]);
  const getQuestions = async () => {
    // const { data } = await useSanityQuery<QuestionFromApi[]>(allQuestions);
    // questions.value = data.value?.map((question) => {
    //   return {
    //     text: question.text,
    //     rating: question.rating,
    //   };
    // }) as QuestionOutline[];
  };

  const getSurveys = async () => {
    // Get surveys from the API
    const { data } = await useFetch<SurveyWithQuestions[]>('/api/surveys/surveys');
    surveys.value = data.value as SurveyWithQuestions[];
  };

  //   async function sendSurvey(survey: any) {
  //     try {
  //       await $fetch(`/api/surveys/send`, {
  //         method: 'POST',
  //         body: { survey },
  //       });
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }

  //   async function sendEmail() {
  //     try {
  //       await $fetch('/api/surveys/email', {
  //         method: 'POST',
  //         body: {
  //           message: 'http://localhost:3000/admin/encuestas',
  //         },
  //       });

  //       toast.add({
  //         title: 'Correo enviado',
  //       });
  //     } catch (error) {
  //       console.error(error);
  //       toast.add({
  //         title: 'Error al enviar el correo',
  //         description: 'Intente recargar la página e intentar de nuevo',
  //       });
  //     }
  //   }

  //   const markSurveyAsRead = async (survey: SurveyWithQuestions) => {
  //     const { data } = await $fetch(`/api/surveys/${survey.id}/read`, {
  //       method: 'PUT',
  //       body: { survey },
  //     });
  //     survey.new = data.new;

  //     if (!survey.new) {
  //       toast.add({
  //         title: 'Encuesta marcada como leída',
  //         color: 'green',
  //         icon: 'i-heroicons-check-circle',
  //         timeout: 3000,
  //       });
  //     }
  //   };

  //   const getRating = (survey: SurveyWithQuestions) => {
  //     const rating = survey.questions.reduce((acc, question) => {
  //       return acc + question.rating;
  //     }, 0);
  //     return rating / survey.questions.length;
  //   };

  //   const getGlobalRating = computed(() => {
  //     let totalRating = 0;
  //     let totalQuestions = 0;

  //     surveys.value.forEach((survey) => {
  //       survey.questions.forEach((question) => {
  //         totalRating += question.rating;
  //         totalQuestions++;
  //       });
  //     });

  //     return totalRating / totalQuestions;
  //   });

  return {
    getQuestions,
    getSurveys,
    // sendSurvey,
    // sendEmail,
    // getRating,
    // markSurveyAsRead,
    surveys,
    surveyData,
    questions,
    // getGlobalRating,
  };
}
