import cv2
import numpy as np
from ultralytics import YOLO
from typing import Tuple, List, Optional
import warnings
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image


class WhiteboardProcessor:
    """
    Real-time whiteboard processor that removes teacher from frames
    and creates a clean whiteboard view.
    """
    
    def __init__(self):
        # Configuration
        self.CONF = 0.4
        self.PERSON_CLASS = 0
        self.WHITEBOARD_THRESH = 200
        self.MIN_WHITEBOARD_AREA = 10000
        self.ORB_FEATURES = 1000
        self.MIN_MATCH_COUNT = 10
        self.RANSAC_THRESHOLD = 5.0
        self.ADAPTIVE_BLOCK_SIZE = 31
        self.ADAPTIVE_C = 5
        self.MORPH_KERNEL_SIZE = 3
        self.MIN_PERSON_AREA_RATIO = 0.003
        
        # State
        self.model = None
        self.reference_frame = None
        self.ref_kp = None
        self.ref_des = None
        self.orb = None
        self.bf = None
        self.whiteboard_bbox = None
        self.frame_buffer = []
        self.person_mask_buffer = []
        self.max_buffer_size = 20  # Keep last 20 frames for processing
        self.background = None
        self.canvas = None
        
    def initialize(self):
        """Initialize YOLO model and feature detector"""
        print("📦 Loading YOLO model...")
        self.model = YOLO("yolov8n-seg.pt")
        
        print("🔧 Setting up feature matching...")
        self.orb = cv2.ORB_create(self.ORB_FEATURES)
        self.bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        print("✅ WhiteboardProcessor initialized")
    
    def detect_whiteboard_bbox(self, img: np.ndarray) -> Tuple[int, int, int, int]:
        """
        Detect whiteboard region using multiple strategies for robustness.
        Returns (x, y, width, height) of largest white region.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to reduce noise while preserving edges
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Binary threshold
        _, thresh = cv2.threshold(gray, self.WHITEBOARD_THRESH, 255, cv2.THRESH_BINARY)
        
        # Morphological closing to fill gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            raise ValueError("No whiteboard detected in the frame")
        
        # Filter by area and find largest
        valid_contours = [c for c in contours if cv2.contourArea(c) > self.MIN_WHITEBOARD_AREA]
        if not valid_contours:
            raise ValueError(f"No contours larger than {self.MIN_WHITEBOARD_AREA} pixels found")
        
        largest_contour = max(valid_contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        
        print(f"✅ Whiteboard detected: {w}x{h} at ({x}, {y})")
        return x, y, w, h
    
    def align_image(self, img: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """
        Align image to reference using ORB features and homography.
        Falls back to original image if alignment fails.
        """
        if self.ref_kp is None or self.ref_des is None:
            return img
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        kp, des = self.orb.detectAndCompute(gray, None)
        
        w, h = target_size
        
        # Check if we have enough features
        if des is None or len(kp) < 4:
            return img
        
        # Match features
        matches = self.bf.match(self.ref_des, des)
        matches = sorted(matches, key=lambda x: x.distance)[:50]
        
        if len(matches) < self.MIN_MATCH_COUNT:
            return img
        
        # Extract point correspondences
        src_pts = np.float32([self.ref_kp[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
        
        # Compute homography
        H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, self.RANSAC_THRESHOLD)
        
        if H is None:
            return img
        
        # Warp image
        aligned = cv2.warpPerspective(img, H, (w, h), flags=cv2.INTER_LINEAR)
        
        return aligned
    
    def detect_person_mask(self, img: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """
        Detect person segmentation mask using YOLO.
        Returns binary mask where True indicates person pixels.
        """
        h, w = target_size
        person_mask = np.zeros((h, w), dtype=bool)
        
        # Run inference
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            results = self.model(img, conf=self.CONF, verbose=False)
        
        for r in results:
            if not hasattr(r, 'masks') or r.masks is None:
                continue
            
            for j, seg in enumerate(r.masks.data):
                cls = int(r.boxes.cls[j])
                if cls != self.PERSON_CLASS:
                    continue
                
                # Resize mask to target size
                seg_np = cv2.resize(seg.cpu().numpy(), (w, h), interpolation=cv2.INTER_LINEAR)
                person_mask |= (seg_np > 0.5)
        
        # Apply morphological operations to clean up mask
        if person_mask.any():
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            person_mask = cv2.morphologyEx(person_mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel).astype(bool)
        
        return person_mask
    
    def estimate_background(self, stack: np.ndarray, bg_mask_stack: np.ndarray) -> np.ndarray:
        """
        Estimate background using temporal median filtering on non-person pixels.
        """
        # Create masked stack (NaN where person exists)
        masked_bg = np.where(bg_mask_stack[..., None], stack.astype(np.float32), np.nan)
        
        # Compute temporal median
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            background = np.nanmedian(masked_bg, axis=0)
        
        # Handle pixels that were always occluded
        nan_mask = np.isnan(background[..., 0])
        background = np.nan_to_num(background, nan=255).astype(np.uint8)
        
        if nan_mask.any():
            background = cv2.inpaint(background, nan_mask.astype(np.uint8), 3, cv2.INPAINT_TELEA)
        
        return background
    
    def detect_ink_mask(self, background: np.ndarray) -> np.ndarray:
        """
        Detect ink strokes on whiteboard using adaptive thresholding.
        """
        gray_bg = cv2.cvtColor(background, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to reduce noise
        gray_bg = cv2.bilateralFilter(gray_bg, 5, 50, 50)
        
        # Adaptive thresholding to detect dark ink
        ink_mask = cv2.adaptiveThreshold(
            gray_bg,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            self.ADAPTIVE_BLOCK_SIZE,
            self.ADAPTIVE_C
        )
        
        # Morphological opening to remove noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (self.MORPH_KERNEL_SIZE, self.MORPH_KERNEL_SIZE))
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_OPEN, kernel)
        
        # Additional closing to connect nearby strokes
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, kernel_close)
        
        return ink_mask.astype(bool)
    
    def estimate_stroke_colors(self, stack: np.ndarray, ink_mask: np.ndarray, person_mask_stack: np.ndarray) -> np.ndarray:
        """
        Estimate true stroke colors by taking temporal median of visible ink pixels.
        """
        # Create mask for pixels that are ink AND not occluded by person
        stroke_mask = ink_mask[None, ...] & (~person_mask_stack)
        
        # Expand to RGB channels
        stroke_mask_rgb = np.repeat(stroke_mask[..., None], 3, axis=3)
        
        # Mask out non-stroke pixels
        stroke_stack = np.where(stroke_mask_rgb, stack.astype(np.float32), np.nan)
        
        # Compute temporal median for each pixel
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            stroke_color = np.nanmedian(stroke_stack, axis=0)
        
        # Fill remaining NaNs with white
        stroke_color = np.where(np.isnan(stroke_color), 255, stroke_color).astype(np.uint8)
        
        return stroke_color
    
    def process_frame(self, frame_base64: str) -> dict:
        """
        Process a single frame from the video stream.
        Returns status and optionally the processed whiteboard image.
        """
        try:
            # Decode base64 image
            img_data = base64.b64decode(frame_base64.split(',')[1] if ',' in frame_base64 else frame_base64)
            img = Image.open(BytesIO(img_data))
            frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            
            # Initialize reference frame if this is the first frame
            if self.reference_frame is None:
                print("🔍 Detecting whiteboard in first frame...")
                x, y, w, h = self.detect_whiteboard_bbox(frame)
                self.whiteboard_bbox = (x, y, w, h)
                
                # Crop to whiteboard
                frame = frame[y:y+h, x:x+w]
                self.reference_frame = frame
                
                # Extract features from reference
                ref_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                self.ref_kp, self.ref_des = self.orb.detectAndCompute(ref_gray, None)
                print(f"✅ Reference frame set with {len(self.ref_kp)} features")
                
                return {"status": "reference_set", "message": "Reference frame initialized"}
            
            # Crop to whiteboard region
            x, y, w, h = self.whiteboard_bbox
            frame = frame[y:y+h, x:x+w]
            
            # Align frame
            aligned = self.align_image(frame, (w, h))
            
            # Detect person mask
            person_mask = self.detect_person_mask(aligned, (h, w))
            
            # Check if person is detected
            min_area = int(self.MIN_PERSON_AREA_RATIO * person_mask.size)
            if person_mask.sum() < min_area:
                print("⚠️ Person not detected in frame, skipping...")
                return {"status": "no_person", "message": "Person not detected"}
            
            # Add to buffer
            self.frame_buffer.append(aligned)
            self.person_mask_buffer.append(person_mask)
            
            # Keep buffer size manageable
            if len(self.frame_buffer) > self.max_buffer_size:
                self.frame_buffer.pop(0)
                self.person_mask_buffer.pop(0)
            
            # Process if we have enough frames
            if len(self.frame_buffer) >= 5:
                print(f"🎬 Processing {len(self.frame_buffer)} frames...")
                
                # Convert to numpy arrays
                stack = np.array(self.frame_buffer)
                person_mask_stack = np.array(self.person_mask_buffer)
                bg_mask_stack = ~person_mask_stack
                
                # Estimate background
                self.background = self.estimate_background(stack, bg_mask_stack)
                
                # Detect ink
                ink_mask = self.detect_ink_mask(self.background)
                
                # Estimate stroke colors
                stroke_color = self.estimate_stroke_colors(stack, ink_mask, person_mask_stack)
                
                # Create final canvas
                canvas = np.ones((h, w, 3), dtype=np.uint8) * 255
                canvas[ink_mask] = stroke_color[ink_mask]
                self.canvas = canvas
                
                # Convert to base64
                _, buffer = cv2.imencode('.jpg', canvas)
                canvas_base64 = base64.b64encode(buffer).decode('utf-8')
                
                return {
                    "status": "processed",
                    "message": f"Processed {len(self.frame_buffer)} frames",
                    "canvas": f"data:image/jpeg;base64,{canvas_base64}",
                    "frame_count": len(self.frame_buffer)
                }
            
            return {
                "status": "buffering",
                "message": f"Buffering frames ({len(self.frame_buffer)}/5)",
                "frame_count": len(self.frame_buffer)
            }
            
        except Exception as e:
            print(f"❌ Error processing frame: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": str(e)}
    
    def get_current_canvas(self) -> Optional[str]:
        """Get the current processed canvas as base64"""
        if self.canvas is None:
            return None
        
        _, buffer = cv2.imencode('.jpg', self.canvas)
        canvas_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{canvas_base64}"
    
    def reset(self):
        """Reset the processor state"""
        self.reference_frame = None
        self.ref_kp = None
        self.ref_des = None
        self.whiteboard_bbox = None
        self.frame_buffer = []
        self.person_mask_buffer = []
        self.background = None
        self.canvas = None
        print("🔄 Processor reset")
