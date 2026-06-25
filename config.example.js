/**
 * IBM watsonx AI Chatbot Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'config.js' in the same directory
 * 2. Fill in your IBM watsonx API credentials
 * 3. Add 'config.js' to your .gitignore to keep credentials secure
 * 
 * To get your IBM watsonx credentials:
 * 1. Go to https://cloud.ibm.com/
 * 2. Navigate to your watsonx.ai instance
 * 3. Get your API key from IBM Cloud IAM
 * 4. Get your project ID from watsonx.ai project settings
 * 5. Note your region (us-south, eu-gb, etc.)
 */

const CHATBOT_CONFIG = {
  // IBM watsonx API Configuration
  watsonx: {
    // Your IBM Cloud API Key
    apiKey: 'YOUR_IBM_CLOUD_API_KEY_HERE',
    
    // Your watsonx.ai Project ID
    projectId: 'YOUR_WATSONX_PROJECT_ID_HERE',
    
    // IBM Cloud Region (e.g., 'us-south', 'eu-gb', 'eu-de', 'jp-tok')
    region: 'us-south',
    
    // Model to use (e.g., 'ibm/granite-13b-chat-v2', 'meta-llama/llama-3-70b-instruct')
    modelId: 'ibm/granite-13b-chat-v2',
    
    // Model parameters
    parameters: {
      max_new_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.1
    }
  },
  
  // Chatbot UI Configuration
  ui: {
    // Initial greeting message
    welcomeMessage: "Hi! I'm your AI Transformation assistant. I can help you navigate the AIFT Playbook, answer questions about transformation phases, and provide guidance on your AI journey. How can I help you today?",
    
    // Chatbot name
    botName: "AIFT Assistant",
    
    // Enable/disable features
    features: {
      conversationHistory: true,
      clearConversation: true,
      minimizeMaximize: true,
      typingIndicator: true
    }
  }
};

// Export for use in chatbot.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHATBOT_CONFIG;
}

// Made with Bob
