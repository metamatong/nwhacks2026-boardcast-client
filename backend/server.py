from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from whiteboard_processor import WhiteboardProcessor
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store processors per room
processors = {}
processor_locks = {}

def get_processor(room_id: str) -> WhiteboardProcessor:
    """Get or create a processor for a room"""
    if room_id not in processors:
        processor_locks[room_id] = threading.Lock()
        processors[room_id] = WhiteboardProcessor()
        processors[room_id].initialize()
    return processors[room_id]

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "whiteboard-processor"})

@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    """
    Process a single frame from the video stream.
    Expects JSON: { "room_id": "...", "frame": "data:image/jpeg;base64,..." }
    """
    try:
        data = request.json
        room_id = data.get('room_id')
        frame_base64 = data.get('frame')
        
        if not room_id or not frame_base64:
            return jsonify({"error": "Missing room_id or frame"}), 400
        
        # Get processor for this room
        processor = get_processor(room_id)
        
        # Process frame (thread-safe)
        with processor_locks[room_id]:
            result = processor.process_frame(frame_base64)
        
        # If we have a processed canvas, emit it to all clients in the room
        if result.get('status') == 'processed' and result.get('canvas'):
            socketio.emit('whiteboard_update', {
                'canvas': result['canvas'],
                'frame_count': result.get('frame_count', 0)
            }, room=room_id)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Error in process_frame: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-canvas/<room_id>', methods=['GET'])
def get_canvas(room_id: str):
    """Get the current processed canvas for a room"""
    try:
        if room_id not in processors:
            return jsonify({"error": "Room not found"}), 404
        
        processor = processors[room_id]
        canvas = processor.get_current_canvas()
        
        if canvas is None:
            return jsonify({"status": "no_canvas", "message": "No canvas available yet"})
        
        return jsonify({"status": "success", "canvas": canvas})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reset/<room_id>', methods=['POST'])
def reset_processor(room_id: str):
    """Reset the processor for a room"""
    try:
        if room_id in processors:
            with processor_locks[room_id]:
                processors[room_id].reset()
            return jsonify({"status": "success", "message": "Processor reset"})
        return jsonify({"status": "success", "message": "No processor to reset"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"✅ Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to whiteboard processor'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"❌ Client disconnected: {request.sid}")

@socketio.on('join_room')
def handle_join_room(data):
    """Handle client joining a room"""
    room_id = data.get('room_id')
    if room_id:
        join_room(room_id)
        print(f"👥 Client {request.sid} joined room {room_id}")
        
        # Send current canvas if available
        if room_id in processors:
            canvas = processors[room_id].get_current_canvas()
            if canvas:
                emit('whiteboard_update', {'canvas': canvas}, room=request.sid)

@socketio.on('leave_room')
def handle_leave_room(data):
    """Handle client leaving a room"""
    room_id = data.get('room_id')
    if room_id:
        leave_room(room_id)
        print(f"👋 Client {request.sid} left room {room_id}")

@socketio.on('request_canvas')
def handle_request_canvas(data):
    """Handle request for current canvas"""
    room_id = data.get('room_id')
    if room_id and room_id in processors:
        canvas = processors[room_id].get_current_canvas()
        if canvas:
            emit('whiteboard_update', {'canvas': canvas}, room=request.sid)

if __name__ == '__main__':
    print("🚀 Starting Whiteboard Processor Server")
    print("=" * 60)
    print("📡 HTTP API: http://localhost:5000")
    print("🔌 WebSocket: ws://localhost:5000")
    print("=" * 60)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
