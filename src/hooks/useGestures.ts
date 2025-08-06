import { useRef, useCallback, useEffect } from 'react';

interface GestureHandlers {
  onZoom?: (delta: number) => void;
  onRotate?: (deltaX: number, deltaY: number) => void;
  onReset?: () => void;
}

interface TouchInfo {
  id: number;
  x: number;
  y: number;
}

export const useGestures = (handlers: GestureHandlers) => {
  const elementRef = useRef<HTMLElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const touches = useRef<TouchInfo[]>([]);
  const lastPinchDistance = useRef(0);

  // Calculate distance between two touches
  const getPinchDistance = (touch1: TouchInfo, touch2: TouchInfo) => {
    const dx = touch1.x - touch2.x;
    const dy = touch1.y - touch2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle mouse events
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) { // Left click only
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current && handlers.onRotate) {
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;
      
      handlers.onRotate(deltaX * 0.5, deltaY * 0.3);
      
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [handlers]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (handlers.onZoom) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handlers.onZoom(delta);
    }
  }, [handlers]);

  const handleDoubleClick = useCallback(() => {
    if (handlers.onReset) {
      handlers.onReset();
    }
  }, [handlers]);

  // Handle touch events
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    touches.current = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));

    if (touches.current.length === 2) {
      lastPinchDistance.current = getPinchDistance(touches.current[0], touches.current[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const currentTouches = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));

    if (currentTouches.length === 2 && touches.current.length === 2) {
      // Pinch-to-zoom
      const currentDistance = getPinchDistance(currentTouches[0], currentTouches[1]);
      const deltaDistance = currentDistance - lastPinchDistance.current;
      
      if (handlers.onZoom && Math.abs(deltaDistance) > 2) {
        handlers.onZoom(deltaDistance * 0.01);
        lastPinchDistance.current = currentDistance;
      }
    } else if (currentTouches.length === 1 && touches.current.length === 1) {
      // Single finger rotation
      const deltaX = currentTouches[0].x - touches.current[0].x;
      const deltaY = currentTouches[0].y - touches.current[0].y;
      
      if (handlers.onRotate) {
        handlers.onRotate(deltaX * 0.7, deltaY * 0.4);
      }
    }

    touches.current = currentTouches;
  }, [handlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touches.current = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));

    if (touches.current.length < 2) {
      lastPinchDistance.current = 0;
    }
  }, []);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!elementRef.current?.contains(document.activeElement)) return;

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        if (handlers.onZoom) handlers.onZoom(0.1);
        break;
      case '-':
        e.preventDefault();
        if (handlers.onZoom) handlers.onZoom(-0.1);
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        if (handlers.onReset) handlers.onReset();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (handlers.onRotate) handlers.onRotate(-10, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (handlers.onRotate) handlers.onRotate(10, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (handlers.onRotate) handlers.onRotate(0, -10);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (handlers.onRotate) handlers.onRotate(0, 10);
        break;
    }
  }, [handlers]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Mouse events
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('dblclick', handleDoubleClick);

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('dblclick', handleDoubleClick);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleDoubleClick, 
      handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  return elementRef;
};