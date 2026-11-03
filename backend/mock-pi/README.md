# EcoDrop Mock Pi Server

This is a FastAPI mock server that simulates the physical Raspberry Pi 5 inside an EcoDrop vending machine. It mocks out AI processing delays, hardware bin control, and provides WebSocket status updates to simulate a real deposit session.

## Setup and Running

1. **Install dependencies**:
   Make sure you have Python 3.8+ installed. Run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server**:
   Run the following command in this directory:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

3. **Accessing the server**:
   The server runs locally at `http://localhost:8000`. If you are connecting from a mobile app on the same Wi-Fi network, use your computer's local IP address (e.g., `http://192.168.1.100:8000`).

## Interactive API Docs

Once running, you can explore the API and test endpoints interactively by going to:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## How it works

1. The client (mobile app or machine UI) starts a session with `POST /session/start`.
2. It connects to the WebSocket at `ws://localhost:8000/ws/{session_id}`.
3. When an item is placed, `POST /session/{session_id}/item-detected` is called.
4. The server mocks a 3-second delay to simulate AI inference, then randomly picks an item from a predefined list and broadcasts the result over the WebSocket.
5. The client can then call `POST /session/{session_id}/confirm` (to accept the coins and open the bin) or `POST /session/{session_id}/reject` (to abort).
