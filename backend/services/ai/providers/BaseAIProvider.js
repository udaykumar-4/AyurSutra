class BaseAIProvider {
  /**
   * Abstract method for generating chatbot response
   */
  async generateChatResponse(systemPrompt, userQuestion, contextData) {
    throw new Error('generateChatResponse must be implemented by subclass');
  }
}

module.exports = BaseAIProvider;
