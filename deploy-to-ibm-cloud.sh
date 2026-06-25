#!/bin/bash

# AIFT Playbook - IBM Cloud Code Engine Deployment Script
# This script automates the deployment of the AIFT Playbook website to IBM Cloud Code Engine

set -e  # Exit on any error

echo "=========================================="
echo "AIFT Playbook - IBM Cloud Deployment"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="aift-playbook"
APP_NAME="aift-playbook-site"
REGION="us-south"
RESOURCE_GROUP="Default"

# Check if IBM Cloud CLI is installed
if ! command -v ibmcloud &> /dev/null; then
    echo -e "${RED}Error: IBM Cloud CLI is not installed.${NC}"
    echo "Please install it first:"
    echo "  brew install ibm-cloud-cli"
    exit 1
fi

echo -e "${GREEN}✓ IBM Cloud CLI found${NC}"

# Check if user is logged in
if ! ibmcloud target &> /dev/null; then
    echo -e "${YELLOW}You need to log in to IBM Cloud${NC}"
    echo "Running: ibmcloud login --sso"
    ibmcloud login --sso
else
    echo -e "${GREEN}✓ Already logged in to IBM Cloud${NC}"
fi

# Install Code Engine plugin if not already installed
if ! ibmcloud plugin list | grep -q "code-engine"; then
    echo -e "${YELLOW}Installing Code Engine plugin...${NC}"
    ibmcloud plugin install code-engine
else
    echo -e "${GREEN}✓ Code Engine plugin installed${NC}"
fi

# Install Container Registry plugin if not already installed
if ! ibmcloud plugin list | grep -q "container-registry"; then
    echo -e "${YELLOW}Installing Container Registry plugin...${NC}"
    ibmcloud plugin install container-registry
else
    echo -e "${GREEN}✓ Container Registry plugin installed${NC}"
fi

# Target the correct region and resource group
echo -e "${YELLOW}Setting target region to ${REGION}...${NC}"
ibmcloud target -r ${REGION} -g ${RESOURCE_GROUP}

# Create Code Engine project if it doesn't exist
echo -e "${YELLOW}Checking for Code Engine project...${NC}"
if ! ibmcloud ce project list | grep -q "${PROJECT_NAME}"; then
    echo -e "${YELLOW}Creating Code Engine project: ${PROJECT_NAME}${NC}"
    ibmcloud ce project create --name ${PROJECT_NAME}
else
    echo -e "${GREEN}✓ Project ${PROJECT_NAME} exists${NC}"
fi

# Select the project
echo -e "${YELLOW}Selecting project ${PROJECT_NAME}...${NC}"
ibmcloud ce project select --name ${PROJECT_NAME}

# Get IBM Cloud Container Registry namespace
REGISTRY_NAMESPACE="${USER}-${PROJECT_NAME}"
echo -e "${YELLOW}Setting up Container Registry namespace: ${REGISTRY_NAMESPACE}${NC}"

# Create namespace if it doesn't exist
if ! ibmcloud cr namespace-list | grep -q "${REGISTRY_NAMESPACE}"; then
    echo -e "${YELLOW}Creating Container Registry namespace...${NC}"
    ibmcloud cr namespace-add ${REGISTRY_NAMESPACE}
else
    echo -e "${GREEN}✓ Registry namespace exists${NC}"
fi

# Log in to Container Registry
echo -e "${YELLOW}Logging in to Container Registry...${NC}"
ibmcloud cr login

# Build and push Docker image
IMAGE_NAME="us.icr.io/${REGISTRY_NAMESPACE}/${APP_NAME}:latest"
echo -e "${YELLOW}Building Docker image: ${IMAGE_NAME}${NC}"
docker build -t ${IMAGE_NAME} .

echo -e "${YELLOW}Pushing image to IBM Cloud Container Registry...${NC}"
docker push ${IMAGE_NAME}

echo -e "${GREEN}✓ Image pushed successfully${NC}"

# Prompt for environment variables
echo ""
echo -e "${YELLOW}=========================================="
echo "Environment Variables Configuration"
echo "==========================================${NC}"
echo ""
echo "Please provide your IBM watsonx.ai credentials:"
echo ""

read -p "IBM_API_KEY: " IBM_API_KEY
read -p "IBM_PROJECT_ID: " IBM_PROJECT_ID

if [ -z "$IBM_API_KEY" ] || [ -z "$IBM_PROJECT_ID" ]; then
    echo -e "${RED}Error: Both IBM_API_KEY and IBM_PROJECT_ID are required${NC}"
    exit 1
fi

# Deploy or update the application
echo ""
echo -e "${YELLOW}Deploying application to Code Engine...${NC}"

if ibmcloud ce app list | grep -q "${APP_NAME}"; then
    echo -e "${YELLOW}Updating existing application...${NC}"
    ibmcloud ce app update --name ${APP_NAME} \
        --image ${IMAGE_NAME} \
        --env IBM_API_KEY=${IBM_API_KEY} \
        --env IBM_PROJECT_ID=${IBM_PROJECT_ID} \
        --min-scale 1 \
        --max-scale 3 \
        --cpu 0.25 \
        --memory 0.5G \
        --port 8080
else
    echo -e "${YELLOW}Creating new application...${NC}"
    ibmcloud ce app create --name ${APP_NAME} \
        --image ${IMAGE_NAME} \
        --env IBM_API_KEY=${IBM_API_KEY} \
        --env IBM_PROJECT_ID=${IBM_PROJECT_ID} \
        --min-scale 1 \
        --max-scale 3 \
        --cpu 0.25 \
        --memory 0.5G \
        --port 8080
fi

# Get the application URL
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""

APP_URL=$(ibmcloud ce app get --name ${APP_NAME} --output json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -n "$APP_URL" ]; then
    echo -e "${GREEN}✓ Your application is deployed at:${NC}"
    echo -e "${GREEN}  ${APP_URL}${NC}"
    echo ""
    echo "Testing the deployment..."
    sleep 5
    
    if curl -s -o /dev/null -w "%{http_code}" ${APP_URL} | grep -q "200"; then
        echo -e "${GREEN}✓ Application is responding successfully!${NC}"
    else
        echo -e "${YELLOW}⚠ Application deployed but may still be starting up${NC}"
        echo "  Please wait a minute and try accessing the URL"
    fi
else
    echo -e "${YELLOW}⚠ Could not retrieve application URL${NC}"
    echo "  Run: ibmcloud ce app get --name ${APP_NAME}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Next Steps:"
echo "==========================================${NC}"
echo "1. Visit your application URL above"
echo "2. Test the chatbot functionality"
echo "3. Monitor logs: ibmcloud ce app logs --name ${APP_NAME}"
echo "4. View app details: ibmcloud ce app get --name ${APP_NAME}"
echo ""
echo -e "${GREEN}Deployment script completed successfully!${NC}"

# Made with Bob
