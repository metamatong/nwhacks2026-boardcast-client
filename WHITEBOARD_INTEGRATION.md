# Whiteboard Digitization Integration Guide

This document explains how the whiteboard digitization feature works and how to use it.

## Overview

The whiteboard digitization feature captures frames from the host's video stream every 3 seconds, processes them using computer vision to remove the teacher, and provides students with a clean view of the whiteboard.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Host View     │         │  Python Backend  │         │  Student View   │
│  (host_view.tsx)│         │   (Flask API)    │         │   (room.tsx)    │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. Capture frame          │                            │
         │    every 3 seconds        │                            │
         ├──────────────────────────>│                            │
         │                           │                            │
         │                           │ 2. Process frame           │
         │                           │    - Detect whiteboard     │
         │                           │    - Detect person (YOLO)  │
         │                           │    - Remove teacher        │
         │                           │    - Extract ink           │
         │                           │                            │
         │                           │ 3. Broadcast clean board   │
         │                           ├───────────────────────────>│
         │                           │    (WebSocket)             │
         │                           │                            │
         │                           │                            │ 4. Display
         │                           │                            │    clean board
```

## Components

### 1. Backend Service (`backend/`)

**Files:**

- [`whiteboard_processor.py`](backend/whiteboard_processor.py) - Core processing logic
- [`server.py`](backend/server.py) - Flask API and WebSocket server
- [`requirements.txt`](backend/requirements.txt) - Python dependencies

**Key Features:**

- YOLOv8 person segmentation
- ORB feature matching for frame alignment
- Temporal median filtering for background estimation
- Adaptive thresholding for ink detection
- Real-time WebSocket updates

### 2. Frontend Integration

**Files:**

- [`frontend/host_view/host_view.tsx`](frontend/host_view/host_view.tsx) - Frame capture
- [`frontend/hooks/useWhiteboardProcessor.ts`](frontend/hooks/useWhiteboardProcessor.ts) - WebSocket hook
- [`frontend/room/room.tsx`](frontend/room/room.tsx) - Display processed whiteboard

**Key Features:**

- Automatic frame capture every 3 seconds
- Canvas-based frame extraction
- WebSocket connection to processor
- Toggle between raw and processed views

## Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:

- Flask & Flask-SocketIO (API server)
- OpenCV (image processing)
- Ultralytics (YOLOv8)
- NumPy, Pillow (utilities)

### Step 2: Install Frontend Dependencies

```bash
npm install socket.io-client
```

This is already done if you've run `npm install`.

### Step 3: Start the Backend Server

```bash
cd backend
python server.py
```

The server will start on `http://localhost:5000` and automatically download the YOLOv8 model on first run.

### Step 4: Start the Frontend

```bash
npm run dev
```

The Next.js app will start on `http://localhost:3000`.

## Usage Flow

### For Hosts (Teachers)

1. **Create a Room**: Navigate to room creation page
2. **Start Streaming**: Allow camera access and go live
3. **Automatic Processing**: Frames are automatically captured every 3 seconds and sent to the backend
4. **Monitor Status**: Check browser console for processing status

### For Students

1. **Join Room**: Enter the room code
2. **Wait for Stream**: Initial WebRTC connection establishes
3. **View Clean Board**: Once processing starts, toggle between:
   - **Raw Stream**: Direct video from teacher's camera
   - **Clean Board**: Processed whiteboard with teacher removed

## How It Works

### Frame Capture (Host Side)

```typescript
// In host_view.tsx
const captureAndSendFrame = useCallback(async () => {
  // 1. Draw video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Convert to base64
  const frameData = canvas.toDataURL("image/jpeg", 0.8);

  // 3. Send to backend
  await fetch("http://localhost:5000/api/process-frame", {
    method: "POST",
    body: JSON.stringify({ room_id: roomCode, frame: frameData }),
  });
}, []);

// Capture every 3 seconds
setInterval(captureAndSendFrame, 3000);
```

### Processing Pipeline (Backend)

```python
# In whiteboard_processor.py
def process_frame(self, frame_base64: str) -> dict:
    # 1. Decode frame
    frame = decode_base64_image(frame_base64)

    # 2. Detect whiteboard (first frame only)
    if not self.reference_frame:
        bbox = detect_whiteboard_bbox(frame)
        frame = crop_to_whiteboard(frame, bbox)

    # 3. Align frame to reference
    aligned = align_image(frame)

    # 4. Detect person with YOLO
    person_mask = detect_person_mask(aligned)

    # 5. Buffer frames
    self.frame_buffer.append(aligned)
    self.person_mask_buffer.append(person_mask)

    # 6. Process when enough frames (5+)
    if len(self.frame_buffer) >= 5:
        # Estimate background (median of non-person pixels)
        background = estimate_background(frames, masks)

        # Detect ink on whiteboard
        ink_mask = detect_ink_mask(background)

        # Estimate stroke colors
        stroke_colors = estimate_stroke_colors(frames, ink_mask, masks)

        # Create clean canvas
        canvas = create_canvas(ink_mask, stroke_colors)

        # Broadcast to students via WebSocket
        socketio.emit('whiteboard_update', {'canvas': canvas}, room=room_id)
```

### Display (Student Side)

```typescript
// In room.tsx
const { whiteboardCanvas } = useWhiteboardProcessor({ roomId });

// Toggle between views
{showProcessedView ? (
  <img src={whiteboardCanvas} alt="Clean Whiteboard" />
) : (
  <video ref={videoRef} />
)}
```

## Configuration

### Backend Settings

Edit [`whiteboard_processor.py`](backend/whiteboard_processor.py):

```python
class WhiteboardProcessor:
    def __init__(self):
        # YOLO settings
        self.CONF = 0.4  # Detection confidence (0.0-1.0)

        # Whiteboard detection
        self.WHITEBOARD_THRESH = 200  # Brightness threshold (0-255)
        self.MIN_WHITEBOARD_AREA = 10000  # Minimum pixels

        # Frame buffering
        self.max_buffer_size = 20  # Keep last N frames

        # Ink detection
        self.ADAPTIVE_BLOCK_SIZE = 31  # Must be odd
        self.ADAPTIVE_C = 5  # Threshold offset
```

### Frontend Settings

Edit [`host_view.tsx`](frontend/host_view/host_view.tsx):

```typescript
// Change capture interval (milliseconds)
setInterval(captureAndSendFrame, 3000); // 3 seconds
```

## Troubleshooting

### Issue: No whiteboard detected

**Symptoms:** Backend logs "No whiteboard detected in the frame"

**Solutions:**

- Ensure whiteboard is well-lit and visible
- Lower `WHITEBOARD_THRESH` for darker boards
- Reduce `MIN_WHITEBOARD_AREA` for smaller boards

### Issue: Person not detected

**Symptoms:** Backend logs "Person not detected in frame, skipping..."

**Solutions:**

- Ensure teacher is visible in frame
- Lower `CONF` threshold (e.g., 0.3)
- Check camera positioning

### Issue: Poor alignment

**Symptoms:** Jittery or misaligned processed output

**Solutions:**

- Use a stable camera mount (tripod)
- Increase `ORB_FEATURES` for better matching
- Ensure consistent lighting

### Issue: WebSocket not connecting

**Symptoms:** Students don't see processed whiteboard

**Solutions:**

- Check backend is running on port 5000
- Verify CORS settings in `server.py`
- Check browser console for connection errors
- Ensure `socket.io-client` is installed

### Issue: Slow processing

**Symptoms:** Long delays between updates

**Solutions:**

- Reduce frame resolution in host settings
- Increase capture interval (e.g., 5 seconds)
- Use GPU for YOLO inference
- Reduce `max_buffer_size`

## Performance Optimization

### For Better Quality

- Increase frame resolution (1920x1080)
- Decrease capture interval (2 seconds)
- Increase `max_buffer_size` (30 frames)
- Use higher JPEG quality (0.9)

### For Better Speed

- Decrease frame resolution (1280x720)
- Increase capture interval (5 seconds)
- Decrease `max_buffer_size` (10 frames)
- Use lower JPEG quality (0.6)
- Enable GPU acceleration

## API Reference

See [`backend/README.md`](backend/README.md) for detailed API documentation.

## Future Enhancements

- [ ] Real-time processing (< 1 second latency)
- [ ] Multi-whiteboard support
- [ ] Handwriting recognition
- [ ] Automatic slide detection
- [ ] Export to PDF
- [ ] Recording and playback
- [ ] Mobile optimization

## Credits

Based on the whiteboard digitization algorithm using:

- YOLOv8 for person segmentation
- ORB features for frame alignment
- Temporal median filtering for background estimation
- Adaptive thresholding for ink detection
