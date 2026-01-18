# Whiteboard Processor Backend

This backend service processes video frames from the host's camera to remove the teacher and create a clean whiteboard view for students.

## Features

- **Person Detection**: Uses YOLOv8 segmentation to detect and mask the teacher
- **Frame Alignment**: Aligns frames using ORB feature matching for stable output
- **Background Estimation**: Temporal median filtering to reconstruct clean whiteboard
- **Ink Detection**: Adaptive thresholding to detect whiteboard writing
- **Real-time Processing**: Processes frames every 3 seconds from the live stream

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Download YOLO Model

The YOLOv8 model will be automatically downloaded on first run. Ensure you have internet connectivity.

### 3. Start the Server

```bash
python server.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### HTTP Endpoints

#### `POST /api/process-frame`

Process a single video frame.

**Request Body:**

```json
{
  "room_id": "ABC123",
  "frame": "data:image/jpeg;base64,..."
}
```

**Response:**

```json
{
  "status": "processed",
  "message": "Processed 10 frames",
  "canvas": "data:image/jpeg;base64,...",
  "frame_count": 10
}
```

#### `GET /api/get-canvas/<room_id>`

Get the current processed canvas for a room.

**Response:**

```json
{
  "status": "success",
  "canvas": "data:image/jpeg;base64,..."
}
```

#### `POST /api/reset/<room_id>`

Reset the processor for a room (clears all buffered frames).

**Response:**

```json
{
  "status": "success",
  "message": "Processor reset"
}
```

### WebSocket Events

#### Client → Server

- `join_room`: Join a room to receive whiteboard updates

  ```json
  { "room_id": "ABC123" }
  ```

- `leave_room`: Leave a room

  ```json
  { "room_id": "ABC123" }
  ```

- `request_canvas`: Request the current canvas
  ```json
  { "room_id": "ABC123" }
  ```

#### Server → Client

- `connected`: Confirmation of connection

  ```json
  { "message": "Connected to whiteboard processor" }
  ```

- `whiteboard_update`: New processed whiteboard available
  ```json
  {
    "canvas": "data:image/jpeg;base64,...",
    "frame_count": 10
  }
  ```

## How It Works

1. **Frame Capture**: The host's camera captures frames every 3 seconds
2. **Whiteboard Detection**: First frame is used to detect and crop to whiteboard region
3. **Person Detection**: YOLO detects the teacher in each frame
4. **Frame Buffering**: Frames are buffered (up to 20 frames)
5. **Background Estimation**: Temporal median of non-person pixels creates clean background
6. **Ink Detection**: Adaptive thresholding detects writing on the whiteboard
7. **Color Estimation**: Temporal median of visible ink pixels preserves stroke colors
8. **Canvas Generation**: Final clean whiteboard is created and sent to students

## Configuration

Edit the configuration in `whiteboard_processor.py`:

```python
class WhiteboardProcessor:
    def __init__(self):
        self.CONF = 0.4  # YOLO confidence threshold
        self.WHITEBOARD_THRESH = 200  # Whiteboard detection threshold
        self.MIN_WHITEBOARD_AREA = 10000  # Minimum whiteboard area
        self.max_buffer_size = 20  # Maximum frames to buffer
        # ... more settings
```

## Troubleshooting

### No whiteboard detected

- Ensure good lighting on the whiteboard
- Adjust `WHITEBOARD_THRESH` (lower for darker boards)
- Check `MIN_WHITEBOARD_AREA` is appropriate for your setup

### Person not detected

- Ensure teacher is visible in frame
- Adjust `CONF` (lower for less confident detections)
- Check `MIN_PERSON_AREA_RATIO` threshold

### Poor alignment

- Ensure camera is stable (use tripod)
- Increase `ORB_FEATURES` for more feature points
- Adjust `MIN_MATCH_COUNT` for matching threshold

## Performance

- **Processing Time**: ~1-2 seconds per frame (depends on hardware)
- **Memory Usage**: ~500MB-1GB (depends on frame resolution and buffer size)
- **GPU**: Optional but recommended for faster YOLO inference

## Requirements

- Python 3.8+
- 4GB+ RAM
- GPU recommended (CUDA-compatible) for real-time performance
