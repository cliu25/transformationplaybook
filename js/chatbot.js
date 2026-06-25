/**
 * IBM watsonx AI Chatbot Assistant for AIFT Playbook
 * 
 * This chatbot integrates with IBM watsonx.ai to provide AI transformation guidance
 * based on the AIFT Playbook content.
 */

class AIFTChatbot {
  constructor() {
    this.config = typeof CHATBOT_CONFIG !== 'undefined' ? CHATBOT_CONFIG : null;
    this.conversationHistory = [];
    this.isOpen = false;
    this.isTyping = false;
    this.playbookContent = null;
    this.systemPrompt = this.buildSystemPrompt();
    
    // Check if config is loaded
    if (!this.config) {
      console.error('Chatbot config not loaded. Please create config.js from config.example.js');
    }
    
    this.init();
  }

  /**
   * Initialize the chatbot
   */
  init() {
    this.loadPlaybookContent();
    this.setupEventListeners();
    this.loadConversationHistory();
    
    // Show welcome message if no history
    if (this.conversationHistory.length === 0) {
      this.addMessage('bot', this.config?.ui?.welcomeMessage || 'Hello! How can I help you today?');
    } else {
      this.renderMessages();
    }
  }

  /**
   * Load playbook content from content_synced.json
   */
  async loadPlaybookContent() {
    try {
      const response = await fetch('content_synced.json');
      this.playbookContent = await response.json();
      console.log('Playbook content loaded successfully');
    } catch (error) {
      console.error('Error loading playbook content:', error);
    }
  }

  /**
   * Build comprehensive system prompt for the AI assistant
   */
  buildSystemPrompt() {
    return `You are an expert AI Transformation assistant for the IBM AI-First Transformation (AIFT) Playbook. Your role is to help users navigate their AI transformation journey.

**Your Expertise:**
- AI transformation methodology and best practices
- The AIFT Playbook structure: Engage, Discover, and Execute phases
- Five key phases: Assess, Analyze, Design, Build, and Sustain
- Key activities, deliverables, and critical moments in each phase
- Common pitfalls and how to avoid them
- Value measurement and ROI tracking

**The AIFT Playbook Structure:**

1. **Engage Phase:**
   - Assess: Determine domain readiness, secure sponsorship, establish team structure
   - Key focus: Go/no-go decision before detailed work

2. **Discover Phase:**
   - Analyze: Score and prioritize workflows, select MVP target, lock metrics
   - Design: Design AI-enabled solution, define MVP scope, create build-ready requirements

3. **Execute Phase:**
   - Build: Track value against baseline throughout build
   - Sustain: Validate realized value with Finance, report on cadence

**Your Approach:**
- Be helpful, concise, and actionable
- Ask clarifying questions to understand the user's context
- Provide specific guidance based on where they are in their transformation
- Reference relevant phases, activities, and deliverables from the playbook
- Suggest next steps and best practices
- Warn about common pitfalls when relevant
- Keep responses focused and practical

**Response Guidelines:**
- Keep responses under 200 words when possible
- Use bullet points for clarity
- Reference specific playbook phases when relevant
- Ask follow-up questions to better understand user needs
- Be encouraging and supportive

Remember: You're here to guide users through their AI transformation journey using the AIFT Playbook methodology.`;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleChat());
    }

    // Close button
    const closeBtn = document.getElementById('chatbot-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleChat());
    }

    // Clear conversation button
    const clearBtn = document.getElementById('chatbot-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearConversation());
    }

    // Send button
    const sendBtn = document.getElementById('chatbot-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Input field
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      input.addEventListener('input', () => {
        this.autoResizeInput();
      });
    }
  }

  /**
   * Toggle chat window open/closed
   */
  toggleChat() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chatbot-window');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');

    if (this.isOpen) {
      window.classList.add('open');
      toggleBtn.classList.add('hidden');
      document.getElementById('chatbot-input')?.focus();
    } else {
      window.classList.remove('open');
      toggleBtn.classList.remove('hidden');
    }
  }

  /**
   * Auto-resize input textarea
   */
  autoResizeInput() {
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
  }

  /**
   * Send user message
   */
  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input?.value.trim();

    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      this.hideTypingIndicator();
      this.addMessage('bot', response);
    } catch (error) {
      this.hideTypingIndicator();
      this.showError('Sorry, I encountered an error. Please try again.');
      console.error('Error getting AI response:', error);
    }
  }

  /**
   * Get AI response from IBM watsonx
   */
  async getAIResponse(userMessage) {
    if (!this.config || !this.config.watsonx.apiKey || this.config.watsonx.apiKey === 'YOUR_IBM_CLOUD_API_KEY_HERE') {
      return "I'm not configured yet. Please set up your IBM watsonx credentials in config.js. See config.example.js for instructions.";
    }

    try {
      console.log('Getting AI response for message:', userMessage);
      
      // Get IBM Cloud IAM token
      const token = await this.getIAMToken();
      console.log('IAM token obtained successfully');

      // Build conversation context
      const inputText = this.buildConversationContext(userMessage);
      console.log('Conversation context built, length:', inputText.length);

      // Call watsonx.ai API via proxy to avoid CORS
      const proxyUrl = 'http://localhost:8012/watsonx-api';
      
      console.log('Calling watsonx API via proxy');
      console.log('Model ID:', this.config.watsonx.modelId);
      console.log('Project ID:', this.config.watsonx.projectId);
      
      const requestBody = {
        model_id: this.config.watsonx.modelId,
        input: inputText,  // Must be a string, not an object
        parameters: this.config.watsonx.parameters,
        project_id: this.config.watsonx.projectId
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Send request through proxy
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          region: this.config.watsonx.region,
          token: token,
          requestBody: requestBody
        })
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        throw new Error(`watsonx API error (${response.status}): ${errorData.message || errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      if (!data.results || !data.results[0] || !data.results[0].generated_text) {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid response format from watsonx API');
      }
      
      return data.results[0].generated_text.trim();

    } catch (error) {
      console.error('Error calling watsonx API:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get IBM Cloud IAM token via proxy server
   * Uses local proxy to avoid CORS issues
   */
  async getIAMToken() {
    try {
      console.log('Requesting IAM token via proxy...');
      
      // Use local proxy server to avoid CORS issues
      const proxyUrl = 'http://localhost:8012/iam-token';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: `apikey=${this.config.watsonx.apiKey}`
      });

      console.log('IAM token response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('IAM token error response:', errorText);
        
        // Check if proxy server is running
        if (response.status === 0 || errorText.includes('Failed to fetch')) {
          throw new Error('Cannot connect to proxy server. Please start the proxy server with: node proxy-server.js');
        }
        
        throw new Error(`Failed to get IAM token (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('IAM token received successfully');
      return data.access_token;
    } catch (error) {
      console.error('IAM token error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Cannot connect to proxy server at http://localhost:8012. Please start it with: node proxy-server.js');
      }
      
      throw error;
    }
  }

  /**
   * Build conversation context for AI
   */
  buildConversationContext(userMessage) {
    // Start with system prompt
    let context = this.systemPrompt + '\n\n';

    // Add recent conversation history (last 5 exchanges)
    const recentHistory = this.conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        context += `User: ${msg.content}\n`;
      } else if (msg.role === 'bot') {
        context += `Assistant: ${msg.content}\n`;
      }
    });

    // Add current user message
    context += `User: ${userMessage}\nAssistant:`;

    return context;
  }

  /**
   * Add message to conversation
   */
  addMessage(role, content) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    this.conversationHistory.push(message);
    this.saveConversationHistory();
    this.renderMessage(message);
    this.scrollToBottom();
  }

  /**
   * Render a single message
   */
  renderMessage(message) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${message.role}`;

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-message-avatar';
    avatar.textContent = message.role === 'bot' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chatbot-message-content';

    const bubble = document.createElement('div');
    bubble.className = 'chatbot-message-bubble';
    bubble.textContent = message.content;

    const time = document.createElement('div');
    time.className = 'chatbot-message-time';
    time.textContent = this.formatTime(message.timestamp);

    contentDiv.appendChild(bubble);
    contentDiv.appendChild(time);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
  }

  /**
   * Render all messages
   */
  renderMessages() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    this.conversationHistory.forEach(msg => this.renderMessage(msg));
    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.isTyping = true;
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-typing';
    typingDiv.id = 'chatbot-typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-message-avatar';
    avatar.style.background = '#0f62fe';
    avatar.style.color = '#fff';
    avatar.textContent = '🤖';

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'chatbot-typing-dots';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'chatbot-typing-dot';
      dotsDiv.appendChild(dot);
    }

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dotsDiv);
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('chatbot-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'chatbot-error';

    const icon = document.createElement('span');
    icon.className = 'chatbot-error-icon';
    icon.textContent = '⚠️';

    const text = document.createElement('span');
    text.textContent = message;

    errorDiv.appendChild(icon);
    errorDiv.appendChild(text);
    messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();

    // Remove error after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      this.conversationHistory = [];
      this.saveConversationHistory();
      
      const messagesContainer = document.getElementById('chatbot-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }

      // Show welcome message
      this.addMessage('bot', this.config?.ui?.welcomeMessage || 'Hello! How can I help you today?');
    }
  }

  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  /**
   * Save conversation history to sessionStorage
   */
  saveConversationHistory() {
    try {
      sessionStorage.setItem('aift_chatbot_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  /**
   * Load conversation history from sessionStorage
   */
  loadConversationHistory() {
    try {
      const saved = sessionStorage.getItem('aift_chatbot_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      this.conversationHistory = [];
    }
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiftChatbot = new AIFTChatbot();
  });
} else {
  window.aiftChatbot = new AIFTChatbot();
}

// Made with Bob
