
export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

const getTransformStyle = (transform: Transform | null): string => {
  if (!transform) return '';
  const t = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      ...transform
  };
  return `transform-origin: top left; transform: translateX(${t.translateX}%) translateY(${t.translateY}%) scale(${t.scale}) rotate(${t.rotation}deg);`;
}

export const generateComparisonHtml = (
  image1: string, 
  image2: string, 
  transform1: Transform | null, 
  transform2: Transform | null,
): string => {
  const transformStyle1 = getTransformStyle(transform1);
  const transformStyle2 = getTransformStyle(transform2);
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparaison d'Images</title>
  <style>
    :root {
      --handle-size: 40px;
      --slider-color: #ffffff;
      --active-tool-color: #0d6efd;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      margin: 0;
      background-color: #f0f2f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
      color: #333;
    }
    .main-wrapper {
        width: 100%;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    h1 {
        margin-bottom: 2rem;
        color: #1a202c;
    }
    .comparison-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.05);
      cursor: crosshair;
      background-color: #e2e8f0;
    }
    .image-transformer {
        position: absolute;
        /* width, height, top, left are set by JS */
        will-change: transform;
        transition: opacity 0.2s;
    }
    .comparison-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      user-select: none;
    }
    #image-one-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      clip-path: inset(0 50% 0 0);
      z-index: 1;
    }
    #image-two-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      clip-path: inset(0 0 0 50%);
      z-index: 2;
    }
    #slider-bar {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      background-color: var(--slider-color);
      cursor: ew-resize;
      z-index: 10;
      pointer-events: none;
      transition: opacity 0.3s;
    }
     #slider-handle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: var(--handle-size);
      height: var(--handle-size);
      background-color: var(--slider-color);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: ew-resize;
      z-index: 11;
      transition: opacity 0.3s;
    }
    #slider-handle::before,
    #slider-handle::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    }
    #slider-handle::before {
      border-width: 6px 8px 6px 0;
      border-color: transparent #555 transparent transparent;
      left: 8px;
    }
    #slider-handle::after {
      border-width: 6px 0 6px 8px;
      border-color: transparent transparent transparent #555;
      right: 8px;
    }
    #measurement-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      pointer-events: auto;
    }
    .controls {
      margin-top: 20px;
      background: white;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .controls button {
      padding: 8px 16px;
      border: 1px solid #ccc;
      background-color: #f8f8f8;
      cursor: pointer;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .controls button.active {
      background-color: var(--active-tool-color);
      color: white;
      border-color: var(--active-tool-color);
    }
    .controls button:hover:not(.active) {
      background-color: #e9e9e9;
      border-color: #bbb;
    }
    /* Edit mode styles */
    .edit-mode #transformer-2 {
      border: 2px dashed var(--active-tool-color);
      cursor: move;
      opacity: 0.4;
    }
    .edit-mode #slider-handle, .edit-mode #slider-bar {
      opacity: 0;
      pointer-events: none;
    }
    .edit-mode .controls button:not(#edit-tool) {
      opacity: 0.5;
      pointer-events: none;
    }
    .edit-mode #image-one-wrapper,
    .edit-mode #image-two-wrapper {
      clip-path: none; /* Show full images for alignment */
    }
  </style>
</head>
<body>
  <div class="main-wrapper">
    <h1>Comparaison & Mesure d'Images</h1>
    <div class="comparison-container" id="container">
      
      <!-- Base Layer (Image 1) -->
      <div id="image-one-wrapper">
        <div class="image-transformer" id="transformer-1" style="${transformStyle1}">
          <img src="${image1}" class="comparison-image" id="image-one" alt="Image 1">
        </div>
      </div>
      
      <!-- Clipped Top Layer (Image 2) -->
      <div id="image-two-wrapper">
        <div class="image-transformer" id="transformer-2" style="${transformStyle2}">
          <img src="${image2}" class="comparison-image" id="image-two" alt="Image 2">
        </div>
      </div>

      <div id="slider-bar"></div>
      <div id="slider-handle"></div>
      <canvas id="measurement-canvas"></canvas>
    </div>
    <div class="controls">
      <span>Outils :</span>
      <button id="edit-tool">Éditer l'alignement</button>
      <button id="distance-tool">Mesurer la distance</button>
      <button id="area-tool">Mesurer la surface</button>
      <button id="clear-tool">Effacer les mesures</button>
    </div>
  </div>

  <script>
    // --- Element Selectors ---
    const container = document.getElementById('container');
    const sliderHandle = document.getElementById('slider-handle');
    const sliderBar = document.getElementById('slider-bar');
    const imageOneWrapper = document.getElementById('image-one-wrapper');
    const imageTwoWrapper = document.getElementById('image-two-wrapper');
    const canvas = document.getElementById('measurement-canvas');
    const ctx = canvas.getContext('2d');
    const editTarget = document.getElementById('transformer-2');
    
    // --- Buttons ---
    const distanceBtn = document.getElementById('distance-tool');
    const areaBtn = document.getElementById('area-tool');
    const clearBtn = document.getElementById('clear-tool');
    const editBtn = document.getElementById('edit-tool');

    // --- State Variables ---
    let isSliderDragging = false;
    let isEditing = false;
    let isEditDragging = false;
    let startDragPos = { x: 0, y: 0 };
    let currentTransform = { scale: 1, translateX: 0, translateY: 0, rotation: 0 };
    let currentTool = null;
    let currentPoints = [];
    let allMeasurements = [];

    // --- Layout and Transform Logic ---
    function setupLayout() {
      const containerRect = container.getBoundingClientRect();

      function processTransformer(transformerId, imgId) {
        const transformer = document.getElementById(transformerId);
        const imgEl = document.getElementById(imgId);
        if (!transformer || !imgEl || !imgEl.naturalWidth) return;

        const containerW = containerRect.width;
        const containerH = containerRect.height;
        const imgW = imgEl.naturalWidth;
        const imgH = imgEl.naturalHeight;

        const ratioContainer = containerW / containerH;
        const ratioImg = imgW / imgH;

        let renderedW, renderedH;
        if (ratioImg > ratioContainer) {
          renderedW = containerW;
          renderedH = containerW / ratioImg;
        } else {
          renderedH = containerH;
          renderedW = containerH * ratioImg;
        }

        const topOffset = (containerH - renderedH) / 2;
        const leftOffset = (containerW - renderedW) / 2;

        transformer.style.width = \`\${renderedW}px\`;
        transformer.style.height = \`\${renderedH}px\`;
        transformer.style.top = \`\${topOffset}px\`;
        transformer.style.left = \`\${leftOffset}px\`;
      }
      
      processTransformer('transformer-1', 'image-one');
      processTransformer('transformer-2', 'image-two');
      resizeCanvas();
    }

    // --- Slider Logic ---
    function moveSlider(clientX) {
        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;
        sliderHandle.style.left = \`\${percent}%\`;
        sliderBar.style.left = \`\${percent}%\`;
        imageTwoWrapper.style.clipPath = \`inset(0 0 0 \${percent}%)\`;
        imageOneWrapper.style.clipPath = \`inset(0 \${100 - percent}% 0 0)\`;
    }

    // --- Edit Logic ---
    function applyTransform(element, t) {
        element.style.transform = \`translateX(\${t.translateX}px) translateY(\${t.translateY}px) scale(\${t.scale}) rotate(\${t.rotation}deg)\`;
    }

    function getEventCoords(e) {
        return e.touches && e.touches.length > 0 ? e.touches[0] : e;
    }

    function handleEditStart(e) {
        if (!isEditing || isSliderDragging) return;
        isEditDragging = true;
        const event = getEventCoords(e);
        startDragPos.x = event.clientX;
        startDragPos.y = event.clientY;
        e.preventDefault();
    }

    function handleEditMove(e) {
        if (!isEditDragging) return;
        const event = getEventCoords(e);
        const dx = event.clientX - startDragPos.x;
        const dy = event.clientY - startDragPos.y;
        currentTransform.translateX += dx;
        currentTransform.translateY += dy;
        applyTransform(editTarget, currentTransform);
        startDragPos.x = event.clientX;
        startDragPos.y = event.clientY;
        e.preventDefault();
    }
    
    function handleEditWheel(e) {
        if (!isEditing) return;
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.0005; // Reduced sensitivity for finer control
        currentTransform.scale = Math.max(0.1, currentTransform.scale + scaleAmount * currentTransform.scale);
        applyTransform(editTarget, currentTransform);
    }
    
    function toggleEditMode() {
        isEditing = !isEditing;
        container.classList.toggle('edit-mode', isEditing);
        editBtn.classList.toggle('active', isEditing);
        canvas.style.pointerEvents = isEditing ? 'none' : 'auto'; // BUG FIX: Allow events to pass through canvas to image

        if (isEditing) {
            setActiveTool(null);
            editBtn.textContent = 'Appliquer les changements';
            const initialStyle = window.getComputedStyle(editTarget);
            const matrix = new DOMMatrixReadOnly(initialStyle.transform);
            currentTransform = {
                translateX: matrix.e,
                translateY: matrix.f,
                scale: matrix.a,
                rotation: 0 
            };
            
            // Overwrite transform with pixel values for direct manipulation
            applyTransform(editTarget, currentTransform);
            
            editTarget.addEventListener('mousedown', handleEditStart);
            editTarget.addEventListener('touchstart', handleEditStart, { passive: false });
            editTarget.addEventListener('wheel', handleEditWheel, { passive: false });
        } else {
            editBtn.textContent = "Éditer l'alignement";
            editTarget.removeEventListener('mousedown', handleEditStart);
            editTarget.removeEventListener('touchstart', handleEditStart);
            editTarget.removeEventListener('wheel', handleEditWheel);
            
            // Convert final pixel translation back to percentage and notify parent
            const targetRect = editTarget.getBoundingClientRect();
            if (targetRect.width > 0 && targetRect.height > 0) {
                const percentTranslateX = (currentTransform.translateX / targetRect.width) * 100;
                const percentTranslateY = (currentTransform.translateY / targetRect.height) * 100;
                
                const finalTransform = {
                    scale: currentTransform.scale,
                    translateX: percentTranslateX,
                    translateY: percentTranslateY,
                    rotation: currentTransform.rotation,
                };
                window.parent.postMessage({ type: 'transform-update', transform: finalTransform }, '*');
            }

            const sliderPosition = parseFloat(sliderHandle.style.left || '50');
            moveSlider(container.getBoundingClientRect().left + container.getBoundingClientRect().width * (sliderPosition / 100));
        }
    }
    editBtn.addEventListener('click', toggleEditMode);
    
    // --- Global Event Handlers ---
    function handleGlobalMove(e) {
        if (isSliderDragging) {
            const event = getEventCoords(e);
            moveSlider(event.clientX);
        }
        if (isEditDragging) {
            handleEditMove(e);
        }
    }

    function handleGlobalEnd() {
        isSliderDragging = false;
        isEditDragging = false;
    }

    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);

    sliderHandle.addEventListener('mousedown', (e) => { 
        if(!isEditing) { isSliderDragging = true; e.preventDefault(); }
    });
    sliderHandle.addEventListener('touchstart', (e) => { 
        if(!isEditing) { isSliderDragging = true; e.preventDefault(); }
    }, { passive: false });
    
    // --- Canvas and Measurement Logic ---
    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawAll();
    }
    
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const event = getEventCoords(e);
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function setActiveTool(tool) {
        if(isEditing) return;
        currentTool = tool;
        currentPoints = [];
        distanceBtn.classList.toggle('active', tool === 'distance');
        areaBtn.classList.toggle('active', tool === 'area');
        const cursor = tool ? 'crosshair' : 'default';
        canvas.style.cursor = cursor;
        container.style.cursor = cursor;
        drawAll();
    }

    distanceBtn.addEventListener('click', () => setActiveTool(currentTool === 'distance' ? null : 'distance'));
    areaBtn.addEventListener('click', () => setActiveTool(currentTool === 'area' ? null : 'area'));
    clearBtn.addEventListener('click', () => {
        allMeasurements = [];
        currentPoints = [];
        drawAll();
    });

    function handleCanvasClick(e) {
        if (!currentTool) return;
        const { x, y } = getCanvasCoords(e);
        
        if (currentTool === 'distance') {
            currentPoints.push({ x, y });
            if (currentPoints.length === 2) {
                const dist = Math.sqrt(Math.pow(currentPoints[1].x - currentPoints[0].x, 2) + Math.pow(currentPoints[1].y - currentPoints[0].y, 2));
                allMeasurements.push({ type: 'distance', points: [...currentPoints], value: dist });
                currentPoints = [];
            }
        } else if (currentTool === 'area') {
            if (currentPoints.length > 2) {
                const startPoint = currentPoints[0];
                const distToStart = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
                if (distToStart < 10) {
                    let area = 0;
                    for (let i = 0; i < currentPoints.length; i++) {
                        const p1 = currentPoints[i];
                        const p2 = currentPoints[(i + 1) % currentPoints.length];
                        area += p1.x * p2.y - p2.x * p1.y;
                    }
                    area = Math.abs(area / 2);
                    allMeasurements.push({ type: 'area', points: [...currentPoints], value: area });
                    currentPoints = [];
                    drawAll();
                    return;
                }
            }
            currentPoints.push({ x, y });
        }
        drawAll();
    }
    canvas.addEventListener('click', handleCanvasClick);

    function drawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        allMeasurements.forEach(m => {
            if (m.type === 'distance') drawDistance(m.points, m.value);
            if (m.type === 'area') drawArea(m.points, m.value);
        });
        if (currentPoints.length > 0) {
            if (currentTool === 'distance') drawDistance(currentPoints);
            if (currentTool === 'area') drawArea(currentPoints);
        }
    }
    
    function drawDistance(points, value) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => {
            ctx.lineTo(p.x, p.y);
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        });
        if (points.length === 2 && value) {
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;
            drawText(\`\${value.toFixed(1)} px\`, midX, midY - 10);
        }
    }

    function drawArea(points, value) {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(let i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }
        if(value) {
             ctx.closePath();
             ctx.fillStyle = 'rgba(13, 110, 253, 0.2)';
             ctx.fill();
        }
        ctx.strokeStyle = '#0d6efd';
        ctx.lineWidth = 2;
        ctx.stroke();
        points.forEach(p => {
             ctx.fillStyle = 'white';
             ctx.strokeStyle = '#0d6efd';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
             ctx.fill();
             ctx.stroke();
        });
        if (value) {
            const centroid = getPolygonCentroid(points);
            drawText(\`\${value.toFixed(1)} px²\`, centroid.x, centroid.y);
        }
    }

    function getPolygonCentroid(points) {
        let centroid = { x: 0, y: 0 };
        for(let i = 0; i < points.length; i++) {
            centroid.x += points[i].x;
            centroid.y += points[i].y;
        }
        centroid.x /= points.length;
        centroid.y /= points.length;
        return centroid;
    }
    
    function drawText(text, x, y) {
        ctx.font = 'bold 14px Arial';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x - textWidth / 2 - 5, y - textHeight, textWidth + 10, textHeight + 8);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y - textHeight/2 + 4);
    }

    // --- Initial Setup ---
    const images = Array.from(document.querySelectorAll('.comparison-image'));
    Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; });
    })).then(() => {
        setupLayout();
        setActiveTool(null);
    });
    
    window.addEventListener('resize', () => {
        setupLayout();
        resizeCanvas();
    });
  <\/script>
</body>
</html>
  `;
};
