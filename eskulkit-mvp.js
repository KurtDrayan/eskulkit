// ============================================================
//  CONFIGURATION
// ============================================================

const GRADES = [1, 2, 3, 4, 5, 6];
const GENERIC_TITLES = ["Introduction", "Core Concepts", "Guided Practice", "Application", "Review & Recap"];
const GRADE1_TITLES = ["Numbers 1-10", "Addition Basics", "Shapes & Colors", "Reading Words", "Days of the Week"];

const LESSON_COUNTS = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3 };
const GRADES_WITH_VIDEO = [1, 2, 5, 6];

// ---- EMERGENCY TUTORIALS & PUBMAT MAPPING ----
const EMERGENCY_TUTORIALS = [
    "How to Prepare for an Earthquake",
    "What to Do During an Earthquake (Drop, Cover, and Hold On)",
    "What to Do After an Earthquake",
    "Flood Preparedness and Safety Tips",
    "Typhoon Preparedness Checklist",
    "Fire Prevention and Fire Escape Procedures",
    "Basic First Aid for Common Injuries"
];

// Map each tutorial title → image filename (inside /emergency/)
const EMERGENCY_MAP = {
    "How to Prepare for an Earthquake": "earthquake1.png",
    "What to Do During an Earthquake (Drop, Cover, and Hold On)": "earthquake2.png",
    "What to Do After an Earthquake": "earthquake1.png",
    "Flood Preparedness and Safety Tips": "rainfall.png",
    "Typhoon Preparedness Checklist": "rainfall.png",
    "Fire Prevention and Fire Escape Procedures": "fire1.png",
    "Basic First Aid for Common Injuries": "firstaid1.png"
};

// Optional: a short label for each tutorial shown in the modal header
const EMERGENCY_LABEL = {
    "How to Prepare for an Earthquake": "Earthquake Preparedness",
    "What to Do During an Earthquake (Drop, Cover, and Hold On)": "Earthquake Safety — During",
    "What to Do After an Earthquake": "Earthquake Safety — After",
    "Flood Preparedness and Safety Tips": "Flood Safety",
    "Typhoon Preparedness Checklist": "Typhoon Preparedness",
    "Fire Prevention and Fire Escape Procedures": "Fire Safety",
    "Basic First Aid for Common Injuries": "First Aid Procedures"
};

// ---- PATHS ----
function pdfPath(grade, i) { return `modules/[G${grade}]Lesson${parseInt(i)+1}.pdf`; }

function videoPath(grade) { return `video/[G${grade}]Video1.mp4`; }

function emergencyImagePath(filename) { return `emergency/${filename}`; }

// ============================================================
//  STATE
// ============================================================

let state = {
    currentPage: 'dashboard',
    currentGrade: null,
    progress: {},
    videoWatched: {}
};

function defaultGradeProgress(grade) {
    const count = LESSON_COUNTS[grade] || 5;
    const g = {};
    for (let i = 0; i < count; i++) { g[i] = { module: false, quiz: false, score: null }; }
    return g;
}

async function loadState() {
    try {
        const res = await window.storage.get('eskulkit-progress');
        if (res && res.value) {
            const parsed = JSON.parse(res.value);
            state.progress = parsed.progress || parsed;
            state.videoWatched = parsed.videoWatched || {};
        }
    } catch (e) {}
    GRADES.forEach(g => { if (!state.progress[g]) state.progress[g] = defaultGradeProgress(g); });
}

async function saveState() {
    try { await window.storage.set('eskulkit-progress', JSON.stringify({ progress: state.progress, videoWatched: state
                .videoWatched })); } catch (e) { console.error(e); }
}

function gradeCompletion(g) {
    const p = state.progress[g];
    const totalLessons = LESSON_COUNTS[g] || 5;
    const total = totalLessons * 2;
    let done = 0;
    Object.values(p).forEach(l => { if (l.module) done++; if (l.quiz) done++; });
    const lessonsDone = Object.values(p).filter(l => l.module && l.quiz).length;
    return { pct: Math.round((done / total) * 100), lessonsDone, totalLessons };
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ============================================================
//  RENDER FUNCTIONS
// ============================================================

function render() {
    setActiveNav(state.currentPage);
    document.getElementById('backBtn').style.display = state.currentGrade ? 'inline-flex' : 'none';
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-sub');
    const content = document.getElementById('content');

    if (state.currentPage === 'dashboard') {
        titleEl.textContent = 'Student Dashboard';
        subEl.textContent = 'Choose your grade level, watch lessons, and track progress in one place.';
        content.innerHTML = renderDashboard();
        bindDashboard();
    } else {
        if (!state.currentGrade) {
            titleEl.textContent = capitalize(state.currentPage);
            subEl.textContent = 'Select a grade level first';
            content.innerHTML = renderNeedGrade();
            return;
        }
        titleEl.textContent = capitalize(state.currentPage === 'videos' ? 'Video' : state.currentPage) + ' — Grade ' + state
            .currentGrade;
        const c = gradeCompletion(state.currentGrade);
        subEl.textContent = c.lessonsDone + '/' + c.totalLessons + ' lessons completed';
        if (state.currentPage === 'module') content.innerHTML = renderModules();
        if (state.currentPage === 'quiz') content.innerHTML = renderQuizzes();
        if (state.currentPage === 'videos') content.innerHTML = renderVideos();
        bindLessonActions();
    }
}

function renderDashboard() {
    let gradeCards = '';
    GRADES.forEach(g => {
        const c = gradeCompletion(g);
        gradeCards += `<div class="mini-grade-card" data-grade="${g}">
            <h4>Grade ${g}</h4>
            <div class="mg-frac">${c.lessonsDone}/${c.totalLessons} Lessons</div>
            <div class="mg-pct">${c.pct}% complete</div>
        </div>`;
    });

    let tutorials = '';
    EMERGENCY_TUTORIALS.forEach(t => {
        tutorials += `<li data-tutorial="${t}">
            <svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/></svg>
            <span class="tut-label">${t}</span>
            <span class="tut-arrow">↗</span>
        </li>`;
    });

    const grade1Count = LESSON_COUNTS[1] || 3;
    let lessonStrip = '';
    for (let i = 0; i < grade1Count; i++) {
        lessonStrip += `<div class="lesson-preview-card" data-goto-grade="1" data-goto-lesson="${i}">
            <div class="lp-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
            <div class="lp-title">Lesson ${i+1}</div>
            <div class="lp-sub">Grade 1</div>
        </div>`;
    }

    return `
        <div class="dash-grid">
            <div class="panel panel-gradelist">
                <div class="panel-header">
                    <div><span class="panel-eyebrow">Grade List</span><div class="panel-title">Select Your Level</div></div>
                    <button class="panel-link">Select Grade</button>
                </div>
                <div class="mini-grade-grid">${gradeCards}</div>
            </div>
            <div class="panel accent-border panel-emergency">
                <div class="panel-header"><div class="panel-title" style="margin-top:0;font-size:15px;">Emergency Preparedness Tutorials</div></div>
                <ul class="tutorial-list">${tutorials}</ul>
            </div>
            <div class="panel panel-lessons">
                <div class="panel-header">
                    <div><span class="panel-eyebrow">Preview</span><div class="panel-title" style="font-size:16px;">Lesson Preview</div></div>
                    <button class="panel-link" id="previewCardsBtn">View Module</button>
                </div>
                <div class="lesson-strip">${lessonStrip}</div>
            </div>
            
            <!-- REPLACED: DepEd Vision, Mission, Core Values -->
            <div class="customize-panel panel-announcements">
                <h4 style="font-size:16px; margin-bottom:2px;">Department of Education (DepEd)</h4>
                <p style="font-size:13px; color:var(--muted); margin-top:0; margin-bottom:12px; border-bottom:1px solid var(--line); padding-bottom:8px;">Republic of the Philippines</p>
                
                <h5 style="font-size:14px; margin:10px 0 4px; color:var(--accent-red);">I. Vision</h5>
                <p style="font-size:13.5px; margin:0 0 10px; line-height:1.6;">The Department of Education envisions a nation of patriotic Filipinos whose core values and competencies empower them to achieve their full potential and contribute meaningfully to sustainable nation-building.</p>
                
                <h5 style="font-size:14px; margin:10px 0 4px; color:var(--accent-red);">II. Mission</h5>
                <p style="font-size:13.5px; margin:0 0 10px; line-height:1.6;">To uphold, protect, and promote the constitutional right of every Filipino citizen to a quality, equitable, culture-based, and complete basic education.</p>
                
                <h5 style="font-size:14px; margin:10px 0 4px; color:var(--accent-red);">III. Core Values</h5>
                <p style="font-size:13.5px; margin:0 0 6px; line-height:1.6;">The institutional and operational culture of the Department is anchored on four foundational principles:</p>
                <ul style="list-style:none; padding:0; margin:0; font-size:13.5px; line-height:1.8;">
                    <li style="display:flex; gap:8px; align-items:baseline;"><span style="font-weight:700; color:var(--accent-orange);">•</span> <strong>Maka-Diyos</strong> (Reverence and Faith)</li>
                    <li style="display:flex; gap:8px; align-items:baseline;"><span style="font-weight:700; color:var(--accent-orange);">•</span> <strong>Maka-Tao</strong> (Humanity and Social Responsibility)</li>
                    <li style="display:flex; gap:8px; align-items:baseline;"><span style="font-weight:700; color:var(--accent-orange);">•</span> <strong>Makakalikasan</strong> (Environmental Stewardship)</li>
                    <li style="display:flex; gap:8px; align-items:baseline;"><span style="font-weight:700; color:var(--accent-orange);">•</span> <strong>Makabansa</strong> (Patriotism and Civic Duty)</li>
                </ul>
            </div>
        </div>`;
}

function bindDashboard() {
    document.querySelectorAll('.mini-grade-card').forEach(card => {
        card.addEventListener('click', () => { state.currentGrade = card.dataset.grade;
            state.currentPage = 'module';
            render(); });
    });
    document.querySelectorAll('[data-goto-grade]').forEach(card => {
        card.addEventListener('click', () => { state.currentGrade = card.dataset.gotoGrade;
            state.currentPage = 'module';
            render(); });
    });
    const pcBtn = document.getElementById('previewCardsBtn');
    if (pcBtn) pcBtn.addEventListener('click', () => { state.currentGrade = '1';
        state.currentPage = 'module';
        render(); });

    // Emergency tutorial clicks → open modal with image
    document.querySelectorAll('.tutorial-list li').forEach(li => {
        li.addEventListener('click', function(e) {
            const title = this.dataset.tutorial;
            openEmergencyModal(title);
        });
    });
}

function renderNeedGrade() {
    return `<div class="empty-state">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        <h4>No grade selected yet</h4>
        <p>Head back to your Dashboard and pick your grade level to unlock modules, quizzes, and videos.</p>
        <button onclick="goDashboard()">Go to Dashboard</button>
    </div>`;
}

function goDashboard() { state.currentPage = 'dashboard';
    render(); }

function renderModules() {
    const p = state.progress[state.currentGrade];
    const count = LESSON_COUNTS[state.currentGrade] || 5;
    let html = '<div class="lesson-list">';
    for (let i = 0; i < count; i++) {
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

function renderQuizzes() {
    const p = state.progress[state.currentGrade];
    const count = LESSON_COUNTS[state.currentGrade] || 5;
    let html = '<div class="lesson-list">';
    for (let i = 0; i < count; i++) {
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

function renderVideos() {
    const grade = parseInt(state.currentGrade);
    const hasVideo = GRADES_WITH_VIDEO.includes(grade);
    const watched = !!state.videoWatched[grade];

    if (!hasVideo) {
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

function bindLessonActions() {
    document.querySelectorAll('[data-action="toggle-module"]').forEach(btn => {
        btn.addEventListener('click', async () => { state.progress[state.currentGrade][btn.dataset.idx].module =
                true;
            await saveState();
            render(); });
    });
    document.querySelectorAll('[data-action="watch-grade-video"]').forEach(el => {
        el.addEventListener('click', () => openVideoModal());
    });
    document.querySelectorAll('[data-action="open-pdf"]').forEach(btn => {
        btn.addEventListener('click', () => openPdfModal(btn.dataset.idx));
    });
    document.querySelectorAll('[data-action="open-quiz"]').forEach(btn => {
        btn.addEventListener('click', () => openQuiz(btn.dataset.idx));
    });
}

// ============================================================
//  EMERGENCY MODAL (with Zoom + Drag)
// ============================================================

function openEmergencyModal(title) {
    // Reset zoom and pan for fresh start
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0,
        startY = 0;
    let startPanX = 0,
        startPanY = 0;

    const overlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    modalBody.classList.remove('modal-lg');

    const filename = EMERGENCY_MAP[title] || '';
    const label = EMERGENCY_LABEL[title] || title;
    const imgPath = filename ? emergencyImagePath(filename) : '';

    let content = `<h3>${label}</h3>`;
    content += `<div class="sub">${title}</div>`;
    content += `<div class="emergency-modal-img-wrapper" id="pubmatWrapper">`;

    if (imgPath) {
        content += `<img src="${imgPath}" alt="${title}" id="pubmatImage" class="emergency-modal-img" style="transform: translate(0px, 0px) scale(1);" onerror="this.style.display='none';document.getElementById('fallbackMsg').style.display='block'" />`;
        content += `<div id="fallbackMsg" style="display:none;" class="emergency-modal-fallback">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
            <p>Image not found: <strong>${filename}</strong><br />Make sure the file exists inside the <code>/emergency/</code> folder.</p>
        </div>`;
    } else {
        content += `<div class="emergency-modal-fallback">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
            <p>No image mapped for this tutorial.</p>
        </div>`;
    }
    content += `</div>`;

    // Zoom Controls
    content += `<div class="zoom-controls">
        <button id="zoomOutBtn" title="Zoom Out">−</button>
        <span class="zoom-level" id="zoomLevelDisplay">100%</span>
        <button id="zoomInBtn" title="Zoom In">+</button>
        <button id="zoomResetBtn" title="Reset Zoom">Reset</button>
    </div>`;

    content += `<div class="modal-actions"><button class="cancel" id="emergencyModalClose">Close</button></div>`;
    modalBody.innerHTML = content;
    overlay.classList.add('open');

    const img = document.getElementById('pubmatImage');
    const wrapper = document.getElementById('pubmatWrapper');

    // --- Helper: Apply Transform ---
    function applyTransform() {
        if (img) {
            img.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
            document.getElementById('zoomLevelDisplay').textContent = Math.round(zoom * 100) + '%';
        }
    }

    // --- Zoom Functions ---
    function zoomIn() {
        zoom = Math.min(3, zoom + 0.25);
        applyTransform();
    }

    function zoomOut() {
        zoom = Math.max(0.5, zoom - 0.25);
        applyTransform();
    }

    function zoomReset() {
        zoom = 1;
        panX = 0;
        panY = 0;
        applyTransform();
    }

    // --- Drag/Pan Functions (Mouse) ---
    function onDragStart(e) {
        if (!img) return;
        isDragging = true;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX === undefined) return;
        startX = clientX;
        startY = clientY;
        startPanX = panX;
        startPanY = panY;
        wrapper.classList.add('dragging');
        wrapper.style.cursor = 'grabbing';
        e.preventDefault();
    }

    function onDragMove(e) {
        if (!isDragging || !img) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX === undefined) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        panX = startPanX + dx;
        panY = startPanY + dy;
        applyTransform();
        e.preventDefault();
    }

    function onDragEnd(e) {
        if (isDragging) {
            isDragging = false;
            wrapper.classList.remove('dragging');
            wrapper.style.cursor = 'grab';
        }
    }

    // --- Attach Events ---
    if (img && wrapper) {
        // Mouse events
        wrapper.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);

        // Touch events
        wrapper.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd, { passive: false });

        // Prevent context menu on long press (annoying)
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // --- Attach Zoom Controls ---
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const closeBtn = document.getElementById('emergencyModalClose');

    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', zoomReset);

    // --- Close handler ---
    function cleanupAndClose() {
        // Clean up global listeners to prevent memory leaks
        if (img && wrapper) {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
        }
        overlay.classList.remove('open');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', cleanupAndClose);
    }
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            cleanupAndClose();
        }
    });
}

// ============================================================
//  QUIZ / PDF / VIDEO MODALS
// ============================================================

const SAMPLE_QUESTIONS = [
    { q: "Which number comes after 7?", opts: ["6", "8", "9"], correct: 1 },
    { q: "Which of these is a vowel?", opts: ["B", "E", "K"], correct: 1 },
    { q: "What is 3 + 4?", opts: ["6", "7", "8"], correct: 1 }
];
let quizAnswers = [];

function openQuiz(idx) {
    quizAnswers = new Array(SAMPLE_QUESTIONS.length).fill(null);
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalBody').classList.remove('modal-lg');
    document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, false);
    overlay.classList.add('open');
    bindQuizOptions(idx);
    document.getElementById('quizCancel').addEventListener('click', closeModal);
    document.getElementById('quizSubmit').addEventListener('click', () => submitQuiz(idx));
}

function buildQuizHtml(idx, showResult, score) {
    let html = `<h3>Quiz ${parseInt(idx)+1}</h3><div class="sub">Sample questions — replace with real content later</div>`;
    if (showResult) html += `<div class="result-banner">You scored ${score}/${SAMPLE_QUESTIONS.length}</div>`;
    SAMPLE_QUESTIONS.forEach((q, qi) => {
        html += `<div class="q-block"><div class="q-text">${qi+1}. ${q.q}</div>`;
        q.opts.forEach((opt, oi) => {
            let cls = 'q-opt';
            if (quizAnswers[qi] === oi) cls += ' selected';
            if (showResult) { if (oi === q.correct) cls += ' correct';
                else if (quizAnswers[qi] === oi) cls += ' incorrect'; }
            html += `<button class="${cls}" data-q="${qi}" data-o="${oi}" ${showResult?'disabled':''}>${opt}</button>`;
        });
        html += `</div>`;
    });
    html += `<div class="modal-actions"><button class="cancel" id="quizCancel">${showResult?'Close':'Cancel'}</button>
        ${showResult?'':'<button class="submit" id="quizSubmit">Submit answers</button>'}</div>`;
    return html;
}

function bindQuizOptions(idx) {
    document.querySelectorAll('.q-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            quizAnswers[btn.dataset.q] = parseInt(btn.dataset.o);
            document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, false);
            bindQuizOptions(idx);
            document.getElementById('quizCancel').addEventListener('click', closeModal);
            document.getElementById('quizSubmit').addEventListener('click', () => submitQuiz(idx));
        });
    });
}

async function submitQuiz(idx) {
    let score = 0;
    SAMPLE_QUESTIONS.forEach((q, qi) => { if (quizAnswers[qi] === q.correct) score++; });
    document.getElementById('modalBody').innerHTML = buildQuizHtml(idx, true, score);
    document.getElementById('quizCancel').addEventListener('click', async () => {
        state.progress[state.currentGrade][idx].quiz = true;
        state.progress[state.currentGrade][idx].score = score;
        await saveState();
        closeModal();
        render();
    });
}

function closeModal() {
    // Ensure any lingering drag listeners from emergency modal are removed (though they are scoped)
    document.getElementById('modalOverlay').classList.remove('open');
}

function openPdfModal(idx) {
    const grade = state.currentGrade;
    const relSrc = pdfPath(grade, idx);
    const absSrc = new URL(relSrc, window.location.href).href;
    const viewerSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(absSrc)}&embedded=true`;
    const overlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    modalBody.classList.add('modal-lg');
    modalBody.innerHTML = `
        <h3>Lesson ${parseInt(idx)+1}</h3>
        <iframe src="${viewerSrc}" style="width:100%;height:70vh;border:1.5px solid var(--line);border-radius:12px;background:#f5f5f5;"></iframe>
        <div style="font-size:12.5px;color:var(--muted);margin-top:8px;">
            Not loading? <a href="${absSrc}" target="_blank">Open the PDF directly</a> instead.
        </div>
        <div class="modal-actions"><button class="cancel" id="pdfCancel">Close</button></div>
    `;
    overlay.classList.add('open');
    document.getElementById('pdfCancel').addEventListener('click', () => {
        modalBody.classList.remove('modal-lg');
        closeModal();
    });
}

function openVideoModal() {
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
    player.addEventListener('error', () => { document.getElementById('videoMissingNote').style.display = 'block'; });
    document.getElementById('videoCancel').addEventListener('click', async () => {
        state.videoWatched[grade] = true;
        await saveState();
        player.pause();
        modalBody.classList.remove('modal-lg');
        closeModal();
        render();
    });
}

// ============================================================
//  NAVIGATION & INIT
// ============================================================

document.getElementById('nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    state.currentPage = btn.dataset.page;
    render();
});
document.getElementById('backBtn').addEventListener('click', () => {
    state.currentGrade = null;
    state.currentPage = 'dashboard';
    render();
});

(async function init() {
    await loadState();
    render();
})();

window.goDashboard = goDashboard;