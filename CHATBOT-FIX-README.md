# Chatbot Fix Documentation

## Problem Identified

The chatbot was showing "Sorry, I encountered an error. Please try again." due to the following issues:

1. **CORS Issue**: Browser security prevents direct calls to IBM Cloud IAM token endpoint from client-side JavaScript
2. **API Request Format**: The watsonx.ai API expects the `input` parameter to be a string, not an object
3. **Insufficient Error Logging**: Limited console logging made debugging difficult

## Solution Implemented

### 1. Created CORS Proxy Server (`proxy-server.js`)
- Simple Node.js proxy server that forwards IAM token requests to IBM Cloud
- Runs on `http://localhost:8012`
- Handles CORS headers to allow browser requests
- Endpoint: `POST /iam-token`

### 2. Updated `chatbot.js`
- Modified `getIAMToken()` to use the proxy server instead of direct IBM Cloud calls
- Fixed API request format to send `input` as a string
- Added comprehensive error logging throughout the request flow
- Added helpful error messages when proxy server is not running

### 3. Enhanced Error Handling
- Better error messages for debugging
- Console logging at each step of the API call
- Detailed error responses from both IAM and watsonx.ai APIs

## How to Run the Chatbot

### Prerequisites
- Node.js installed
- IBM watsonx credentials configured in `config.js`

### Steps

1. **Start the HTTP server** (if not already running):
   ```bash
   cd /Users/claireliu/Desktop/aift-playbook-site-v10
   python3 -m http.server 8011
   ```

2. **Start the CORS proxy server**:
   ```bash
   cd /Users/claireliu/Desktop/aift-playbook-site-v10
   node proxy-server.js
   ```
   
   You should see:
   ```
   CORS proxy server running on http://localhost:8012
   Endpoint: POST http://localhost:8012/iam-token
   ```

3. **Open the chatbot**:
   - Navigate to `http://localhost:8011` in your browser
   - Open browser console (F12 or Cmd+Option+I)
   - Click the chatbot icon to open the chat window
   - Send a test message

### Testing

1. Open browser console to see detailed logs
2. Send a message like "What is the AIFT Playbook?"
3. Watch the console for:
   - "Getting AI response for message: ..."
   - "Requesting IAM token via proxy..."
   - "IAM token received successfully"
   - "Calling watsonx API: ..."
   - "Response status: 200 OK"
   - "API response data: ..."

### Expected Console Output

```
Getting AI response for message: What is the AIFT Playbook?
Requesting IAM token via proxy...
IAM token response status: 200
IAM token received successfully
Conversation context built, length: 1234
Calling watsonx API: https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29
Model ID: ibm/granite-13b-chat-v2
Project ID: 7ff2ea2c-be2f-4c2b-b18a-0ec42326fd21
Request body: {...}
Response status: 200 OK
API response data: {...}
```

## Troubleshooting

### Error: "Cannot connect to proxy server"
- **Cause**: Proxy server is not running
- **Solution**: Start the proxy server with `node proxy-server.js`

### Error: "Failed to get IAM token"
- **Cause**: Invalid API key or network issue
- **Solution**: 
  - Verify API key in `config.js`
  - Check network connection
  - Check proxy server logs for detailed error

### Error: "watsonx API error"
- **Cause**: Invalid project ID, model ID, or API request format
- **Solution**:
  - Verify project ID in `config.js`
  - Check model ID is correct
  - Review console logs for detailed error message

### CORS Errors
- **Cause**: Trying to access from different origin
- **Solution**: Ensure you're accessing via `http://localhost:8011` (not file://)

## Files Modified

1. **js/chatbot.js**
   - Updated `getIAMToken()` to use proxy server
   - Fixed `getAIResponse()` API request format
   - Added comprehensive error logging

2. **proxy-server.js** (NEW)
   - CORS proxy for IAM token authentication
   - Forwards requests to IBM Cloud IAM endpoint

## Configuration

Current configuration in `config.js`:
- API Key: `rFPIPrYABTLB_HehSMIVDrM__CfsO1YBXN6tsoCAOmPR`
- Project ID: `7ff2ea2c-be2f-4c2b-b18a-0ec42326fd21`
- Region: `us-south`
- Model: `ibm/granite-13b-chat-v2`

## Production Deployment

For production deployment, consider:

1. **Backend API**: Move IAM token generation to a secure backend service
2. **Environment Variables**: Store credentials in environment variables, not in code
3. **Token Caching**: Cache IAM tokens (valid for 1 hour) to reduce API calls
4. **Rate Limiting**: Implement rate limiting on the proxy server
5. **HTTPS**: Use HTTPS for all API communications
6. **Error Monitoring**: Implement proper error tracking and monitoring

## Next Steps

- Test with various user queries
- Monitor API usage and costs
- Implement token caching for better performance
- Add user feedback mechanism
- Consider implementing conversation memory/context management