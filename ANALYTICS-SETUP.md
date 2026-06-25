# Analytics Setup Guide

This guide explains how to set up Google Analytics 4 (GA4) tracking for the AIFT Playbook website.

## Overview

The AIFT Playbook includes built-in analytics tracking to help you understand how users interact with the content. Analytics tracking is:

- **Privacy-focused**: IP addresses are anonymized
- **Optional**: Works without configuration (tracking is disabled until you add your Measurement ID)
- **Comprehensive**: Tracks page views, user engagement, and playbook-specific interactions
- **Free**: Uses Google Analytics 4, which is free for most use cases

## What Data is Tracked?

### Automatic Tracking
- **Page views**: Every page load
- **Session duration**: How long users spend on the site
- **User demographics**: Country, device type, browser (anonymized)
- **Scroll depth**: How far users scroll (25%, 50%, 75%, 100%)
- **External link clicks**: When users click links to external sites

### Custom Playbook Events
- **Phase navigation**: Which phases users visit
- **Module interactions**: Which modules/chapters are clicked
- **Chatbot usage**: 
  - Chatbot open/close
  - Messages sent
  - Conversation cleared
- **Search queries**: What users search for and results count
- **Time on phase**: How long users spend on each phase
- **Artifact downloads**: Which templates/guides are downloaded

## Setup Instructions

### Step 1: Create a Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon in bottom left)
4. Click **Create Property**
5. Enter property details:
   - **Property name**: "AIFT Playbook" (or your preferred name)
   - **Reporting time zone**: Select your time zone
   - **Currency**: Select your currency
6. Click **Next**
7. Fill in business details (optional)
8. Click **Create**
9. Accept the Terms of Service

### Step 2: Get Your Measurement ID

1. In the Admin panel, under **Property**, click **Data Streams**
2. Click **Add stream** → **Web**
3. Enter your website details:
   - **Website URL**: Your GitHub Pages URL (e.g., `https://yourusername.github.io/aift-playbook`)
   - **Stream name**: "AIFT Playbook Website"
4. Click **Create stream**
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Configure the Website

1. Open `index.html` in your code editor
2. Find the Google Analytics section in the `<head>` tag (around line 8-20)
3. Replace **both instances** of `G-XXXXXXXXXX` with your actual Measurement ID:

```html
<!-- Google Analytics 4 -->
<!-- Replace G-XXXXXXXXXX with your actual GA4 Measurement ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ACTUAL-ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    
    // Configure GA4 with your measurement ID
    gtag('config', 'G-YOUR-ACTUAL-ID', {
        'send_page_view': true,
        'anonymize_ip': true  // Privacy: anonymize IP addresses
    });
</script>
```

4. Save the file
5. Commit and push to GitHub:
```bash
git add index.html
git commit -m "Configure Google Analytics tracking"
git push origin main
```

### Step 4: Verify Tracking is Working

1. Wait 5-10 minutes for GitHub Pages to deploy your changes
2. Visit your website
3. In Google Analytics:
   - Go to **Reports** → **Realtime**
   - You should see yourself as an active user
   - Navigate through different phases to see events appear

## Using Analytics Data

### View Real-Time Data
- **Reports** → **Realtime**: See current active users and their activity

### View Historical Data
- **Reports** → **Engagement** → **Pages and screens**: See most visited pages
- **Reports** → **Engagement** → **Events**: See all tracked events
- **Reports** → **User attributes** → **Overview**: See user demographics

### Custom Reports for Playbook Insights

#### Most Popular Phases
1. Go to **Reports** → **Engagement** → **Events**
2. Click on `phase_view` event
3. View by `phase_name` dimension

#### Module Engagement
1. Go to **Reports** → **Engagement** → **Events**
2. Click on `module_click` event
3. View by `module_name` dimension

#### Chatbot Usage
1. Go to **Reports** → **Engagement** → **Events**
2. Click on `chatbot_interaction` event
3. View by `action` dimension

#### Search Behavior
1. Go to **Reports** → **Engagement** → **Events**
2. Click on `search` event
3. View by `search_term` dimension

## Privacy Considerations

### What We Do to Protect Privacy
- **IP Anonymization**: Enabled by default (`anonymize_ip: true`)
- **No Personal Data**: We don't collect names, emails, or other personal information
- **Cookie Consent**: Consider adding a cookie consent banner if required by your jurisdiction
- **Data Retention**: Set in Google Analytics (default is 14 months)

### GDPR Compliance
If your users are in the EU, you should:
1. Add a cookie consent banner
2. Update your privacy policy
3. Configure data retention settings in GA4
4. Consider using Google Consent Mode

### Disabling Analytics
To completely disable analytics:
1. Remove or comment out the Google Analytics script in `index.html`
2. Or simply don't configure a Measurement ID (tracking is disabled by default)

## Troubleshooting

### Analytics Not Working
1. **Check Measurement ID**: Ensure you replaced both instances of `G-XXXXXXXXXX`
2. **Check Browser Console**: Open DevTools → Console, look for analytics messages
3. **Ad Blockers**: Some ad blockers prevent analytics. Test in incognito mode
4. **Wait Time**: Data can take 24-48 hours to appear in standard reports (use Realtime for immediate feedback)

### Events Not Appearing
1. **Check Console**: Look for `[Analytics]` log messages
2. **Verify gtag**: Open console and type `typeof gtag` - should return `"function"`
3. **Test Events**: Use the browser console:
```javascript
AIFTAnalytics.trackPhaseView('Test Phase', 'test-id');
```

### Debug Mode
To see detailed analytics information:
1. Open browser DevTools → Console
2. Look for messages starting with `[Analytics]`
3. These show when events are tracked

## Advanced Configuration

### Custom Dimensions
You can add custom dimensions in GA4 to track additional data:
1. Go to **Admin** → **Custom definitions**
2. Click **Create custom dimension**
3. Add dimensions like `user_role`, `organization`, etc.

### Enhanced Measurement
GA4 automatically tracks some events. To configure:
1. Go to **Admin** → **Data Streams** → Select your stream
2. Click **Enhanced measurement**
3. Toggle features on/off

### Data Retention
To change how long data is stored:
1. Go to **Admin** → **Data Settings** → **Data Retention**
2. Select retention period (2 months to 14 months)

## Integration with Other Tools

### Google Tag Manager (Optional)
For more advanced tracking, you can use Google Tag Manager:
1. Create a GTM account
2. Replace the GA4 script with GTM script
3. Configure GA4 tag in GTM

### Export to BigQuery (Optional)
For advanced analysis:
1. Go to **Admin** → **Product Links** → **BigQuery Links**
2. Link your GA4 property to BigQuery
3. Query data using SQL

## Support

### Resources
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [Privacy & Compliance](https://support.google.com/analytics/topic/2919631)

### Custom Event Reference
All custom events are defined in `js/analytics.js`. Available functions:

```javascript
// Track phase view
AIFTAnalytics.trackPhaseView('Phase Name', 'phase-id');

// Track module click
AIFTAnalytics.trackModuleClick('Module Name', 'module-id', 'Phase Name');

// Track chatbot interaction
AIFTAnalytics.trackChatbotInteraction('open');
AIFTAnalytics.trackChatbotInteraction('send_message', { message_length: 50 });

// Track search
AIFTAnalytics.trackSearch('search query', 5);

// Track external link
AIFTAnalytics.trackExternalLink('https://example.com', 'Link Text');

// Track time on phase
AIFTAnalytics.trackTimeOnPhase('Phase Name', 120);

// Track scroll depth
AIFTAnalytics.trackScrollDepth(75);

// Track artifact download
AIFTAnalytics.trackArtifactDownload('Template Name', 'template');

// Check if analytics is enabled
if (AIFTAnalytics.isEnabled()) {
    console.log('Analytics is active');
}
```

## Questions?

If you have questions about analytics setup or need help interpreting the data, please reach out to the AIFT Domain Orchestration Team.

---

**Last Updated**: June 2026  
**Version**: 1.0