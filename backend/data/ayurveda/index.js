const diets = require('./diets');
const herbs = require('./herbs');
const therapies = require('./therapies');
const lifestyle = require('./lifestyle');
const faqs = require('./faqs');

const allKnowledgeEntries = [
  ...diets,
  ...herbs,
  ...therapies,
  ...lifestyle,
  ...faqs
];

const STOP_WORDS = new Set([
  'what', 'is', 'a', 'an', 'the', 'should', 'i', 'follow', 'do', 'how', 'to',
  'for', 'my', 'of', 'in', 'and', 'or', 'on', 'can', 'take', 'needed', 'post', 'before',
  'benefits', 'benefit', 'about', 'tell', 'me', 'give', 'explain', 'are', 'what\'s'
]);

/**
 * Search Knowledge Base by Keywords & Tokens
 */
const searchKnowledgeBase = (query, category = null) => {
  if (!query) return allKnowledgeEntries;

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length === 0) return [];

  const scoredEntries = allKnowledgeEntries.map(entry => {
    let score = 0;
    const title = (entry.title || '').toLowerCase();
    const desc = (entry.description || entry.educationalSummary || '').toLowerCase();
    const topic = (entry.topic || '').toLowerCase();
    const categoryName = (entry.category || '').toLowerCase();
    const commonName = (entry.commonName || '').toLowerCase();
    const sanskritName = (entry.sanskritName || '').toLowerCase();
    const keywords = (entry.keywords || []).map(k => k.toLowerCase());

    words.forEach(word => {
      if (title.includes(word)) score += 80;
      if (commonName.includes(word)) score += 80;
      if (sanskritName.includes(word)) score += 80;
      if (topic.includes(word)) score += 50;
      if (keywords.includes(word)) score += 20;
      if (categoryName.includes(word)) score += 10;
      if (desc.includes(word)) score += 5;
    });

    return { entry, score };
  });

  return scoredEntries
    .filter(item => item.score >= 25)
    .sort((a, b) => b.score - a.score)
    .map(item => item.entry);
};

module.exports = {
  allKnowledgeEntries,
  diets,
  herbs,
  therapies,
  lifestyle,
  faqs,
  searchKnowledgeBase
};
