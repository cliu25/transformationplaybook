# Analytics Server Setup Guide

This is a simple Flask-based analytics server that collects visitor data from the AIFT Playbook site.

## Features

- ✅ Tracks page views, sessions, and events from all visitors
- ✅ Stores data in SQLite database
- ✅ Provides REST API for data collection
- ✅ Works behind w3 authentication
- ✅ Centralized dashboard showing all visitor data

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

## Installation

### 1. Install Dependencies

```bash
cd analytics-server
pip3 install -r requirements.txt
```

Or install manually:

```bash
pip3 install Flask==3.0.0 Flask-CORS==4.0.0
```

### 2. Start the Server

```bash
python3 server.py
```

The server will start on `http://localhost:5000`

You should see:
```
🚀 Analytics Server Starting...
📊 Database: /path/to/analytics-server/data/analytics.db
🌐 Server: http://localhost:5000
📈 Dashboard: http://localhost:8015/analytics-dashboard.html

Press Ctrl+C to stop
```

### 3. Configure the Frontend

The analytics tracking is already configured in `js/analytics.js`:

```javascript
this.apiEndpoint = 'http://localhost:5000/api';
this.useBackend = true;
```

For production, update the `apiEndpoint` to your server URL.

## API Endpoints

### POST /api/track/pageview
Record a page view
```json
{
  "id": "unique-id",
  "sessionId": "session-id",
  "page": "/overview",
  "title": "Overview",
  "timestamp": "2026-06-25T20:00:00.000Z",
  "timeSpent": 45,
  "referrer": "",
  "userAgent": "Mozilla/5.0...",
  "screenWidth": 1920,
  "screenHeight": 1080
}
```

### POST /api/track/session
Record or update a session
```json
{
  "id": "session-id",
  "startTime": "2026-06-25T20:00:00.000Z",
  "lastActivity": "2026-06-25T20:05:00.000Z"
}
```

### POST /api/track/event
Record a custom event
```json
{
  "id": "event-id",
  "sessionId": "session-id",
  "category": "navigation",
  "action": "click",
  "label": "module-link",
  "value": null,
  "page": "/overview",
  "timestamp": "2026-06-25T20:00:00.000Z"
}
```

### GET /api/stats
Get analytics statistics
```json
{
  "total": {
    "pageViews": 150,
    "sessions": 45,
    "events": 200
  },
  "last7Days": {
    "pageViews": 80,
    "sessions": 25,
    "uniqueVisitors": 20
  },
  "last30Days": {
    "pageViews": 140,
    "sessions": 42,
    "uniqueVisitors": 35
  },
  "topPages": [
    {"page": "/overview", "views": 50, "avgTime": 120}
  ],
  "recentPageViews": [...]
}
```

### GET /api/export
Export all analytics data as JSON

### GET /health
Health check endpoint

## Database

Data is stored in SQLite database at `analytics-server/data/analytics.db`

### Tables:
- **page_views**: All page view records
- **sessions**: User session data
- **events**: Custom event tracking

## Viewing Analytics

### Option 1: Web Dashboard
Visit: `http://localhost:8015/analytics-dashboard.html`

The dashboard shows:
- Total page views, sessions, and events
- 7-day and 30-day statistics
- Unique visitor counts
- Top pages with average time
- Recent activity feed

### Option 2: Direct Database Access

```bash
cd analytics-server/data
sqlite3 analytics.db

# View page views
SELECT * FROM page_views ORDER BY timestamp DESC LIMIT 10;

# View sessions
SELECT * FROM sessions ORDER BY start_time DESC;

# View top pages
SELECT page, COUNT(*) as views, AVG(time_spent) as avg_time
FROM page_views
GROUP BY page
ORDER BY views DESC;
```

## Production Deployment

### 1. Update Configuration

In `js/analytics.js`, change:
```javascript
this.apiEndpoint = 'https://your-server.com/api';
```

In `analytics-dashboard.html`, change:
```javascript
const API_ENDPOINT = 'https://your-server.com/api';
```

### 2. Use Production WSGI Server

Don't use Flask's built-in server in production. Use Gunicorn:

```bash
pip3 install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### 3. Set Up Reverse Proxy

Use Nginx or Apache to proxy requests to the Flask server.

Example Nginx configuration:
```nginx
location /api {
    proxy_pass http://localhost:5000/api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 4. Enable HTTPS

Use Let's Encrypt or your organization's SSL certificates.

### 5. Set Up Systemd Service (Linux)

Create `/etc/systemd/system/analytics-server.service`:
```ini
[Unit]
Description=Analytics Server
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/analytics-server
ExecStart=/usr/bin/gunicorn -w 4 -b 127.0.0.1:5000 server:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable analytics-server
sudo systemctl start analytics-server
```

## Troubleshooting

### Server won't start
- Check if port 5000 is already in use: `lsof -i :5000`
- Verify Python and Flask are installed: `python3 --version` and `pip3 list | grep Flask`

### No data appearing
- Check browser console for errors
- Verify `useBackend` is set to `true` in `js/analytics.js`
- Check server logs for incoming requests
- Verify CORS is enabled (Flask-CORS installed)

### Database errors
- Ensure `analytics-server/data/` directory exists and is writable
- Check database file permissions
- Try deleting `analytics.db` to recreate it

## Security Considerations

1. **Authentication**: Add authentication to the API endpoints in production
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all incoming data
4. **HTTPS**: Always use HTTPS in production
5. **Database Backups**: Regularly backup the SQLite database

## Maintenance

### Backup Database
```bash
cp analytics-server/data/analytics.db analytics-server/data/analytics.db.backup
```

### Clear Old Data
```bash
sqlite3 analytics-server/data/analytics.db
DELETE FROM page_views WHERE datetime(timestamp) < datetime('now', '-90 days');
DELETE FROM sessions WHERE datetime(start_time) < datetime('now', '-90 days');
VACUUM;
```

## Support

For issues or questions, contact the development team.