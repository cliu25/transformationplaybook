#!/bin/bash

# IBM Cirrus Cloud Foundry Deployment Script
# This script automates the deployment of the AIFT Playbook website to IBM Cirrus

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check if CF CLI is installed
check_cf_cli() {
    print_header "Checking Prerequisites"
    
    if ! command -v cf &> /dev/null; then
        print_error "Cloud Foundry CLI is not installed"
        echo ""
        echo "Please install CF CLI from:"
        echo "https://docs.cloudfoundry.org/cf-cli/install-go-cli.html"
        echo ""
        echo "macOS: brew install cloudfoundry/tap/cf-cli@8"
        echo "Linux: Download from the link above"
        exit 1
    fi
    
    print_success "Cloud Foundry CLI is installed"
    cf --version
}

# Check if logged in to Cirrus
check_login() {
    print_header "Checking Cirrus Login Status"
    
    if ! cf target &> /dev/null; then
        print_warning "Not logged in to IBM Cirrus"
        echo ""
        print_info "Logging in to IBM Cirrus Cloud Foundry..."
        echo ""
        
        cf login -a https://api.cirrus.ibm.com
        
        if [ $? -ne 0 ]; then
            print_error "Login failed"
            exit 1
        fi
    else
        print_success "Already logged in to IBM Cirrus"
        echo ""
        cf target
    fi
}

# Confirm deployment
confirm_deployment() {
    print_header "Deployment Confirmation"
    
    echo "You are about to deploy to:"
    cf target
    echo ""
    
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
}

# Push the application
push_application() {
    print_header "Deploying Application"
    
    print_info "Pushing application to IBM Cirrus..."
    echo ""
    
    if cf push aift-playbook; then
        print_success "Application deployed successfully"
    else
        print_error "Deployment failed"
        echo ""
        print_info "Check logs with: cf logs aift-playbook --recent"
        exit 1
    fi
}

# Set environment variables
set_environment_variables() {
    print_header "Environment Variables Configuration"
    
    print_info "Checking if environment variables are set..."
    
    # Check if variables are already set
    if cf env aift-playbook | grep -q "IBM_API_KEY"; then
        print_success "Environment variables are already configured"
        echo ""
        read -p "Do you want to update them? (y/n) " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment variable configuration"
            return
        fi
    fi
    
    echo ""
    print_warning "You need to set the following environment variables:"
    echo "  - IBM_API_KEY: Your IBM Cloud API key"
    echo "  - IBM_PROJECT_ID: Your watsonx.ai project ID"
    echo "  - IBM_REGION: IBM Cloud region (e.g., us-south)"
    echo ""
    
    read -p "Do you want to set them now? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter IBM_API_KEY: " IBM_API_KEY
        read -p "Enter IBM_PROJECT_ID: " IBM_PROJECT_ID
        read -p "Enter IBM_REGION (default: us-south): " IBM_REGION
        IBM_REGION=${IBM_REGION:-us-south}
        
        echo ""
        print_info "Setting environment variables..."
        
        cf set-env aift-playbook IBM_API_KEY "$IBM_API_KEY"
        cf set-env aift-playbook IBM_PROJECT_ID "$IBM_PROJECT_ID"
        cf set-env aift-playbook IBM_REGION "$IBM_REGION"
        
        print_success "Environment variables set"
        echo ""
        print_info "Restaging application to apply changes..."
        
        if cf restage aift-playbook; then
            print_success "Application restaged successfully"
        else
            print_error "Restaging failed"
            exit 1
        fi
    else
        print_warning "Environment variables not set"
        echo ""
        print_info "You can set them later with:"
        echo "  cf set-env aift-playbook IBM_API_KEY \"your-api-key\""
        echo "  cf set-env aift-playbook IBM_PROJECT_ID \"your-project-id\""
        echo "  cf set-env aift-playbook IBM_REGION \"us-south\""
        echo "  cf restage aift-playbook"
    fi
}

# Display application info
display_app_info() {
    print_header "Deployment Complete"
    
    print_success "Application is running!"
    echo ""
    
    # Get app info
    APP_URL=$(cf app aift-playbook | grep "routes:" | awk '{print $2}')
    
    if [ -n "$APP_URL" ]; then
        print_info "Application URL: https://${APP_URL}"
        echo ""
    fi
    
    print_info "Application Status:"
    cf app aift-playbook
    
    echo ""
    print_info "Useful Commands:"
    echo "  View logs:        cf logs aift-playbook --recent"
    echo "  Stream logs:      cf logs aift-playbook"
    echo "  Restart app:      cf restart aift-playbook"
    echo "  Scale app:        cf scale aift-playbook -i 2 -m 1G"
    echo "  SSH into app:     cf ssh aift-playbook"
    echo "  View env vars:    cf env aift-playbook"
    echo ""
    
    if [ -n "$APP_URL" ]; then
        read -p "Open application in browser? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://${APP_URL}" 2>/dev/null || xdg-open "https://${APP_URL}" 2>/dev/null || echo "Please open https://${APP_URL} in your browser"
        fi
    fi
}

# Main deployment flow
main() {
    print_header "IBM Cirrus Deployment Script"
    print_info "AIFT Playbook Website Deployment"
    
    # Run deployment steps
    check_cf_cli
    check_login
    confirm_deployment
    push_application
    set_environment_variables
    display_app_info
    
    print_success "Deployment process completed!"
}

# Run main function
main

# Made with Bob
