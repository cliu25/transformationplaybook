/**
 * CORS proxy for IBM Cloud IAM authentication and watsonx.ai API
 * This proxy handles both IAM token and watsonx API requests to avoid CORS issues
 *
 * Usage: node proxy-server.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8012;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST to /iam-token
  if (req.method === 'POST' && req.url === '/iam-token') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log('Proxying IAM token request...');
      
      // Parse the API key from the request body
      const params = new URLSearchParams(body);
      const apiKey = params.get('apikey');
      
      if (!apiKey) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API key is required' }));
        return;
      }

      // Forward request to IBM Cloud IAM
      const postData = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;
      
      const options = {
        hostname: 'iam.cloud.ibm.com',
        port: 443,
        path: '/identity/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
          data += chunk;
        });

        proxyRes.on('end', () => {
          console.log('IAM token response status:', proxyRes.statusCode);
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
      });

      proxyReq.on('error', (error) => {
        console.error('IAM proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + error.message }));
      });

      proxyReq.write(postData);
      proxyReq.end();
    });
  }
  // Handle POST to /watsonx-api
  else if (req.method === 'POST' && req.url.startsWith('/watsonx-api')) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log('Proxying watsonx.ai API request...');
      
      try {
        const requestData = JSON.parse(body);
        const { region, token, requestBody } = requestData;
        
        if (!region || !token || !requestBody) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required parameters: region, token, requestBody' }));
          return;
        }

        // Forward request to watsonx.ai
        const postData = JSON.stringify(requestBody);
        
        const options = {
          hostname: `${region}.ml.cloud.ibm.com`,
          port: 443,
          path: '/ml/v1/text/generation?version=2023-05-29',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        console.log('Forwarding to:', `https://${options.hostname}${options.path}`);

        const proxyReq = https.request(options, (proxyRes) => {
          let data = '';

          proxyRes.on('data', (chunk) => {
            data += chunk;
          });

          proxyRes.on('end', () => {
            console.log('watsonx.ai response status:', proxyRes.statusCode);
            res.writeHead(proxyRes.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
          });
        });

        proxyReq.on('error', (error) => {
          console.error('watsonx.ai proxy error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error: ' + error.message }));
        });

        proxyReq.write(postData);
        proxyReq.end();
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request format: ' + error.message }));
      }
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Available endpoints: /iam-token, /watsonx-api' }));
  }
});

server.listen(PORT, () => {
  console.log(`CORS proxy server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  - POST http://localhost:8012/iam-token');
  console.log('  - POST http://localhost:8012/watsonx-api');
  console.log('This proxy forwards requests to IBM Cloud to avoid CORS issues.');
});

// Made with Bob
