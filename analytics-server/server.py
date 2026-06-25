#!/usr/bin/env python3
"""
Simple Analytics Server for AIFT Playbook
Collects and stores analytics data from all visitors
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
import sqlite3
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DATA_DIR = Path(__file__).parent / 'data'
DB_PATH = DATA_DIR / 'analytics.db'

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# Initialize database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Page views table
    c.execute('''
        CREATE TABLE IF NOT EXISTS page_views (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            page TEXT NOT NULL,
            title TEXT,
            timestamp TEXT NOT NULL,
            time_spent INTEGER DEFAULT 0,
            referrer TEXT,
            user_agent TEXT,
            screen_width INTEGER,
            screen_height INTEGER
        )
    ''')
    
    # Sessions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            start_time TEXT NOT NULL,
            last_activity TEXT NOT NULL
        )
    ''')
    
    # Events table
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            category TEXT NOT NULL,
            action TEXT NOT NULL,
            label TEXT,
            value INTEGER,
            page TEXT,
            timestamp TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

@app.route('/api/track/pageview', methods=['POST'])
def track_pageview():
    """Record a page view"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('''
            INSERT OR REPLACE INTO page_views 
            (id, session_id, page, title, timestamp, time_spent, referrer, user_agent, screen_width, screen_height)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('id'),
            data.get('sessionId'),
            data.get('page'),
            data.get('title'),
            data.get('timestamp'),
            data.get('timeSpent', 0),
            data.get('referrer'),
            data.get('userAgent'),
            data.get('screenWidth'),
            data.get('screenHeight')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/track/session', methods=['POST'])
def track_session():
    """Record or update a session"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('''
            INSERT OR REPLACE INTO sessions (id, start_time, last_activity)
            VALUES (?, ?, ?)
        ''', (
            data.get('id'),
            data.get('startTime'),
            data.get('lastActivity')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/track/event', methods=['POST'])
def track_event():
    """Record an event"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO events (id, session_id, category, action, label, value, page, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('id'),
            data.get('sessionId'),
            data.get('category'),
            data.get('action'),
            data.get('label'),
            data.get('value'),
            data.get('page'),
            data.get('timestamp')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get analytics statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Total counts
        c.execute('SELECT COUNT(*) FROM page_views')
        total_pageviews = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM sessions')
        total_sessions = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM events')
        total_events = c.fetchone()[0]
        
        # Last 7 days
        c.execute('''
            SELECT COUNT(*) FROM page_views 
            WHERE datetime(timestamp) > datetime('now', '-7 days')
        ''')
        pageviews_7d = c.fetchone()[0]
        
        c.execute('''
            SELECT COUNT(*) FROM sessions 
            WHERE datetime(start_time) > datetime('now', '-7 days')
        ''')
        sessions_7d = c.fetchone()[0]
        
        c.execute('''
            SELECT COUNT(DISTINCT session_id) FROM page_views 
            WHERE datetime(timestamp) > datetime('now', '-7 days')
        ''')
        unique_visitors_7d = c.fetchone()[0]
        
        # Last 30 days
        c.execute('''
            SELECT COUNT(*) FROM page_views 
            WHERE datetime(timestamp) > datetime('now', '-30 days')
        ''')
        pageviews_30d = c.fetchone()[0]
        
        c.execute('''
            SELECT COUNT(*) FROM sessions 
            WHERE datetime(start_time) > datetime('now', '-30 days')
        ''')
        sessions_30d = c.fetchone()[0]
        
        c.execute('''
            SELECT COUNT(DISTINCT session_id) FROM page_views 
            WHERE datetime(timestamp) > datetime('now', '-30 days')
        ''')
        unique_visitors_30d = c.fetchone()[0]
        
        # Top pages
        c.execute('''
            SELECT page, COUNT(*) as views, AVG(time_spent) as avg_time
            FROM page_views
            GROUP BY page
            ORDER BY views DESC
            LIMIT 10
        ''')
        top_pages = [
            {'page': row[0], 'views': row[1], 'avgTime': int(row[2] or 0)}
            for row in c.fetchall()
        ]
        
        # Recent page views
        c.execute('''
            SELECT page, title, timestamp, time_spent
            FROM page_views
            ORDER BY timestamp DESC
            LIMIT 20
        ''')
        recent_pageviews = [
            {
                'page': row[0],
                'title': row[1],
                'timestamp': row[2],
                'timeSpent': row[3]
            }
            for row in c.fetchall()
        ]
        
        conn.close()
        
        return jsonify({
            'total': {
                'pageViews': total_pageviews,
                'sessions': total_sessions,
                'events': total_events
            },
            'last7Days': {
                'pageViews': pageviews_7d,
                'sessions': sessions_7d,
                'uniqueVisitors': unique_visitors_7d
            },
            'last30Days': {
                'pageViews': pageviews_30d,
                'sessions': sessions_30d,
                'uniqueVisitors': unique_visitors_30d
            },
            'topPages': top_pages,
            'recentPageViews': recent_pageviews
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export all analytics data"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Get all data
        c.execute('SELECT * FROM page_views')
        pageviews = c.fetchall()
        
        c.execute('SELECT * FROM sessions')
        sessions = c.fetchall()
        
        c.execute('SELECT * FROM events')
        events = c.fetchall()
        
        conn.close()
        
        return jsonify({
            'pageViews': pageviews,
            'sessions': sessions,
            'events': events,
            'exportDate': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    print("🚀 Analytics Server Starting...")
    print(f"📊 Database: {DB_PATH}")
    print(f"🌐 Server: http://localhost:5000")
    print(f"📈 Dashboard: http://localhost:8015/analytics-dashboard.html")
    print("\nPress Ctrl+C to stop")
    app.run(host='0.0.0.0', port=5000, debug=True)

# Made with Bob
