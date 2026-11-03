# EcoDrop Backend

This directory contains the backend resources for the EcoDrop project:
1. `supabase_schema.sql` - Complete PostgreSQL schema for Supabase.
2. `mock-pi/` - FastAPI server mocking the physical Raspberry Pi 5 hardware.

## 1. Supabase Setup

EcoDrop uses Supabase as its primary Backend-as-a-Service (BaaS) for Auth, Database, and Storage.

### Steps to set up:
1. Go to [Supabase](https://supabase.com) and create a new project.
2. In the project dashboard, go to the **SQL Editor**.
3. Copy the contents of `supabase_schema.sql` and run it in the SQL Editor.
   - This script creates all tables, Row Level Security (RLS) policies, indexes, leaderboards views, and initial seed data for machines and rewards.
   - It also creates triggers to automatically update a user's `coins_balance` when transactions or redemptions occur.
4. Go to **Project Settings -> API** to get your:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### Environment Variables for Mobile App:
The mobile app (Flutter/React Native) will need these environment variables:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Mock Pi Server

Since the physical Raspberry Pi hardware with camera and motors isn't always available during app development, we use a mock server that simulates its behavior, including AI detection and bin operations.

### Running the server locally:

1. Navigate to the `mock-pi` directory:
   ```bash
   cd mock-pi
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   The server will run at `http://127.0.0.1:8000` or `http://localhost:8000`.

### API Endpoints:

- `GET /health` - Check if machine is online
- `GET /machine/info` - Get machine details
- `GET /machine/stats` - Get overall machine stats
- `POST /session/start` - Start a new deposit session
- `POST /session/{id}/item-detected` - Trigger AI analysis (takes 3s, returns mock item result)
- `GET /session/{id}/result` - Get result of AI analysis
- `GET /session/{id}/status` - Get current session status
- `POST /session/{id}/confirm` - Confirm deposit (simulates bin opening)
- `POST /session/{id}/reject` - Reject the current item
- `WS /ws/{session_id}` - WebSocket for real-time session updates

## 3. Connecting the Mobile App

1. Ensure both the mobile device/emulator and the computer running the mock Pi server are on the same network.
2. Use the local IP address of the computer running the mock server (e.g., `192.168.1.5:8000`) instead of `localhost` in the mobile app.
3. The app will communicate with Supabase using its SDK and send HTTP/WebSocket requests to the mock Pi server for deposit sessions.
