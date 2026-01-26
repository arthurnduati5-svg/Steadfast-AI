// /**
//  * Ensures synthetic voices do not recite the Qur'an.
//  * Redirects to meaning explanation.
//  */
// export function guardQuranVoice(text: string) {
//     const hasAyah = /سورة|آية|قال الله|﴿|﴾|Surah|Ayah|Allah says/.test(text);
  
//     if (hasAyah) {
//       return {
//         allowTTS: false,
//         fallbackText: 'I will explain the beautiful meaning to you here, and we can practice the recitation together in class with the proper Tajweed.',
//       };
//     }
  
//     return { allowTTS: true };
//   }