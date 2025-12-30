(function(){
  const rows = 2, cols = 7; // 2x7 = 14 pieces
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
      opt.textContent = p.split('/').pop();
      imageSelect.appendChild(opt);
    });
    imageSelect.value = currentImage;
    imageSelect.addEventListener('change', ()=>{
      currentImage = imageSelect.value;
      build(false);
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
    const posX = (c / cols) * 100;
    const posY = (r / rows) * 100;
    el.style.backgroundPosition = `${posX}% ${posY}%`;
    el.addEventListener('click', onPieceClick);
    return el;
  }

  function build(shuffleOnStart=true){
    puzzle.innerHTML = '';
    order = Array.from({length: total}, (_,i)=>i);
    // create pieces in correct order first
    order.forEach((i, pos)=>{
      const el = createPieceElement(i);
      el.dataset.position = pos;
      puzzle.appendChild(el);
    });
    if(shuffleOnStart) shuffle();
    updateStatus();
    updateReference();
    // do not auto-start timer on build; enable Start button and disable puzzle interactions until Start
    if(startBtn) startBtn.disabled = false;
    puzzle.classList.add('disabled');
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
    }
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
