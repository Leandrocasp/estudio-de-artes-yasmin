// Estúdio de Artes — Vanilla JS (pronto para GitHub Pages)
(function(){
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const colorEl = document.getElementById('color');
  const sizeEl = document.getElementById('size');
  const opacityEl = document.getElementById('opacity');
  const brushBtn = document.getElementById('brush');
  const eraserBtn = document.getElementById('eraser');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const clearBtn = document.getElementById('clear');
  const exportBtn = document.getElementById('export');
  const copyBtn = document.getElementById('copy');
  const autosaveEl = document.getElementById('autosave');
  const statesEl = document.getElementById('states');
  let drawing = false;
  let mode = 'brush';
  let last = null;
  const HISTORY_LIMIT = 50;
  let history = [];
  let redoStack = [];
  const STORAGE_KEY = 'yasmin_studio_v1';

  function fitCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // redraw last state if exists
    const lastState = history[history.length-1];
    if(lastState) restoreFromDataURL(lastState);
  }

  function getPointer(e){
    const rect = canvas.getBoundingClientRect();
    const p = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  function start(e){
    e.preventDefault();
    drawing = true;
    last = getPointer(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    draw(e); // tiny dot
  }

  function draw(e){
    if(!drawing) return;
    const p = getPointer(e);
    ctx.strokeStyle = (mode === 'eraser') ? '#ffffff' : colorEl.value;
    ctx.lineWidth = Number(sizeEl.value);
    ctx.globalAlpha = Number(opacityEl.value);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    last = p;
  }

  function stop(e){
    if(!drawing) return;
    drawing = false;
    ctx.beginPath();
    pushHistory();
  }

  function pushHistory(){
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tctx = tmp.getContext('2d');
    // draw at display size
    tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
    const data = tmp.toDataURL('image/png');
    history.push(data);
    if(history.length > HISTORY_LIMIT) history.shift();
    redoStack = [];
    updateStates();
    if(autosaveEl.checked) localStorage.setItem(STORAGE_KEY, data);
  }

  function undo(){
    if(history.length <= 1) return;
    const last = history.pop();
    redoStack.unshift(last);
    const prev = history[history.length-1];
    restoreFromDataURL(prev);
    updateStates();
  }

  function redo(){
    if(redoStack.length === 0) return;
    const next = redoStack.shift();
    history.push(next);
    restoreFromDataURL(next);
    updateStates();
  }

  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pushHistory();
  }

  function restoreFromDataURL(dataURL){
    const img = new Image();
    img.onload = function(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataURL;
  }

  function exportPNG(){
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    tmp.getContext('2d').drawImage(canvas,0,0,tmp.width,tmp.height);
    const url = tmp.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yasmin-art.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyImage(){
    try{
      const blob = await new Promise(r => canvas.toBlob(r));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Imagem copiada para a área de transferência');
    }catch(err){
      alert('Não foi possível copiar: ' + (err && err.message ? err.message : err));
    }
  }

  function loadSaved(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
      history.push(saved);
      restoreFromDataURL(saved);
    } else {
      // initial empty state
      pushHistory();
    }
    updateStates();
  }

  function updateStates(){
    statesEl.textContent = String(history.length);
  }

  // events
  window.addEventListener('resize', fitCanvas);
  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', draw);
  window.addEventListener('pointerup', stop);
  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', draw, {passive:false});
  canvas.addEventListener('touchend', stop);

  brushBtn.addEventListener('click', ()=>{ mode='brush'; brushBtn.classList.add('primary'); eraserBtn.classList.remove('primary'); });
  eraserBtn.addEventListener('click', ()=>{ mode='eraser'; eraserBtn.classList.add('primary'); brushBtn.classList.remove('primary'); });
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', ()=>{ if(confirm('Limpar a tela?')) clearCanvas(); });
  exportBtn.addEventListener('click', exportPNG);
  copyBtn.addEventListener('click', copyImage);

  // keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); undo(); }
    if(e.key.toLowerCase()==='e') { mode='eraser'; eraserBtn.classList.add('primary'); brushBtn.classList.remove('primary'); }
    if(e.key.toLowerCase()==='b') { mode='brush'; brushBtn.classList.add('primary'); eraserBtn.classList.remove('primary'); }
  });

  // init
  fitCanvas();
  loadSaved();
})();
