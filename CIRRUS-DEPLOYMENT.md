# IBM Cirrus Cloud Foundry Deployment Guide

This guide provides step-by-step instructions for deploying the AIFT Playbook website to IBM Cirrus Cloud Foundry.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Steps](#deployment-steps)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Updating the Application](#updating-the-application)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Cirrus-Specific Tips](#cirrus-specific-tips)

## Prerequisites

### Required Tools
1. **Cloud Foundry CLI** - Install from [cloudfoundry.org](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
   ```bash
   # Verify installation
   cf --version
   ```

2. **IBM Cirrus Access** - Ensure you have:
   - IBM Cirrus account credentials
   - Access to the target organization and space
   - Necessary permissions to deploy applications

3. **IBM watsonx.ai Credentials**
   - IBM API Key
   - Project ID
   - Region (e.g., us-south, eu-gb)

### Verify Prerequisites
```bash
# Check CF CLI is installed
cf --version

# Check you're logged out (to start fresh)
cf logout
```

## Initial Setup

### 1. Login to IBM Cirrus
```bash
# Login to Cirrus Cloud Foundry
cf login -a https://api.cirrus.ibm.com

# You'll be prompted for:
# - Email
# - Password
# - Organization (select your org)
# - Space (select your space, e.g., dev, staging, production)
```

### 2. Verify Target
```bash
# Check your current target
cf target

# Should show:
# - API endpoint: https://api.cirrus.ibm.com
# - Org: your-org
# - Space: your-space
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# Make the script executable
chmod +x deploy-to-cirrus.sh

# Run the deployment script
./deploy-to-cirrus.sh
```

The script will:
1. Check if CF CLI is installed
2. Verify you're logged in
3. Push the application
4. Prompt for environment variables
5. Display the application URL

### Option 2: Manual Deployment

#### Step 1: Push the Application
```bash
# From the project root directory
cf push aift-playbook

# This will:
# - Read manifest.yml for configuration
# - Upload application files (excluding .cfignore)
# - Stage the application with nodejs_buildpack
# - Start the application
```

#### Step 2: Set Environment Variables
```bash
# Set IBM watsonx.ai credentials
cf set-env aift-playbook IBM_API_KEY "your-api-key-here"
cf set-env aift-playbook IBM_PROJECT_ID "your-project-id-here"
cf set-env aift-playbook IBM_REGION "us-south"

# Restage the application to apply changes
cf restage aift-playbook
```

#### Step 3: Verify Deployment
```bash
# Check application status
cf app aift-playbook

# Should show:
# - State: running
# - Instances: 1/1
# - Memory: 512M
# - URL: aift-playbook.cirrus.ibm.com
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `IBM_API_KEY` | IBM Cloud API key for watsonx.ai | `your-api-key` |
| `IBM_PROJECT_ID` | watsonx.ai project ID | `your-project-id` |
| `IBM_REGION` | IBM Cloud region | `us-south` |

### Setting Environment Variables

```bash
# Set a single variable
cf set-env aift-playbook VARIABLE_NAME "value"

# View all environment variables
cf env aift-playbook

# Remove a variable (if needed)
cf unset-env aift-playbook VARIABLE_NAME

# After setting/changing variables, restage the app
cf restage aift-playbook
```

### Using manifest.yml Variables

The `manifest.yml` uses variable placeholders `((VARIABLE_NAME))`. You can:

1. **Set via CF CLI** (as shown above)
2. **Use a vars file**:
   ```bash
   # Create vars.yml (DO NOT commit this file!)
   IBM_API_KEY: your-api-key
   IBM_PROJECT_ID: your-project-id
   IBM_REGION: us-south
   
   # Deploy with vars file
   cf push --vars-file vars.yml
   ```

## Post-Deployment

### 1. Access Your Application
```bash
# Get the application URL
cf app aift-playbook

# Open in browser
open https://aift-playbook.cirrus.ibm.com
```

### 2. Test the Chatbot
- Navigate to the website
- Open the chatbot interface
- Send a test message
- Verify responses from watsonx.ai

### 3. Check Health
```bash
# View application health
cf app aift-playbook

# Check recent logs
cf logs aift-playbook --recent
```

## Updating the Application

### Update Code and Redeploy
```bash
# Make your code changes locally

# Push the updated application
cf push aift-playbook

# Or use zero-downtime deployment
cf push aift-playbook --strategy rolling
```

### Update Environment Variables
```bash
# Update a variable
cf set-env aift-playbook IBM_API_KEY "new-api-key"

# Restage to apply changes
cf restage aift-playbook
```

### Scale the Application
```bash
# Scale instances
cf scale aift-playbook -i 2

# Scale memory
cf scale aift-playbook -m 1G

# Scale both
cf scale aift-playbook -i 3 -m 1G
```

## Monitoring and Logs

### View Logs
```bash
# Stream live logs
cf logs aift-playbook

# View recent logs
cf logs aift-playbook --recent

# Filter logs by source
cf logs aift-playbook | grep "APP"
cf logs aift-playbook | grep "RTR"
```

### Application Events
```bash
# View recent events
cf events aift-playbook
```

### Application Statistics
```bash
# View app stats (CPU, memory, disk)
cf app aift-playbook
```

### SSH into Container (for debugging)
```bash
# Enable SSH
cf enable-ssh aift-playbook
cf restart aift-playbook

# SSH into the container
cf ssh aift-playbook

# Inside the container:
# - Check files: ls -la
# - View logs: cat logs/stdout.log
# - Check processes: ps aux
# - Exit: exit
```

## Troubleshooting

### Application Won't Start

**Problem**: App crashes on startup

**Solutions**:
```bash
# Check logs for errors
cf logs aift-playbook --recent

# Common issues:
# 1. Missing dependencies
#    - Ensure package.json is correct
#    - Check buildpack logs

# 2. Port binding issues
#    - App must listen on process.env.PORT
#    - Check proxy-server.js

# 3. Missing environment variables
#    - Verify all required vars are set
cf env aift-playbook
```

### Health Check Failures

**Problem**: App keeps restarting

**Solutions**:
```bash
# Check health check endpoint
curl https://aift-playbook.cirrus.ibm.com/

# Increase timeout in manifest.yml
timeout: 180

# Change health check type if needed
health-check-type: process  # or http
```

### Memory Issues

**Problem**: App crashes due to memory

**Solutions**:
```bash
# Check memory usage
cf app aift-playbook

# Increase memory allocation
cf scale aift-playbook -m 1G

# Or update manifest.yml
memory: 1G
```

### Environment Variable Issues

**Problem**: Chatbot not working, API errors

**Solutions**:
```bash
# Verify environment variables are set
cf env aift-playbook

# Check for typos in variable names
# Ensure values are correct (no extra quotes/spaces)

# Reset variables
cf set-env aift-playbook IBM_API_KEY "correct-value"
cf restage aift-playbook
```

### Route/URL Issues

**Problem**: Can't access the application

**Solutions**:
```bash
# Check routes
cf routes

# Map a new route if needed
cf map-route aift-playbook cirrus.ibm.com --hostname aift-playbook

# Unmap old route
cf unmap-route aift-playbook cirrus.ibm.com --hostname old-name
```

### Buildpack Issues

**Problem**: Staging fails

**Solutions**:
```bash
# Specify buildpack explicitly
cf push aift-playbook -b nodejs_buildpack

# Or use a specific version
cf push aift-playbook -b https://github.com/cloudfoundry/nodejs-buildpack

# Check buildpack logs
cf logs aift-playbook --recent | grep "STG"
```

## Cirrus-Specific Tips

### 1. Organization and Space Management
```bash
# List all orgs you have access to
cf orgs

# List spaces in current org
cf spaces

# Switch to a different space
cf target -s production
```

### 2. Service Bindings
If you need to bind IBM Cloud services:
```bash
# List available services
cf marketplace

# Create a service instance
cf create-service service-name plan-name my-service

# Bind to your app
cf bind-service aift-playbook my-service

# Restage to apply
cf restage aift-playbook
```

### 3. Quotas and Limits
```bash
# Check your space quota
cf space-quota default

# Common Cirrus limits:
# - Memory: varies by org
# - Routes: varies by org
# - Services: varies by org
```

### 4. Security Groups
```bash
# View security groups
cf security-groups

# Check which groups apply to your space
cf running-security-groups
cf staging-security-groups
```

### 5. Best Practices for Cirrus

1. **Use Staging and Production Spaces**
   - Deploy to staging first
   - Test thoroughly
   - Then deploy to production

2. **Monitor Resource Usage**
   - Keep an eye on memory and CPU
   - Scale appropriately
   - Use `cf app` regularly

3. **Implement Health Checks**
   - Use HTTP health checks
   - Ensure endpoint responds quickly
   - Return 200 status code

4. **Use Rolling Deployments**
   - For zero-downtime updates
   - `cf push --strategy rolling`

5. **Keep Logs**
   - Stream logs to external service if needed
   - Use `cf logs` for debugging
   - Check logs regularly

6. **Secure Environment Variables**
   - Never commit credentials
   - Use CF CLI to set variables
   - Rotate keys regularly

## Quick Reference

### Common Commands
```bash
# Login
cf login -a https://api.cirrus.ibm.com

# Deploy
cf push aift-playbook

# View status
cf app aift-playbook

# View logs
cf logs aift-playbook --recent

# Set env var
cf set-env aift-playbook VAR_NAME "value"
cf restage aift-playbook

# Scale
cf scale aift-playbook -i 2 -m 1G

# Restart
cf restart aift-playbook

# Stop
cf stop aift-playbook

# Start
cf start aift-playbook

# Delete
cf delete aift-playbook
```

### Useful Links
- [Cloud Foundry CLI Reference](https://cli.cloudfoundry.org/en-US/v8/)
- [IBM Cirrus Documentation](https://pages.github.ibm.com/cirrus/)
- [Cloud Foundry Buildpacks](https://docs.cloudfoundry.org/buildpacks/)
- [IBM watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CF logs: `cf logs aift-playbook --recent`
3. Contact your IBM Cirrus administrator
4. Consult IBM watsonx.ai support for API issues

---

**Last Updated**: 2026-06-24
**Version**: 1.0.0