(function(){
  const rows = 4, cols = 4; // 4x4 = 16 pieces
  const total = rows * cols;

  const imageSelect = document.getElementById('imageSelect');
  const puzzle = document.getElementById('puzzle');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const startBtn = document.getElementById('startBtn');
  const nextBtn = document.getElementById('nextBtn');
  const status = document.getElementById('status');
  const referenceEl = document.getElementById('reference');

  let currentImage = IMAGES[0];
  let order = [];
  let selectedEl = null;
  let timerSeconds = 360; // 6 minutes
  let timerInterval = null;
  const timerEl = document.getElementById('timer');

  function populateImageSelect(){
    IMAGES.forEach((p, i)=>{
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = `${i+1} - ${p.split('/').pop()}`;
      imageSelect.appendChild(opt);
    });
    imageSelect.value = currentImage;
    imageSelect.addEventListener('change', ()=>{
      currentImage = imageSelect.value;
      // always shuffle when the user selects a different image
      build(true);
      updateReference();
    });
  }

  function createPieceElement(idx){
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.correct = idx;
    el.style.width = (100/cols) + '%';
    el.style.height = (100/rows) + '%';
    el.style.backgroundImage = `url("${currentImage}")`;
    el.style.backgroundSize = `${cols*100}% ${rows*100}%`;
    el.style.backgroundRepeat = 'no-repeat';
    const posX = cols > 1 ? (c / (cols - 1)) * 100 : 50;
    const posY = rows > 1 ? (r / (rows - 1)) * 100 : 50;
    el.style.backgroundPosition = `${posX}% ${posY}%`;
    // apply jigsaw clip-path for this piece
    el.style.clipPath = `url(#clip-${idx})`;
    el.style.webkitClipPath = `url(#clip-${idx})`;
    el.addEventListener('click', onPieceClick);
    return el;
  }

  function build(shuffleOnStart=true){
    puzzle.innerHTML = '';
    // (re)generate clipPaths for current rows/cols layout
    generateClipPaths();
    order = Array.from({length: total}, (_,i)=>i);
    // create pieces in correct order first
    order.forEach((i, pos)=>{
      const el = createPieceElement(i);
      el.dataset.position = pos;
      puzzle.appendChild(el);
    });
    if(shuffleOnStart){
      shuffle();
      // allow interaction immediately after shuffle
      puzzle.classList.remove('disabled');
    } else {
      // keep puzzle disabled until Start when not shuffling
      puzzle.classList.add('disabled');
    }
    updateStatus();
    updateReference();
    // do not auto-start timer on build; enable Start button
    if(startBtn) startBtn.disabled = false;
  }

  function shuffle(){
    // Fisher-Yates on order
    for(let i = order.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    renderOrder();
    updateStatus();
  }

  function renderOrder(){
    // reorder DOM children according to order array
    puzzle.innerHTML = '';
    order.forEach((pieceIdx, pos)=>{
      const el = createPieceElement(pieceIdx);
      el.dataset.position = pos;
      puzzle.appendChild(el);
    });
  }

  function onPieceClick(e){
    const el = e.currentTarget;
    if(!selectedEl){
      selectedEl = el;
      el.classList.add('selected');
    } else if(selectedEl === el){
      selectedEl.classList.remove('selected');
      selectedEl = null;
    } else {
      // swap the two pieces in the order array
      const aPos = parseInt(selectedEl.dataset.position,10);
      const bPos = parseInt(el.dataset.position,10);
      [order[aPos], order[bPos]] = [order[bPos], order[aPos]];
      selectedEl.classList.remove('selected');
      selectedEl = null;
      renderOrder();
      updateStatus();
      if(isSolved()) stopTimer();
    }
  }

  // reset removed (control removed from UI)

  function isSolved(){
    return order.every((val, idx)=> val === idx);
  }

  function updateStatus(){
    if(isSolved()){
      status.textContent = 'Solved!';
      status.style.color = 'green';
      nextBtn.disabled = false;
    } else {
      status.textContent = '';
      status.style.color = '';
      nextBtn.disabled = true;
    }
  }

  function formatTime(s){
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  function updateTimerDisplay(){
    if(timerEl) timerEl.textContent = formatTime(timerSeconds);
  }

  function startTimer(){
    stopTimer();
    timerSeconds = 360;
    updateTimerDisplay();
    if(startBtn) startBtn.disabled = true;
    // ensure pieces are clickable when timer runs
    puzzle.classList.remove('disabled');
    timerInterval = setInterval(()=>{
      timerSeconds--;
      updateTimerDisplay();
      if(timerSeconds <= 0){
        stopTimer();
        onTimeUp();
      }
    }, 1000);
  }

  function stopTimer(){
    if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
  }

  function onTimeUp(){
    status.textContent = "Time's up";
    status.style.color = 'red';
    // disable further clicks
    puzzle.classList.add('disabled');
    nextBtn.disabled = false; // allow moving on
    if(startBtn) startBtn.disabled = false;
  }

  function nextImage(){
    const currentIdx = IMAGES.indexOf(currentImage);
    const nextIdx = (currentIdx + 1) % IMAGES.length;
    currentImage = IMAGES[nextIdx];
    imageSelect.value = currentImage;
    build(true);
  }

  function updateReference(){
    if(referenceEl){
      referenceEl.style.backgroundImage = `url("${currentImage}")`;
      referenceEl.style.backgroundRepeat = 'no-repeat';
      // show full image for mmorgs.jpg, otherwise cover
      if(currentImage.toLowerCase().endsWith('mmorgs.jpg')){
        referenceEl.style.backgroundSize = 'contain';
        referenceEl.style.backgroundPosition = 'center';
      } else {
        referenceEl.style.backgroundSize = 'cover';
        referenceEl.style.backgroundPosition = 'center';
      }
    }
  }

  // generate SVG clipPaths for jigsaw-style pieces
  function generateClipPaths(){
    // remove existing defs container if present
    const existing = document.getElementById('jigsawDefs');
    if(existing) existing.remove();

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('id','jigsawDefs');
    svg.setAttribute('width','0');
    svg.setAttribute('height','0');
    svg.style.position = 'absolute';
    svg.style.left = '-9999px';
    svg.style.top = '-9999px';

    const defs = document.createElementNS(svgNS, 'defs');

    const tabDepth = 0.12; // relative to piece (objectBoundingBox)
    const tabWidth = 0.3;

    for(let idx=0; idx<total; idx++){
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      // determine whether this piece has tabs outward on each side
      const topTab = (r > 0) ? (r % 2 === 0) : false;
      const bottomTab = (r < rows-1) ? (r % 2 !== 0) : false;
      const leftTab = (c > 0) ? (c % 2 !== 0) : false;
      const rightTab = (c < cols-1) ? (c % 2 === 0) : false;

      // Build normalized path in objectBoundingBox coords (0..1)
      const w = 1, h = 1;
      const tw = tabWidth, td = tabDepth;
      // Start at top-left
      let d = `M 0 0 `;
      // top edge
      d += `L ${0.35} 0 `;
      if(topTab){
        d += `C ${0.4} ${-td} ${0.6} ${-td} ${0.65} 0 `;
      } else {
        d += `C ${0.4} ${0} ${0.6} ${0} ${0.65} 0 `;
      }
      d += `L 1 0 `;
      // right edge
      d += `L 1 ${0.35} `;
      if(rightTab){
        d += `C ${1+td} ${0.4} ${1+td} ${0.6} ${1} ${0.65} `;
      } else {
        d += `C ${1} ${0.4} ${1} ${0.6} ${1} ${0.65} `;
      }
      d += `L 1 1 `;
      // bottom edge
      d += `L ${0.65} 1 `;
      if(bottomTab){
        d += `C ${0.6} ${1+td} ${0.4} ${1+td} ${0.35} 1 `;
      } else {
        d += `C ${0.6} ${1} ${0.4} ${1} ${0.35} 1 `;
      }
      d += `L 0 1 `;
      // left edge
      d += `L 0 ${0.65} `;
      if(leftTab){
        d += `C ${-td} ${0.6} ${-td} ${0.4} 0 ${0.35} `;
      } else {
        d += `C 0 ${0.6} 0 ${0.4} 0 ${0.35} `;
      }
      d += `L 0 0 Z`;

      const clip = document.createElementNS(svgNS, 'clipPath');
      clip.setAttribute('id', `clip-${idx}`);
      clip.setAttribute('clipPathUnits','objectBoundingBox');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      clip.appendChild(path);
      defs.appendChild(clip);
    }

    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  // wire controls
  shuffleBtn.addEventListener('click', ()=>{ shuffle(); });
  if(startBtn) startBtn.addEventListener('click', ()=>{ startTimer(); });
  nextBtn.addEventListener('click', ()=>{ nextImage(); });

  // initialize
  populateImageSelect();
  // Build after a short delay so images referenced load properly in many file-based browsers
  build(true);
})();
