export class GeminiAiAdapter {
  async getAiResponse(prompt: string): Promise<string> {
    // Simulate an API call to Gemini AI
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Gemini AI response to: ${prompt}`);
      }, 1000);
    });
  }
}
