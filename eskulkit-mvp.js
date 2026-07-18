const GRADES = [1,2,3,4,5,6];
const GENERIC_TITLES = ["Introduction","Core Concepts","Guided Practice","Application","Review & Recap"];
const GRADE1_TITLES = ["Numbers 1-10","Addition Basics","Shapes & Colors","Reading Words","Days of the Week"];
const EMERGENCY_TUTORIALS = [
  "How to Prepare for an Earthquake",
  "What to Do During an Earthquake (Drop, Cover, and Hold On)",
  "What to Do After an Earthquake",
  "Flood Preparedness and Safety Tips",
  "Typhoon Preparedness Checklist",
  "Fire Prevention and Fire Escape Procedures",
  "Basic First Aid for Common Injuries"
];

function lessonTitles(g){
  const count = LESSON_COUNTS[g] || 5;
  const base = g === 1 ? GRADE1_TITLES : GENERIC_TITLES;
  return base.slice(0, count);
}

// How many lessons each grade actually has — edit these as content is finalized.
const LESSON_COUNTS = {1:3, 2:2, 3:2, 4:2, 5:3, 6:3};

// Grades with a real MP4 video uploaded so far — the rest show "Coming soon" instead of a broken Watch button.
const GRADES_WITH_VIDEO = [1,2,5,6];

// Real material paths — files live in modules/ and video/ folders next to this HTML.
// Naming pattern: [G<grade>]Lesson<n>.pdf (per lesson) and [G<grade>]Video1.mp4 (ONE video per grade, not per lesson)
function pdfPath(grade, i){ return `modules/[G${grade}]Lesson${parseInt(i)+1}.pdf`; }
function videoPath(grade){ return `video/[G${grade}]Video1.mp4`; }

let state = { currentPage:'dashboard', currentGrade:null, progress:{}, videoWatched:{} };

function defaultGradeProgress(grade){
  const count = LESSON_COUNTS[grade] || 5;
  const g = {}; for(let i=0;i<count;i++){ g[i]={module:false,quiz:false,score:null}; } return g;
}
async function loadState(){
  try{
    const res = await window.storage.get('eskulkit-progress');
    if(res && res.value){
      const parsed = JSON.parse(res.value);
      state.progress = parsed.progress || parsed; // support old format
      state.videoWatched = parsed.videoWatched || {};
    }
  }catch(e){}
  GRADES.forEach(g=>{ if(!state.progress[g]) state.progress[g]=defaultGradeProgress(g); });
}
async function saveState(){
  try{ await window.storage.set('eskulkit-progress', JSON.stringify({progress:state.progress, videoWatched:state.videoWatched})); }
  catch(e){ console.error(e); }
}

function gradeCompletion(g){
  const p = state.progress[g]; const totalLessons = LESSON_COUNTS[g] || 5; const total=totalLessons*2; let done=0;
  Object.values(p).forEach(l=>{ if(l.module) done++; if(l.quiz) done++; });
  const lessonsDone = Object.values(p).filter(l=>l.module && l.quiz).length;
  return { pct: Math.round((done/total)*100), lessonsDone, totalLessons };
}

function setActiveNav(page){ document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.page===page)); }
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function render(){
  setActiveNav(state.currentPage);
  document.getElementById('backBtn').style.display = state.currentGrade ? 'inline-flex' : 'none';
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-sub');
  const content = document.getElementById('content');

  if(state.currentPage==='dashboard'){
    titleEl.textContent = 'Student Dashboard';
    subEl.textContent = 'Choose your grade level, watch lessons, and track progress in one place.';
    content.innerHTML = renderDashboard();
    bindDashboard();
  } else if(state.currentPage==='help'){
    titleEl.textContent = 'Help'; subEl.textContent = 'Guides and support';
    content.innerHTML = renderHelp();
  } else {
    if(!state.currentGrade){
      titleEl.textContent = capitalize(state.currentPage);
      subEl.textContent = 'Select a grade level first';
      content.innerHTML = renderNeedGrade();
      return;
    }
    titleEl.textContent = capitalize(state.currentPage==='videos'?'Video':state.currentPage) + ' — Grade ' + state.currentGrade;
    const c = gradeCompletion(state.currentGrade);
    subEl.textContent = c.lessonsDone + '/' + c.totalLessons + ' lessons completed';
    if(state.currentPage==='module') content.innerHTML = renderModules();
    if(state.currentPage==='quiz') content.innerHTML = renderQuizzes();
    if(state.currentPage==='videos') content.innerHTML = renderVideos();
    bindLessonActions();
  }
}

function renderDashboard(){
  let gradeCards = '';
  GRADES.forEach(g=>{
    const c = gradeCompletion(g);
    gradeCards += `<div class="mini-grade-card" data-grade="${g}">
      <h4>Grade ${g}</h4>
      <div class="mg-frac">${c.lessonsDone}/${c.totalLessons} Lessons</div>
      <div class="mg-pct">${c.pct}% complete</div>
    </div>`;
  });

  let tutorials = '';
  EMERGENCY_TUTORIALS.forEach(t=>{
    tutorials += `<li><svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/></svg><span>${t}</span></li>`;
  });

  const grade1Count = LESSON_COUNTS[1] || 3;
  let lessonStrip = '';
  for(let i=0;i<grade1Count;i++){
    lessonStrip += `<div class="lesson-preview-card" data-goto-grade="1" data-goto-lesson="${i}">
      <div class="lp-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="lp-title">Lesson ${i+1}</div>
      <div class="lp-sub">Grade 1</div>
    </div>`;
  }

  const announcements = [
    "Classes are suspended for tomorrow due to heavy rains — stay safe at home.",
    "Free medical and dental check-up from the barangay health center this Friday.",
    "Reminder: bring your own baon and water for the Family Day sa Bukid on the 20th.",
    "Power interruption expected in the area this week — bring printed handouts as backup.",
    "School supplies from the DepEd division office will be distributed next Monday."
  ];
  let announcementItems = '';
  announcements.forEach(a=>{
    announcementItems += `<li><svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/></svg><span>${a}</span></li>`;
  });

  return `
    <div class="dash-grid">
      <div class="panel">
        <div class="panel-header">
          <div><span class="panel-eyebrow">Grade List</span><div class="panel-title">Select Your Level</div></div>
          <button class="panel-link">Select Grade</button>
        </div>
        <div class="mini-grade-grid">${gradeCards}</div>
      </div>
      <div class="panel accent-border">
        <div class="panel-header"><div class="panel-title" style="margin-top:0;font-size:15px;">Emergency Preparedness Tutorials</div></div>
        <ul class="tutorial-list">${tutorials}</ul>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div><span class="panel-eyebrow">Preview</span><div class="panel-title" style="font-size:16px;">Lesson Preview</div></div>
          <button class="panel-link" id="previewCardsBtn">View Module</button>
        </div>
        <div class="lesson-strip">${lessonStrip}</div>
      </div>
      <div class="customize-panel">
        <h4>School Announcements</h4>
        <p>Add school announcements, mission details, or welcome messages for learners.</p>
        <ul class="announcement-list">${announcementItems}</ul>
      </div>
    </div>`;
}

function bindDashboard(){
  document.querySelectorAll('.mini-grade-card').forEach(card=>{
    card.addEventListener('click', ()=>{ state.currentGrade = card.dataset.grade; state.currentPage='module'; render(); });
  });
  document.querySelectorAll('[data-goto-grade]').forEach(card=>{
    card.addEventListener('click', ()=>{ state.currentGrade = card.dataset.gotoGrade; state.currentPage='module'; render(); });
  });
  const pcBtn = document.getElementById('previewCardsBtn');
  if(pcBtn) pcBtn.addEventListener('click', ()=>{ state.currentGrade='1'; state.currentPage='module'; render(); });
}

function renderNeedGrade(){
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    <h4>No grade selected yet</h4>
    <p>Head back to your Dashboard and pick your grade level to unlock modules, quizzes, and videos.</p>
    <button onclick="goDashboard()">Go to Dashboard</button>
  </div>`;
}
function goDashboard(){ state.currentPage='dashboard'; render(); }

function renderModules(){
  const p = state.progress[state.currentGrade];
  const count = LESSON_COUNTS[state.currentGrade] || 5;
  let html = '<div class="lesson-list">';
  for(let i=0;i<count;i++){
    const l = p[i];
    html += `<div class="lesson-card" id="lesson-${i+1}">
      <div class="lesson-left">
        <div class="lesson-num ${l.module?'done':''}">${i+1}</div>
        <div><div class="lesson-title">Lesson ${i+1}</div>
        <div class="lesson-note">${state.currentGrade==='1' ? 'Grade 1 lesson content' : 'Content coming soon — placeholder module'}</div></div>
      </div>
      <div style="display:flex;align-items:center;">
        <button class="act-btn secondary" data-action="open-pdf" data-idx="${i}" style="margin-right:8px;">Open PDF</button>
        <span class="status-pill ${l.module?'done':''}">${l.module?'Completed':'Not started'}</span>
        <button class="act-btn ${l.module?'done-btn':''}" data-action="toggle-module" data-idx="${i}" ${l.module?'disabled':''}>${l.module?'Done':'Mark complete'}</button>
      </div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderQuizzes(){
  const p = state.progress[state.currentGrade];
  const count = LESSON_COUNTS[state.currentGrade] || 5;
  let html = '<div class="lesson-list">';
  for(let i=0;i<count;i++){
    const l = p[i];
    html += `<div class="lesson-card">
      <div class="lesson-left">
        <div class="lesson-num ${l.quiz?'done':''}">${i+1}</div>
        <div><div class="lesson-title">Quiz ${i+1}</div>
        <div class="lesson-note">${l.quiz? 'Score: '+l.score+'/3' : 'Sample quiz — swap with real questions later'}</div></div>
      </div>
      <div style="display:flex;align-items:center;">
        <span class="status-pill ${l.quiz?'done':''}">${l.quiz?'Completed':'Not started'}</span>
        <button class="act-btn ${l.quiz?'secondary':''}" data-action="open-quiz" data-idx="${i}">${l.quiz?'Retake':'Start quiz'}</button>
      </div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderVideos(){
  const grade = parseInt(state.currentGrade);
  const hasVideo = GRADES_WITH_VIDEO.includes(grade);
  const watched = !!state.videoWatched[grade];

  if(!hasVideo){
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/></svg>
      <h4>Video coming soon</h4>
      <p>The video for Grade ${grade} hasn't been uploaded yet. Check back soon.</p>
    </div>`;
  }

  return `<div class="video-hero" style="cursor:pointer;" data-action="watch-grade-video">
      <div class="playbtn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="caption">Grade ${grade} Video</div>
      <div class="subcaption">${watched ? 'Watched — tap to watch again' : 'Tap to watch'}</div>
    </div>`;
}

function renderHelp(){
  return `<div class="lesson-list">
    <div class="lesson-card"><div class="lesson-left"><div class="lesson-num">1</div>
      <div><div class="lesson-title">How do I start a lesson?</div><div class="lesson-note">Pick your grade on the Dashboard, then open Module, Quiz, or Video from the sidebar.</div></div></div></div>
    <div class="lesson-card"><div class="lesson-left"><div class="lesson-num">2</div>
      <div><div class="lesson-title">Where is my progress saved?</div><div class="lesson-note">Your progress updates automatically on the Dashboard as you complete modules and quizzes.</div></div></div></div>
    <div class="lesson-card"><div class="lesson-left"><div class="lesson-num">3</div>
      <div><div class="lesson-title">Need more help?</div><div class="lesson-note">Ask your teacher, or use the Help icon anytime from the sidebar.</div></div></div></div>
  </div>`;
}

function bindLessonActions(){
  document.querySelectorAll('[data-action="toggle-module"]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{ state.progress[state.currentGrade][btn.dataset.idx].module = true; await saveState(); render(); });
  });
  document.querySelectorAll('[data-action="watch-grade-video"]').forEach(el=>{
    el.addEventListener('click', ()=> openVideoModal());
  });
  document.querySelectorAll('[data-action="open-pdf"]').forEach(btn=>{
    btn.addEventListener('click', ()=> openPdfModal(btn.dataset.idx));
  });
  document.querySelectorAll('[data-action="open-quiz"]').forEach(btn=>{
    btn.addEventListener('click', ()=> openQuiz(btn.dataset.idx));
  });
}

const SAMPLE_QUESTIONS = [
  { q:"Which number comes after 7?", opts:["6","8","9"], correct:1 },
  { q:"Which of these is a vowel?", opts:["B","E","K"], correct:1 },
  { q:"What is 3 + 4?", opts:["6","7","8"], correct:1 }
];
let quizAnswers = [];

function openQuiz(idx){
  quizAnswers = new Array(SAMPLE_QUESTIONS.length).fill(null);
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalBody').classList.remove('modal-lg');
  document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, false);
  overlay.classList.add('open');
  bindQuizOptions(idx);
  document.getElementById('quizCancel').addEventListener('click', closeModal);
  document.getElementById('quizSubmit').addEventListener('click', ()=> submitQuiz(idx));
}
function buildQuizHtml(idx, showResult, score){
  let html = `<h3>Quiz ${parseInt(idx)+1}</h3><div class="sub">Sample questions — replace with real content later</div>`;
  if(showResult) html += `<div class="result-banner">You scored ${score}/${SAMPLE_QUESTIONS.length}</div>`;
  SAMPLE_QUESTIONS.forEach((q,qi)=>{
    html += `<div class="q-block"><div class="q-text">${qi+1}. ${q.q}</div>`;
    q.opts.forEach((opt,oi)=>{
      let cls = 'q-opt';
      if(quizAnswers[qi]===oi) cls += ' selected';
      if(showResult){ if(oi===q.correct) cls += ' correct'; else if(quizAnswers[qi]===oi) cls += ' incorrect'; }
      html += `<button class="${cls}" data-q="${qi}" data-o="${oi}" ${showResult?'disabled':''}>${opt}</button>`;
    });
    html += `</div>`;
  });
  html += `<div class="modal-actions"><button class="cancel" id="quizCancel">${showResult?'Close':'Cancel'}</button>
    ${showResult?'':'<button class="submit" id="quizSubmit">Submit answers</button>'}</div>`;
  return html;
}
function bindQuizOptions(idx){
  document.querySelectorAll('.q-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      quizAnswers[btn.dataset.q] = parseInt(btn.dataset.o);
      document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, false);
      bindQuizOptions(idx);
      document.getElementById('quizCancel').addEventListener('click', closeModal);
      document.getElementById('quizSubmit').addEventListener('click', ()=> submitQuiz(idx));
    });
  });
}
async function submitQuiz(idx){
  let score = 0;
  SAMPLE_QUESTIONS.forEach((q,qi)=>{ if(quizAnswers[qi]===q.correct) score++; });
  document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, true, score);
  document.getElementById('quizCancel').addEventListener('click', async ()=>{
    state.progress[state.currentGrade][idx].quiz = true;
    state.progress[state.currentGrade][idx].score = score;
    await saveState(); closeModal(); render();
  });
}
function closeModal(){ document.getElementById('modalOverlay').classList.remove('open'); }

function openPdfModal(idx){
  const grade = state.currentGrade;
  const src = pdfPath(grade, idx);
  const overlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  modalBody.classList.add('modal-lg');
  modalBody.innerHTML = `
    <h3>Lesson ${parseInt(idx)+1}</h3>
    <iframe src="${src}" style="width:100%;height:70vh;border:1.5px solid var(--line);border-radius:12px;background:#f5f5f5;"></iframe>
    <div class="modal-actions"><button class="cancel" id="pdfCancel">Close</button></div>
  `;
  overlay.classList.add('open');
  document.getElementById('pdfCancel').addEventListener('click', ()=>{
    modalBody.classList.remove('modal-lg');
    closeModal();
  });
}

function openVideoModal(){
  const grade = parseInt(state.currentGrade);
  const src = videoPath(grade);
  const overlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  modalBody.classList.add('modal-lg');
  modalBody.innerHTML = `
    <h3>Grade ${grade} Video</h3>
    <video id="lessonVideoPlayer" controls autoplay style="width:100%;border-radius:12px;background:#000;max-height:75vh;">
      <source src="${src}" type="video/mp4">
    </video>
    <div id="videoMissingNote" style="display:none;font-size:12.5px;color:var(--muted);margin-top:8px;">
      Couldn't find <strong>${src}</strong>. Make sure the video/ folder sits next to this HTML file with that exact filename.
    </div>
    <div class="modal-actions"><button class="cancel" id="videoCancel">Close</button></div>
  `;
  overlay.classList.add('open');
  const player = document.getElementById('lessonVideoPlayer');
  player.addEventListener('error', ()=>{ document.getElementById('videoMissingNote').style.display='block'; });
  document.getElementById('videoCancel').addEventListener('click', async ()=>{
    state.videoWatched[grade] = true;
    await saveState();
    player.pause();
    modalBody.classList.remove('modal-lg');
    closeModal();
    render();
  });
}

document.getElementById('nav').addEventListener('click', (e)=>{
  const btn = e.target.closest('.nav-item'); if(!btn) return;
  state.currentPage = btn.dataset.page; render();
});
document.getElementById('backBtn').addEventListener('click', ()=>{
  state.currentGrade = null; state.currentPage = 'dashboard'; render();
});

(async function init(){ await loadState(); render(); })();