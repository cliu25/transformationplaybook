# IBM Cloud Code Engine Deployment Guide

## Overview

This guide will help you deploy the AIFT Playbook website with AI chatbot to IBM Cloud Code Engine. The deployment includes:
- Static website (HTML, CSS, JavaScript)
- Proxy server for secure IBM watsonx.ai API calls
- Containerized application using Docker

## Prerequisites

1. **IBM Cloud Account** - Sign up at https://cloud.ibm.com
2. **IBM watsonx.ai Access** - With API key and Project ID
3. **Docker Desktop** - Install from https://www.docker.com/products/docker-desktop
4. **IBM Cloud CLI** - Will be installed via the script

## Quick Start (Automated Deployment)

### Step 1: Wait for CLI Installation

The IBM Cloud CLI is currently being installed via Homebrew. This may take 5-10 minutes.

Check installation status:
```bash
which ibmcloud
```

If installed, you should see a path like `/opt/homebrew/bin/ibmcloud`

### Step 2: Run the Deployment Script

Once the CLI is installed, simply run:

```bash
cd /Users/claireliu/Desktop/aift-playbook-site-v10
./deploy-to-ibm-cloud.sh
```

The script will:
1. ✅ Check IBM Cloud CLI installation
2. 🔐 Log you into IBM Cloud (SSO)
3. 📦 Install required plugins (Code Engine, Container Registry)
4. 🏗️ Create Code Engine project
5. 🐳 Build Docker image
6. ☁️ Push image to IBM Cloud Container Registry
7. 🚀 Deploy application to Code Engine
8. ⚙️ Configure environment variables
9. 🌐 Provide you with the live URL

### Step 3: Provide Your Credentials

When prompted, enter:
- **IBM_API_KEY**: Your IBM Cloud API key for watsonx.ai
- **IBM_PROJECT_ID**: Your watsonx.ai project ID

## Manual Deployment (If Script Fails)

### 1. Install IBM Cloud CLI

If not already installed:
```bash
brew install ibm-cloud-cli
```

Or download from: https://cloud.ibm.com/docs/cli?topic=cli-getting-started

### 2. Login to IBM Cloud

```bash
ibmcloud login --sso
```

Follow the prompts to authenticate.

### 3. Install Required Plugins

```bash
ibmcloud plugin install code-engine
ibmcloud plugin install container-registry
```

### 4. Set Target Region

```bash
ibmcloud target -r us-south -g Default
```

### 5. Create Code Engine Project

```bash
ibmcloud ce project create --name aift-playbook
ibmcloud ce project select --name aift-playbook
```

### 6. Create Container Registry Namespace

```bash
ibmcloud cr namespace-add ${USER}-aift-playbook
ibmcloud cr login
```

### 7. Build and Push Docker Image

```bash
cd /Users/claireliu/Desktop/aift-playbook-site-v10

# Build the image
docker build -t us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest .

# Push to registry
docker push us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest
```

### 8. Deploy to Code Engine

```bash
ibmcloud ce app create --name aift-playbook-site \
  --image us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest \
  --env IBM_API_KEY=your_api_key_here \
  --env IBM_PROJECT_ID=your_project_id_here \
  --min-scale 1 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G \
  --port 8080
```

### 9. Get Your Application URL

```bash
ibmcloud ce app get --name aift-playbook-site
```

Look for the "URL" field in the output.

## Updating Your Deployment

To update your application after making changes:

```bash
cd /Users/claireliu/Desktop/aift-playbook-site-v10

# Rebuild image
docker build -t us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest .
docker push us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest

# Update the app
ibmcloud ce app update --name aift-playbook-site \
  --image us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest
```

Or simply run the deployment script again:
```bash
./deploy-to-ibm-cloud.sh
```

## Monitoring and Management

### View Application Logs

```bash
ibmcloud ce app logs --name aift-playbook-site --follow
```

### Check Application Status

```bash
ibmcloud ce app get --name aift-playbook-site
```

### List All Applications

```bash
ibmcloud ce app list
```

### Scale Your Application

```bash
ibmcloud ce app update --name aift-playbook-site \
  --min-scale 2 \
  --max-scale 5
```

### Update Environment Variables

```bash
ibmcloud ce app update --name aift-playbook-site \
  --env IBM_API_KEY=new_api_key \
  --env IBM_PROJECT_ID=new_project_id
```

## Troubleshooting

### Issue: "ibmcloud: command not found"

**Solution**: The CLI is still installing or not in PATH. Wait for installation to complete, then:
```bash
# Check if installed
brew list ibm-cloud-cli

# If installed, restart terminal or run:
source ~/.zshrc  # or ~/.bash_profile
```

### Issue: "Docker daemon not running"

**Solution**: Start Docker Desktop application.

### Issue: "Authentication failed"

**Solution**: 
```bash
ibmcloud logout
ibmcloud login --sso
```

### Issue: "Image push failed"

**Solution**: Ensure you're logged into Container Registry:
```bash
ibmcloud cr login
```

### Issue: "Application not responding"

**Solution**: Check logs for errors:
```bash
ibmcloud ce app logs --name aift-playbook-site
```

Common issues:
- Wrong environment variables
- Port mismatch (ensure proxy-server.js uses PORT env variable)
- Image build failed

### Issue: "Chatbot not working after deployment"

**Solution**: 
1. Check environment variables are set correctly
2. Verify IBM API credentials are valid
3. Check application logs for API errors
4. Ensure CORS is configured properly in proxy-server.js

## Cost Information

### IBM Cloud Code Engine Pricing

**Free Tier Includes:**
- First 100,000 vCPU-seconds per month
- First 200,000 GB-seconds of memory per month
- First 100,000 requests per month

**After Free Tier:**
- vCPU: $0.00003375 per vCPU-second
- Memory: $0.0000034 per GB-second
- Requests: $0.00000040 per request

**Estimated Monthly Cost for Low Traffic:**
- ~$0-5 per month for typical usage
- Scales automatically based on traffic

### IBM Container Registry Pricing

**Free Tier:**
- 500 MB storage
- 5 GB pull traffic per month

**After Free Tier:**
- Storage: $0.50 per GB per month
- Pull traffic: $0.09 per GB

### IBM watsonx.ai Pricing

Depends on your plan and token usage. Check your IBM Cloud billing dashboard.

## Security Best Practices

### 1. Never Commit Credentials

The `.env` file is in `.gitignore`. Never commit:
- IBM_API_KEY
- IBM_PROJECT_ID
- Any other sensitive credentials

### 2. Use Environment Variables

Always set credentials as environment variables in Code Engine, never hardcode them.

### 3. Rotate API Keys Regularly

Update your IBM API keys periodically:
```bash
ibmcloud ce app update --name aift-playbook-site \
  --env IBM_API_KEY=new_key
```

### 4. Monitor Access Logs

Regularly check application logs for suspicious activity:
```bash
ibmcloud ce app logs --name aift-playbook-site
```

### 5. Set Up Alerts

Configure IBM Cloud monitoring to alert you of:
- High error rates
- Unusual traffic patterns
- Resource usage spikes

## Next Steps After Deployment

1. **Test the Chatbot**
   - Visit your application URL
   - Open the chatbot
   - Send test messages
   - Verify responses are working

2. **Set Up Custom Domain** (Optional)
   - Purchase a domain
   - Configure DNS
   - Add custom domain in Code Engine

3. **Enable Monitoring**
   - Set up IBM Cloud Monitoring
   - Configure alerts
   - Track usage metrics

4. **Implement Rate Limiting**
   - Add rate limiting to prevent abuse
   - Configure in proxy-server.js

5. **Set Up CI/CD** (Optional)
   - Automate deployments with GitHub Actions
   - Deploy on every push to main branch

## Support and Resources

- **IBM Cloud Documentation**: https://cloud.ibm.com/docs
- **Code Engine Docs**: https://cloud.ibm.com/docs/codeengine
- **watsonx.ai Docs**: https://cloud.ibm.com/docs/watsonx-ai
- **IBM Cloud Support**: https://cloud.ibm.com/unifiedsupport/supportcenter

## Cleanup (Delete Deployment)

To remove your deployment and avoid charges:

```bash
# Delete the application
ibmcloud ce app delete --name aift-playbook-site

# Delete the project (optional)
ibmcloud ce project delete --name aift-playbook

# Delete container images (optional)
ibmcloud cr image-rm us.icr.io/${USER}-aift-playbook/aift-playbook-site:latest
```

---

**Ready to deploy?** Run `./deploy-to-ibm-cloud.sh` once the IBM Cloud CLI installation completes!