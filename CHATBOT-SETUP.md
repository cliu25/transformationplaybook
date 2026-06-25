# AI Chatbot Assistant Setup Guide

This guide will help you set up the IBM watsonx-powered AI chatbot assistant for the AIFT Playbook site.

## Overview

The chatbot provides intelligent assistance for users navigating the AI-First Transformation Playbook. It can:
- Answer questions about transformation phases and activities
- Provide guidance on next steps
- Explain deliverables and best practices
- Help users understand where they are in their transformation journey
- Warn about common pitfalls

## Prerequisites

1. **IBM Cloud Account**: You need an active IBM Cloud account
2. **watsonx.ai Access**: Access to a watsonx.ai instance
3. **API Credentials**: IBM Cloud API key and watsonx.ai project ID

## Step 1: Get IBM watsonx Credentials

### 1.1 Get Your IBM Cloud API Key

1. Log in to [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to **Manage** → **Access (IAM)** → **API keys**
3. Click **Create an IBM Cloud API key**
4. Give it a descriptive name (e.g., "AIFT Chatbot API Key")
5. Click **Create**
6. **Important**: Copy and save the API key immediately - you won't be able to see it again!

### 1.2 Get Your watsonx.ai Project ID

1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
2. Open your project (or create a new one)
3. Click on the **Manage** tab
4. Find your **Project ID** in the project details
5. Copy the Project ID

### 1.3 Note Your IBM Cloud Region

Your region is typically one of:
- `us-south` (Dallas)
- `eu-gb` (London)
- `eu-de` (Frankfurt)
- `jp-tok` (Tokyo)

You can find this in your IBM Cloud dashboard URL or watsonx.ai instance details.

## Step 2: Configure the Chatbot

### 2.1 Create Configuration File

1. Navigate to the project directory:
   ```bash
   cd aift-playbook-site-v10
   ```

2. Copy the example config file:
   ```bash
   cp config.example.js config.js
   ```

3. Open `config.js` in your text editor

### 2.2 Add Your Credentials

Replace the placeholder values with your actual credentials:

```javascript
const CHATBOT_CONFIG = {
  watsonx: {
    // Replace with your IBM Cloud API Key
    apiKey: 'your-actual-api-key-here',
    
    // Replace with your watsonx.ai Project ID
    projectId: 'your-actual-project-id-here',
    
    // Replace with your IBM Cloud region
    region: 'us-south',  // or 'eu-gb', 'eu-de', 'jp-tok'
    
    // Model configuration (you can customize these)
    modelId: 'ibm/granite-13b-chat-v2',
    
    parameters: {
      max_new_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.1
    }
  },
  
  ui: {
    welcomeMessage: "Hi! I'm your AI Transformation assistant...",
    botName: "AIFT Assistant",
    features: {
      conversationHistory: true,
      clearConversation: true,
      minimizeMaximize: true,
      typingIndicator: true
    }
  }
};
```

### 2.3 Secure Your Configuration

**Important**: Never commit `config.js` to version control!

Add to your `.gitignore`:
```
config.js
```

## Step 3: Test the Chatbot

### 3.1 Start a Local Server

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js
npx http-server -p 8000
```

### 3.2 Open in Browser

1. Navigate to `http://localhost:8000`
2. Look for the floating chat button (🤖) in the bottom-right corner
3. Click to open the chat window

### 3.3 Test Basic Functionality

Try these test messages:
- "What is the AIFT Playbook?"
- "Tell me about the Assess phase"
- "What are the key deliverables in the Design phase?"
- "How do I measure ROI for AI transformation?"

## Step 4: Customize (Optional)

### 4.1 Adjust Model Parameters

In `config.js`, you can tune the AI responses:

```javascript
parameters: {
  max_new_tokens: 500,      // Max response length (100-2000)
  temperature: 0.7,         // Creativity (0.0-1.0, lower = more focused)
  top_p: 0.9,              // Nucleus sampling (0.0-1.0)
  top_k: 50,               // Top-k sampling (1-100)
  repetition_penalty: 1.1  // Avoid repetition (1.0-2.0)
}
```

### 4.2 Change the Model

Available models include:
- `ibm/granite-13b-chat-v2` (recommended, balanced)
- `ibm/granite-20b-multilingual` (multilingual support)
- `meta-llama/llama-3-70b-instruct` (more powerful, slower)
- `mistralai/mixtral-8x7b-instruct-v01` (fast, efficient)

### 4.3 Customize Welcome Message

Edit the `welcomeMessage` in `config.js`:

```javascript
ui: {
  welcomeMessage: "Your custom welcome message here!",
  botName: "Your Bot Name"
}
```

## Troubleshooting

### Issue: "I'm not configured yet" message

**Solution**: Make sure you've created `config.js` from `config.example.js` and added your credentials.

### Issue: API authentication errors

**Solutions**:
1. Verify your API key is correct
2. Check that your API key has the necessary permissions
3. Ensure your watsonx.ai instance is active
4. Verify the region matches your instance location

### Issue: "Failed to get IAM token"

**Solutions**:
1. Check your API key is valid
2. Ensure you have internet connectivity
3. Verify IBM Cloud services are operational

### Issue: Chatbot not appearing

**Solutions**:
1. Check browser console for JavaScript errors
2. Ensure all files are loaded correctly (check Network tab)
3. Verify `config.js` exists and is loaded before `chatbot.js`
4. Clear browser cache and reload

### Issue: Slow responses

**Solutions**:
1. Try a smaller/faster model
2. Reduce `max_new_tokens` parameter
3. Check your internet connection
4. Verify watsonx.ai service status

## Features

### Conversation History
- Conversations are saved in browser session storage
- History persists during the session
- Clear history with the trash icon

### Responsive Design
- Works on desktop, tablet, and mobile
- Adapts to screen size
- Touch-friendly interface

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management

## Architecture

### Files Structure
```
aift-playbook-site-v10/
├── config.example.js      # Example configuration (commit this)
├── config.js             # Your actual config (DO NOT commit)
├── css/
│   └── chatbot.css       # Chatbot styling
├── js/
│   └── chatbot.js        # Chatbot logic and watsonx integration
└── index.html            # Updated with chatbot HTML
```

### How It Works

1. **User Input**: User types a message and clicks send
2. **Context Building**: System builds conversation context with:
   - System prompt (defines chatbot personality and knowledge)
   - Recent conversation history
   - Current user message
3. **API Call**: Sends request to IBM watsonx.ai
4. **Response**: AI generates response based on AIFT Playbook knowledge
5. **Display**: Response is displayed in chat window
6. **History**: Conversation saved to session storage

## Best Practices

### For Users
1. Be specific in your questions
2. Provide context about where you are in your transformation
3. Ask follow-up questions for clarification
4. Use the clear button to start fresh conversations

### For Administrators
1. Monitor API usage and costs
2. Regularly review conversation quality
3. Update system prompt based on user feedback
4. Keep credentials secure
5. Test after any configuration changes

## API Costs

IBM watsonx.ai charges based on:
- Number of tokens processed (input + output)
- Model used (larger models cost more)
- Region

**Estimate**: ~$0.001-0.01 per conversation exchange (varies by model and length)

Monitor your usage in the IBM Cloud dashboard.

## Support

### Resources
- [IBM watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [IBM Cloud API Documentation](https://cloud.ibm.com/apidocs)
- [Carbon Design System](https://carbondesignsystem.com/)

### Getting Help
1. Check this documentation first
2. Review browser console for errors
3. Verify IBM Cloud service status
4. Contact IBM Cloud support for API issues

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `config.js`** to version control
2. **Use environment variables** in production
3. **Implement rate limiting** to prevent abuse
4. **Monitor API usage** for unusual patterns
5. **Rotate API keys** regularly
6. **Use HTTPS** in production
7. **Implement CORS** properly for production deployments

## Production Deployment

For production deployment:

1. **Use Environment Variables**:
   ```javascript
   apiKey: process.env.WATSONX_API_KEY || 'fallback-key'
   ```

2. **Implement Backend Proxy**:
   - Don't expose API keys in client-side code
   - Create a backend endpoint that proxies requests
   - Add authentication and rate limiting

3. **Enable Analytics**:
   - Track usage patterns
   - Monitor conversation quality
   - Identify common questions

4. **Add Monitoring**:
   - Set up error tracking
   - Monitor API response times
   - Track user satisfaction

## License

This chatbot implementation is part of the AIFT Playbook project.

---

**Last Updated**: June 2026  
**Version**: 1.0  
**Authors**: Claire Liu and Alexandra Ko