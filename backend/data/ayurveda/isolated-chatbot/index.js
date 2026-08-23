const generalAyurveda = require('./generalAyurveda');
const digestion = require('./digestion');
const diet = require('./diet');
const therapyPreparation = require('./therapyPreparation');
const therapyAftercare = require('./therapyAftercare');
const abhyanga = require('./abhyanga');
const herbs = require('./herbs');
const sleepLifestyle = require('./sleepLifestyle');
const dinacharya = require('./dinacharya');
const classicalQuestions = require('./classicalQuestions');
const patientContext = require('./patientContext');
const medicationSafety = require('./medicationSafety');
const diagnosisSafety = require('./diagnosisSafety');
const emergencySafety = require('./emergencySafety');
const promptInjection = require('./promptInjection');
const questionVariations = require('./questionVariations');
const followUpConversations = require('./followUpConversations');

const allDatasetRecords = [
  ...generalAyurveda,
  ...digestion,
  ...diet,
  ...therapyPreparation,
  ...therapyAftercare,
  ...abhyanga,
  ...herbs,
  ...sleepLifestyle,
  ...dinacharya,
  ...classicalQuestions,
  ...patientContext,
  ...medicationSafety,
  ...diagnosisSafety,
  ...emergencySafety,
  ...promptInjection
];

module.exports = {
  allDatasetRecords,
  generalAyurveda,
  digestion,
  diet,
  therapyPreparation,
  therapyAftercare,
  abhyanga,
  herbs,
  sleepLifestyle,
  dinacharya,
  classicalQuestions,
  patientContext,
  medicationSafety,
  diagnosisSafety,
  emergencySafety,
  promptInjection,
  questionVariations,
  followUpConversations
};
