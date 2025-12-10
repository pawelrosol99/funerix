
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DocumentLayer, DocumentTemplate, DocumentCategory } from '../types';
import { Button, Card, Input } from './UI';
import { 
  Type, Image as ImageIcon, Trash2, AlignLeft, AlignCenter, AlignRight, 
  Bold, Italic, Underline, ChevronDown, Save, X, Layout, Layers,
  ChevronUp, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentEditorProps {
  initialTemplate?: DocumentTemplate;
  categories: DocumentCategory[];
  onSave: (templateData: Partial<DocumentTemplate>) => void;
  onCancel: () => void;
}

const A4_WIDTH_PX = 794; // 96 DPI
const A4_HEIGHT_PX = 1123;
const SNAP_THRESHOLD = 5; // Pixels distance to snap

interface SnapLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ initialTemplate, categories, onSave, onCancel }) => {
  const [name, setName] = useState(initialTemplate?.name || 'Nowy Dokument');
  const [categoryId, setCategoryId] = useState(initialTemplate?.categoryId || '');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialTemplate?.orientation || 'portrait');
  const [layers, setLayers] = useState<DocumentLayer[]>(initialTemplate?.layers || []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  // Viewport State
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true); // If true, auto-calculate scale on resize
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  
  // Refs for logic
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otherLayersRects = useRef<{id: string, x: number, y: number, w: number, h: number}[]>([]);
  
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // --- Dynamic Scaling Logic ---
  const calculateScale = () => {
    if (containerRef.current) {
      const isMobile = window.innerWidth < 1024;
      
      const padding = isMobile ? 0 : 48; // No padding calculation for mobile width to maximize space
      const containerWidth = containerRef.current.clientWidth - padding;
      const containerHeight = containerRef.current.clientHeight - padding;
      
      const docWidth = orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX;
      const docHeight = orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX;

      const scaleX = containerWidth / docWidth;
      const scaleY = containerHeight / docHeight;
      
      // On mobile, we force fit-to-width with a slight margin for touch scrolling
      // On desktop, we fit-to-screen (whichever dimension is constraining)
      let newScale = isMobile ? (containerWidth / docWidth) * 0.95 : Math.min(scaleX, scaleY);
      
      // Desktop constraints
      if (!isMobile && newScale < 0.3) newScale = 0.3;

      // Limit max zoom
      newScale = Math.min(newScale, 1.5);
      
      setScale(newScale);
    }
  };

  useEffect(() => {
    if (autoFit) {
      calculateScale();
    }
  }, [orientation, autoFit]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
       if (autoFit) calculateScale();
    });
    
    if (containerRef.current) {
       observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoFit, orientation]);

  const handleZoomIn = () => {
    setAutoFit(false);
    setScale(prev => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setScale(prev => Math.max(prev - 0.1, 0.2));
  };

  const handleFitScreen = () => {
    setAutoFit(true);
    calculateScale();
  };

  // --- Layer Management ---

  const addTextLayer = () => {
    const newLayer: DocumentLayer = {
      id: crypto.randomUUID(),
      type: 'text',
      content: 'Nowy Tekst',
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#000000',
      zIndex: layers.length + 1
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const addImageLayer = (src: string) => {
    const newLayer: DocumentLayer = {
       id: crypto.randomUUID(),
       type: 'image',
       content: src,
       x: 50,
       y: 50,
       width: 200, // Default width
       zIndex: layers.length + 1
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
           if(event.target?.result) {
              addImageLayer(event.target.result as string);
           }
        };
        reader.readAsDataURL(file);
     }
  };

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const updateLayer = (id: string, updates: Partial<DocumentLayer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const moveLayerIndex = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;
    if (direction === 'up' && index < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers);
    } else if (direction === 'down' && index > 0) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  // --- Drag & Drop & Snapping Logic ---

  const prepareDrag = (clientX: number, clientY: number, layerId: string, targetElement: HTMLElement) => {
    setSelectedLayerId(layerId);
    setIsDragging(true);
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Snapshot other layers
    otherLayersRects.current = layers
      .filter(l => l.id !== layerId)
      .map(l => {
         const el = document.getElementById(`layer-${l.id}`);
         if (el) {
            return {
               id: l.id,
               x: l.x,
               y: l.y,
               w: el.offsetWidth,
               h: el.offsetHeight
            };
         }
         return null;
      })
      .filter(Boolean) as any[];

    // Calculate offset in document coordinates
    const layerRect = targetElement.getBoundingClientRect();
    setDragOffset({
       x: (clientX - layerRect.left) / scale,
       y: (clientY - layerRect.top) / scale
    });
  };

  const executeDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !selectedLayerId || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Raw Position
    let rawX = (clientX - canvasRect.left) / scale - dragOffset.x;
    let rawY = (clientY - canvasRect.top) / scale - dragOffset.y;

    // --- SNAPPING ---
    const activeEl = document.getElementById(`layer-${selectedLayerId}`);
    if (!activeEl) return;
    
    const w = activeEl.offsetWidth;
    const h = activeEl.offsetHeight;
    
    let snappedX = rawX;
    let snappedY = rawY;
    const newSnapLines: SnapLine[] = [];

    // Simple snapping logic (edges and centers)
    const currentLeft = rawX; const currentRight = rawX + w; const currentCenterX = rawX + w / 2;
    const currentTop = rawY; const currentBottom = rawY + h; const currentCenterY = rawY + h / 2;

    otherLayersRects.current.forEach(other => {
       const otherRight = other.x + other.w;
       const otherBottom = other.y + other.h;
       const otherCenterX = other.x + other.w / 2;
       const otherCenterY = other.y + other.h / 2;

       // X Snapping
       const checkX = (val1: number, val2: number, set: number) => {
          if (Math.abs(val1 - val2) < SNAP_THRESHOLD) {
             snappedX = set;
             newSnapLines.push({ orientation: 'vertical', position: val2, start: Math.min(currentTop, other.y)-10, end: Math.max(currentBottom, otherBottom)+10 });
          }
       };
       checkX(currentLeft, other.x, other.x);
       checkX(currentLeft, otherRight, otherRight);
       checkX(currentRight, other.x, other.x - w);
       checkX(currentRight, otherRight, otherRight - w);
       checkX(currentCenterX, otherCenterX, otherCenterX - w / 2);

       // Y Snapping
       const checkY = (val1: number, val2: number, set: number) => {
          if (Math.abs(val1 - val2) < SNAP_THRESHOLD) {
             snappedY = set;
             newSnapLines.push({ orientation: 'horizontal', position: val2, start: Math.min(currentLeft, other.x)-10, end: Math.max(currentRight, otherRight)+10 });
          }
       };
       checkY(currentTop, other.y, other.y);
       checkY(currentTop, otherBottom, otherBottom);
       checkY(currentBottom, other.y, other.y - h);
       checkY(currentBottom, otherBottom, otherBottom - h);
       checkY(currentCenterY, otherCenterY, otherCenterY - h / 2);
    });

    setSnapLines(newSnapLines);
    updateLayer(selectedLayerId, { x: snappedX, y: snappedY });
  };

  // Handlers
  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    prepareDrag(e.clientX, e.clientY, layerId, e.currentTarget as HTMLElement);
  };
  const handleMouseMove = (e: React.MouseEvent) => executeDrag(e.clientX, e.clientY);
  const handleMouseUp = () => { setIsDragging(false); setSnapLines([]); };

  const handleTouchStart = (e: React.TouchEvent, layerId: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    prepareDrag(touch.clientX, touch.clientY, layerId, e.currentTarget as HTMLElement);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.cancelable) e.preventDefault(); 
    const touch = e.touches[0];
    executeDrag(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => { setIsDragging(false); setSnapLines([]); };

  const handleContentBlur = (id: string, e: React.FormEvent<HTMLElement>) => {
     updateLayer(id, { content: e.currentTarget.innerText });
  };

  // UI Helpers
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const toggleStyle = (styleKey: keyof DocumentLayer, value: any, offValue: any = 'normal') => {
     if (!selectedLayer) return;
     const current = selectedLayer[styleKey];
     updateLayer(selectedLayer.id, { [styleKey]: current === value ? offValue : value });
  };

  const handleSaveClick = () => {
     if (!name) return toast.error('Podaj nazwę dokumentu');
     setSaveModalOpen(true);
  };

  const confirmSave = () => {
     if (!categoryId) return toast.warning('Wybierz kategorię');
     onSave({ name, categoryId, orientation, layers });
     setSaveModalOpen(false);
  };

  const width = orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX;
  const height = orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[var(--color-background)] flex flex-col animate-fade-in" 
      onMouseUp={handleMouseUp} 
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      
      {/* Top Bar */}
      <div className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
         <div className="flex items-center gap-2 flex-1">
            <Button variant="ghost" size="icon" onClick={onCancel}><X /></Button>
            <input 
               className="bg-transparent font-bold text-base md:text-lg outline-none placeholder-[var(--color-text-secondary)] w-full text-ellipsis" 
               value={name} 
               onChange={e => setName(e.target.value)}
               placeholder="Nazwa Dokumentu..."
            />
         </div>

         <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex" onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}>
               <Layout size={18} className="mr-2"/> {orientation === 'portrait' ? 'Pionowo' : 'Poziomo'}
            </Button>
            <Button onClick={handleSaveClick} className="bg-[var(--color-success)] text-xs md:text-sm px-3 md:px-4"><Save size={16} className="mr-2"/> Zapisz</Button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="h-12 border-b border-[var(--color-border)] bg-[var(--color-background)] flex items-center px-4 overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex items-center gap-2 min-w-max">
             <Button variant="ghost" size="icon" onClick={addTextLayer} title="Dodaj Tekst"><Type size={18}/></Button>
             <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
             <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Dodaj Obraz"><ImageIcon size={18}/></Button>
             <div className="w-[1px] h-6 bg-[var(--color-border)] mx-1"></div>
             
             <div className={`flex items-center gap-1 transition-opacity ${selectedLayer?.type === 'text' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <select 
                  className="bg-transparent text-xs font-bold outline-none w-24 h-8"
                  value={selectedLayer?.fontFamily || 'Inter'}
                  onChange={(e) => selectedLayer && updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                >
                   <option value="Inter">Inter</option>
                   <option value="Space Grotesk">Space Grotesk</option>
                   <option value="Times New Roman">Times New Roman</option>
                   <option value="Courier New">Courier</option>
                </select>
                <input 
                   type="number" 
                   className="w-12 bg-[var(--color-input)] border border-[var(--color-border)] rounded px-1 text-xs h-8" 
                   value={selectedLayer?.fontSize || 16}
                   onChange={(e) => selectedLayer && updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                />
                <Button variant="ghost" size="icon" className={selectedLayer?.fontWeight === 'bold' ? 'bg-[var(--color-secondary)]' : ''} onClick={() => toggleStyle('fontWeight', 'bold')}><Bold size={16}/></Button>
                <Button variant="ghost" size="icon" className={selectedLayer?.fontStyle === 'italic' ? 'bg-[var(--color-secondary)]' : ''} onClick={() => toggleStyle('fontStyle', 'italic')}><Italic size={16}/></Button>
                <Button variant="ghost" size="icon" className={selectedLayer?.textDecoration === 'underline' ? 'bg-[var(--color-secondary)]' : ''} onClick={() => toggleStyle('textDecoration', 'underline', 'none')}><Underline size={16}/></Button>
                <div className="w-[1px] h-6 bg-[var(--color-border)] mx-1"></div>
                <Button variant="ghost" size="icon" onClick={() => selectedLayer && updateLayer(selectedLayer.id, { textAlign: 'left' })}><AlignLeft size={16}/></Button>
                <Button variant="ghost" size="icon" onClick={() => selectedLayer && updateLayer(selectedLayer.id, { textAlign: 'center' })}><AlignCenter size={16}/></Button>
                <Button variant="ghost" size="icon" onClick={() => selectedLayer && updateLayer(selectedLayer.id, { textAlign: 'right' })}><AlignRight size={16}/></Button>
             </div>
          </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
         {/* Layers Panel (Desktop only) */}
         <div className="hidden lg:flex w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex-col shrink-0 z-10 shadow-sm">
            <div className="p-4 font-bold border-b border-[var(--color-border)] flex items-center gap-2">
               <Layers size={18}/> Warstwy
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {[...layers].reverse().map((layer) => ( 
                  <div 
                     key={layer.id}
                     onClick={() => setSelectedLayerId(layer.id)}
                     className={`p-3 rounded-lg border flex items-center justify-between group cursor-pointer ${selectedLayerId === layer.id ? 'bg-[var(--color-primary)] bg-opacity-10 border-[var(--color-primary)]' : 'bg-[var(--color-background)] border-[var(--color-border)]'}`}
                  >
                     <div className="flex items-center gap-2">
                        {layer.type === 'text' ? <Type size={14}/> : <ImageIcon size={14}/>}
                        <span className="text-xs truncate w-24 font-medium">{layer.content.substring(0, 15) || (layer.type === 'image' ? 'Obraz' : 'Bez treści')}</span>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); moveLayerIndex(layer.id, 'up'); }} className="p-1 hover:bg-[var(--color-secondary)] rounded"><ChevronUp size={12}/></button>
                         <button onClick={(e) => { e.stopPropagation(); moveLayerIndex(layer.id, 'down'); }} className="p-1 hover:bg-[var(--color-secondary)] rounded"><ChevronDown size={12}/></button>
                         <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="p-1 text-red-500 hover:bg-red-100 rounded"><Trash2 size={12}/></button>
                     </div>
                  </div>
               ))}
               {layers.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] p-4">Brak warstw</div>}
            </div>
         </div>

         {/* Canvas Container */}
         <div 
            ref={containerRef}
            className="flex-1 bg-[var(--color-secondary)] overflow-auto flex justify-center p-4 relative touch-pan-x touch-pan-y" 
            onClick={() => setSelectedLayerId(null)}
            // Ensure container has height on mobile
            style={{ minHeight: 'calc(100vh - 120px)' }}
         >
            {/* The Actual Page */}
            <div 
               ref={canvasRef}
               className="bg-white shadow-2xl relative transition-transform duration-200 ease-out flex-shrink-0"
               style={{ 
                  width: `${width}px`, 
                  height: `${height}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  // Ensure generous margins for scrolling
                  marginBottom: '200px', 
               }}
            >
               {/* Snapping Lines Overlay */}
               {snapLines.map((line, idx) => (
                  <div 
                     key={idx}
                     className="absolute bg-pink-500 z-50 pointer-events-none"
                     style={{
                        left: line.orientation === 'vertical' ? line.position : line.start,
                        top: line.orientation === 'horizontal' ? line.position : line.start,
                        width: line.orientation === 'vertical' ? '1px' : (line.end - line.start) + 'px',
                        height: line.orientation === 'horizontal' ? '1px' : (line.end - line.start) + 'px',
                     }}
                  ></div>
               ))}

               {layers.map(layer => (
                  <div
                     key={layer.id}
                     id={`layer-${layer.id}`}
                     onMouseDown={(e) => handleMouseDown(e, layer.id)}
                     onTouchStart={(e) => handleTouchStart(e, layer.id)}
                     className={`absolute cursor-move group select-none ${selectedLayerId === layer.id ? 'outline outline-2 outline-[var(--color-primary)] z-50' : 'hover:outline hover:outline-1 hover:outline-[var(--color-primary)]'}`}
                     style={{
                        left: layer.x,
                        top: layer.y,
                        fontSize: layer.type === 'text' ? `${layer.fontSize}px` : undefined,
                        fontFamily: layer.type === 'text' ? layer.fontFamily : undefined,
                        fontWeight: layer.type === 'text' ? layer.fontWeight : undefined,
                        fontStyle: layer.type === 'text' ? layer.fontStyle : undefined,
                        textDecoration: layer.type === 'text' ? layer.textDecoration : undefined,
                        textAlign: layer.type === 'text' ? layer.textAlign : undefined,
                        color: layer.type === 'text' ? layer.color : undefined,
                        width: layer.type === 'image' ? (layer.width ? `${layer.width}px` : 'auto') : undefined,
                        zIndex: layer.zIndex,
                        minWidth: '20px',
                        minHeight: '20px',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.2
                     }}
                  >  
                     {layer.type === 'text' ? (
                        <div 
                           contentEditable 
                           suppressContentEditableWarning
                           onBlur={(e) => handleContentBlur(layer.id, e)}
                           className="outline-none px-1 py-0.5"
                           onMouseDown={(e) => e.stopPropagation()} 
                           onTouchStart={(e) => e.stopPropagation()}
                        >
                           {layer.content}
                        </div>
                     ) : (
                        <img src={layer.content} className="w-full h-auto pointer-events-none" alt="" draggable={false} />
                     )}

                     {selectedLayerId === layer.id && (
                        <>
                           <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--color-primary)] border border-white"></div>
                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-primary)] border border-white"></div>
                           <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--color-primary)] border border-white"></div>
                           <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--color-primary)] border border-white"></div>
                        </>
                     )}
                  </div>
               ))}
            </div>
         </div>

         {/* Floating Zoom Controls */}
         <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-40 bg-[var(--color-surface)] p-2 rounded-lg shadow-xl border border-[var(--color-border)]">
            <Button size="icon" variant="ghost" onClick={handleZoomIn}><ZoomIn size={20}/></Button>
            <div className="text-center text-xs font-bold py-1">{Math.round(scale * 100)}%</div>
            <Button size="icon" variant="ghost" onClick={handleZoomOut}><ZoomOut size={20}/></Button>
            <div className="h-[1px] bg-[var(--color-border)] w-full my-1"></div>
            <Button size="icon" variant={autoFit ? "primary" : "ghost"} onClick={handleFitScreen} title="Dopasuj do ekranu"><Maximize size={20}/></Button>
         </div>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm animate-fade-in border-2 border-[var(--color-primary)]">
               <h3 className="font-bold text-lg mb-4">Zapisz Szablon</h3>
               <div className="space-y-4">
                  <Input label="Nazwa" value={name} onChange={e => setName(e.target.value)} disabled />
                  <div>
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Kategoria</label>
                     <select 
                        value={categoryId} 
                        onChange={e => setCategoryId(e.target.value)}
                        className="w-full bg-[var(--color-input)] border-2 border-transparent rounded-[var(--radius-input)] px-4 py-3 text-[var(--color-text-main)] outline-none"
                     >
                        <option value="">-- Wybierz Kategorię --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                     <Button variant="ghost" onClick={() => setSaveModalOpen(false)}>Anuluj</Button>
                     <Button onClick={confirmSave}>Zapisz Dokument</Button>
                  </div>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};
