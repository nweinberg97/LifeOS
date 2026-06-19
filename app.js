/**
 * LifeOS Core Application Logic Engine
 * Architecture: Object-Oriented Component State Design (Local-First Data Sync)
 */

// Global App State Object
let state = {
    tasks: [],
    notes: [],
    boards: [],
    events: [],
    universalInbox: [],
    recentActivity: []
};

// ================= STORAGE REWRITE CONTROLLER =================
const StorageManager = {
    init() {
        if (!localStorage.getItem('lifeos_state')) {
            this.seedMockData();
        } else {
            this.load();
        }
    },
    load() {
        try {
            state = JSON.parse(localStorage.getItem('lifeos_state'));
        } catch (e) {
            console.error("Error breaking state cache storage.", e);
        }
    },
    save() {
        localStorage.setItem('lifeos_state', JSON.stringify(state));
        this.broadcastUIUpdates();
    },
    seedMockData() {
        state.tasks = [
            { id: 't1', title: 'Review structural product roadmap blueprints', due: '2026-06-20', completed: false },
            { id: 't2', title: 'Refactor core Web Speech layout parser engine', due: '2026-06-19', completed: true }
        ];
        state.notes = [
            { id: 'n1', title: 'System Synthesis', content: 'Vanilla components scale remarkably efficiently without heavy dependency layers.' }
        ];
        state.boards = [
            { id: 'b1', title: 'Design Glassmorphic Overlays', status: 'progress' },
            { id: 'b2', title: 'Incorporate IndexedDB Fallback Layers', status: 'todo' }
        ];
        state.events = [
            { id: 'e1', title: 'LifeOS System Integration Review', date: '2026-06-19', time: '15:00' }
        ];
        state.universalInbox = [
            { id: 'u1', title: 'Transient thought regarding fluid layouts', type: 'note' }
        ];
        state.recentActivity = [
            { id: 'a1', text: 'System framework initialized locally.', time: 'Just Now' }
        ];
        this.save();
    },
    logActivity(text) {
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        state.recentActivity.unshift({ id: 'act-' + Date.now(), text, time: timeString });
        if (state.recentActivity.length > 15) state.recentActivity.pop();
        this.save();
    },
    broadcastUIUpdates() {
        RenderEngine.updateDashboard();
        RenderEngine.updateBrainly();
        RenderEngine.updateBoardly();
        RenderEngine.updateTimely();
        RenderEngine.updateTaskly();
        RenderEngine.updateUniversalInboxUI();
    }
};

// ================= DOM RENDERING GRAPH ENGINE =================
const RenderEngine = {
    updateDashboard() {
        // Clock initialization logic
        const now = new Date();
        document.getElementById('homeClock').textContent = now.toLocaleTimeString();
        document.getElementById('homeDay').textContent = now.toLocaleDateString([], { weekday: 'long' });
        document.getElementById('homeDate').textContent = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

        // Populate Dashboard Components
        const taskTarget = document.getElementById('homeTasksList');
        taskTarget.innerHTML = state.tasks.filter(t => !t.completed).map(t => `
            <div class="task-row">
                <div class="task-left">
                    <span class="custom-checkbox" onclick="Actions.toggleTask('${t.id}')"></span>
                    <span>${t.title}</span>
                </div>
                <small style="color:var(--text-muted);">${t.due}</small>
            </div>
        `).join('') || '<p style="color:var(--text-muted); font-size:13px;">No tasks on horizon.</p>';

        const eventTarget = document.getElementById('homeEventsList');
        eventTarget.innerHTML = state.events.map(e => `
            <div class="agenda-item">
                <div><strong>${e.title}</strong></div>
                <small style="color:var(--accent-primary); font-weight:500;">${e.date} @ ${e.time}</small>
            </div>
        `).join('') || '<p style="color:var(--text-muted); font-size:13px;">Schedule clear.</p>';

        const activityTarget = document.getElementById('globalActivityFeed');
        activityTarget.innerHTML = state.recentActivity.map(a => `
            <div class="activity-node">
                <span>${a.text}</span>
                <span class="timestamp">${a.time}</span>
            </div>
        `).join('');
    },

    updateBrainly() {
        const target = document.getElementById('brainlyNotesContainer');
        target.innerHTML = state.notes.map(n => `
            <div class="note-item">
                <h4>${n.title}</h4>
                <p>${n.content}</p>
                <div class="item-actions">
                    <button class="action-icon-btn" onclick="Actions.deleteNote('${n.id}')">
                        <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    updateBoardly() {
        const statuses = ['todo', 'progress', 'done'];
        statuses.forEach(status => {
            const container = document.getElementById(`kanban-${status}`);
            container.innerHTML = state.boards.filter(b => b.status === status).map(b => `
                <div class="node-card" draggable="true" data-id="${b.id}" ondragstart="Actions.handleKanbanDragStart(event)">
                    <p style="font-size:14px; font-weight:500;">${b.title}</p>
                    <div class="item-actions">
                        ${status !== 'done' ? `<button class="action-icon-btn" onclick="Actions.advanceBoard('${b.id}', '${status}')" title="Advance column"><span class="material-symbols-rounded" style="font-size:18px;">arrow_forward</span></button>` : ''}
                        <button class="action-icon-btn" onclick="Actions.deleteBoardItem('${b.id}')"><span class="material-symbols-rounded" style="font-size:18px;">delete</span></button>
                    </div>
                </div>
            `).join('');
            
            container.ondragover = (e) => e.preventDefault();
            container.ondrop = (e) => Actions.handleKanbanDrop(e, status);
        });
    },

    updateTimely() {
        const target = document.getElementById('timelyAgendaContainer');
        target.innerHTML = state.events.map(e => `
            <div class="agenda-item">
                <div>
                    <strong style="color:var(--text-main);">${e.title}</strong>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Scheduled Runtime</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:14px; color:var(--accent-purple); font-weight:600;">${e.time}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${e.date}</div>
                </div>
                <button class="action-icon-btn" onclick="Actions.deleteEvent('${e.id}')" style="margin-left:12px;">
                    <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                </button>
            </div>
        `).join('');
    },

    updateTaskly() {
        const target = document.getElementById('tasklyList');
        target.innerHTML = state.tasks.map(t => `
            <div class="task-row ${t.completed ? 'completed' : ''}">
                <div class="task-left">
                    <span class="custom-checkbox" onclick="Actions.toggleTask('${t.id}')"></span>
                    <span>${t.title}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <small style="color:var(--text-muted); font-size:12px;">Due: ${t.due}</small>
                    <button class="action-icon-btn" onclick="Actions.deleteTask('${t.id}')">
                        <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    updateUniversalInboxUI() {
        const target = document.getElementById('universalInbox');
        target.innerHTML = state.universalInbox.map(u => `
            <div class="node-card" draggable="true" data-inbox-id="${u.id}" ondragstart="Actions.handleUniversalDragStart(event)">
                <div style="font-size:13px; font-weight:600;">${u.title}</div>
                <span class="tag">${u.type || 'Inbox Node'}</span>
                <div class="item-actions">
                    <button class="action-icon-btn" onclick="Actions.purgeInboxNode('${u.id}')" title="Discard Node">
                        <span class="material-symbols-rounded" style="font-size:16px;">close</span>
                    </button>
                </div>
            </div>
        `).join('');

        const badge = document.getElementById('inboxBadge');
        if (state.universalInbox.length > 0) {
            badge.textContent = state.universalInbox.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

// ================= TRANSACTION / MUTATION EVENT LAYER =================
const Actions = {
    // Task Transactions
    addTask(title, due) {
        if (!title) return;
        state.tasks.push({ id: 'task-' + Date.now(), title, due: due || 'No Deadline', completed: false });
        StorageManager.logActivity(`Added task: "${title}"`);
    },
    toggleTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            StorageManager.logActivity(`Toggled status for execution block: "${task.title}"`);
        }
    },
    deleteTask(id) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        StorageManager.logActivity(`Purged task instance code mapping.`);
    },

    // Notes Transactions
    addNote(title, content) {
        if (!title && !content) return;
        state.notes.push({ id: 'note-' + Date.now(), title: title || 'Untitled Segment', content });
        StorageManager.logActivity(`Committed conceptual note: "${title}" to Brainly matrix.`);
    },
    deleteNote(id) {
        state.notes = state.notes.filter(n => n.id !== id);
        StorageManager.logActivity(`Dropped selected record entry.`);
    },

    // Kanban Actions
    addBoardCard(title) {
        if (!title) return;
        state.boards.push({ id: 'board-' + Date.now(), title, status: 'todo' });
        StorageManager.logActivity(`Pinned Kanban vector card onto Boardly workspace.`);
    },
    advanceBoard(id, currentStatus) {
        const target = state.boards.find(b => b.id === id);
        if (target) {
            if (currentStatus === 'todo') target.status = 'progress';
            else if (currentStatus === 'progress') target.status = 'done';
            StorageManager.logActivity(`Advanced asset column location.`);
        }
    },
    deleteBoardItem(id) {
        state.boards = state.boards.filter(b => b.id !== id);
        StorageManager.logActivity(`Excised structural layout card.`);
    },
    handleKanbanDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    },
    handleKanbanDrop(e, targetStatus) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const card = state.boards.find(b => b.id === id);
        if (card) {
            card.status = targetStatus;
            StorageManager.logActivity(`Relocated card to column: [${targetStatus.toUpperCase()}]`);
        }
    },

    // Timely System
    addEvent(title, date, time) {
        if (!title) return;
        state.events.push({ id: 'evt-' + Date.now(), title, date: date || 'Today', time: time || 'All Day' });
        StorageManager.logActivity(`Scheduled timeline synchronization element: "${title}"`);
    },
    deleteEvent(id) {
        state.events = state.events.filter(e => e.id !== id);
        StorageManager.logActivity(`Canceled chronos agenda allocation.`);
    },

    // Inbox Pipeline Elements
    stageInboxNode(title, type = 'task') {
        if (!title) return;
        state.universalInbox.push({ id: 'node-' + Date.now(), title, type });
        StorageManager.logActivity(`Staged temporary memory matrix packet directly into routing console.`);
    },
    purgeInboxNode(id) {
        state.universalInbox = state.universalInbox.filter(u => u.id !== id);
        StorageManager.save();
    },
    handleUniversalDragStart(e) {
        e.dataTransfer.setData('text/universal-node', e.target.getAttribute('data-inbox-id'));
    },
    routeInboxNode(nodeId, moduleTarget) {
        const index = state.universalInbox.findIndex(u => u.id === nodeId);
        if (index === -1) return;
        const node = state.universalInbox[index];
        
        if (moduleTarget === 'brainly') this.addNote(node.title, 'Dispatched from global staging zone.');
        else if (moduleTarget === 'boardly') this.addBoardCard(node.title);
        else if (moduleTarget === 'timely') this.addEvent(node.title, '', '');
        else if (moduleTarget === 'taskly') this.addTask(node.title, '');
        
        state.universalInbox.splice(index, 1);
        StorageManager.logActivity(`Dispatched Inbox item into [${moduleTarget.toUpperCase()}] layer.`);
    }
};

// ================= NATURAL INTERFACE VOICE CONTROL ENGINE =================
const VoiceEngine = {
    recognition: null,
    isListening: false,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Target Web Speech API is not supported natively by this environment.");
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voiceAssistantWrapper').classList.add('listening');
            const bubble = document.getElementById('voiceTranscriptBubble');
            bubble.textContent = "Listening closely...";
            bubble.classList.remove('hidden');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('voiceTranscriptBubble').textContent = `"${transcript}"`;
            this.parseAndExecuteIntent(transcript);
        };

        this.recognition.onerror = () => { this.terminateListeningState(); };
        this.recognition.onend = () => { this.terminateListeningState(); };
    },

    toggle() {
        if (!this.recognition) {
            this.speak("Voice processing architecture unavailable on this browser.");
            return;
        }
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    },

    terminateListeningState() {
        this.isListening = false;
        document.getElementById('voiceAssistantWrapper').classList.remove('listening');
        setTimeout(() => {
            document.getElementById('voiceTranscriptBubble').classList.add('hidden');
        }, 3000);
    },

    parseAndExecuteIntent(rawText) {
        const text = rawText.toLowerCase();
        
        // Navigation Intents
        if (text.includes('switch to') || text.includes('open view') || text.includes('show view')) {
            if (text.includes('brainly')) { ViewController.switchView('brainly'); this.speak("Opening Brainly dashboard."); return; }
            if (text.includes('boardly')) { ViewController.switchView('boardly'); this.speak("Navigating to layout boards."); return; }
            if (text.includes('timely') || text.includes('calendar')) { ViewController.switchView('timely'); this.speak("Opening calendar agenda."); return; }
            if (text.includes('taskly') || text.includes('task')) { ViewController.switchView('taskly'); this.speak("Viewing active checklist entries."); return; }
            if (text.includes('home') || text.includes('dashboard')) { ViewController.switchView('home'); this.speak("Returning home."); return; }
        }

        // Action Engine Intent Matching Parsing Rules
        if (text.includes('add task') || text.includes('to taskly')) {
            const extract = rawText.replace(/(add task|to taskly)/gi, '').trim();
            Actions.addTask(extract, '2026-06-19');
            this.speak(`Tasked ${extract} to Taskly.`);
            return;
        }
        if (text.includes('save note') || text.includes('open brainly and save')) {
            const extract = rawText.replace(/(save note|open brainly and save|this note)/gi, '').trim();
            Actions.addNote(extract || 'Voice Audio Stream Note', extract || 'Audio capture instance event parsing routine executed.');
            this.speak("Saved note parameters into Brainly.");
            return;
        }
        if (text.includes('add meeting') || text.includes('add event') || text.includes('in timely')) {
            const extract = rawText.replace(/(add meeting|add event|in timely)/gi, '').trim();
            Actions.addEvent(extract || 'Scheduled Matrix Convergence', '2026-06-19', '15:00');
            this.speak(`Scheduled event ${extract} into calendar data storage.`);
            return;
        }
        if (text.includes('move this card') || text.includes('add card to boardly')) {
            const extract = rawText.replace(/(move this card|add card to boardly)/gi, '').trim();
            Actions.addBoardCard(extract || 'Asynchronous Pipeline Stream Node');
            this.speak("Card allocated onto production boards.");
            return;
        }

        // Fallback Logic Block
        this.speak("Command unregistered. Pipeline structure target undetected.");
    },

    speak(responseMessage) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(responseMessage);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
};

// ================= APPARATUS VIEW CONTROLLER =================
const ViewController = {
    init() {
        // Tool Switcher Dropdown Click Handlers
        const btn = document.getElementById('toolSwitcherBtn');
        const menu = document.getElementById('radialMenu');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.classList.toggle('active');
            menu.classList.toggle('hidden');
        });

        document.querySelectorAll('.radial-item').forEach(item => {
            item.addEventListener('click', () => {
                const viewTarget = item.getAttribute('data-view');
                this.switchView(viewTarget);
                
                document.querySelectorAll('.radial-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                btn.classList.remove('active');
                menu.classList.add('hidden');
            });
        });

        // Universal Inbox Modals Layer Interactions
        const overlay = document.getElementById('universalBoardOverlay');
        document.getElementById('universalBoardBtn').addEventListener('click', () => overlay.classList.remove('hidden'));
        document.getElementById('closeOverlayBtn').addEventListener('click', () => overlay.classList.add('hidden'));

        // Handle Router Dropzones Inside Overlay
        document.querySelectorAll('.router-zone').forEach(zone => {
            zone.ondragover = (e) => e.preventDefault();
            zone.ondrop = (e) => {
                e.preventDefault();
                const nodeId = e.dataTransfer.getData('text/universal-node');
                const targetModule = zone.getAttribute('data-target');
                Actions.routeInboxNode(nodeId, targetModule);
            };
            zone.addEventListener('click', () => {
                // Route the top node if clicked directly as a macro configuration
                if(state.universalInbox.length > 0) {
                    Actions.routeInboxNode(state.universalInbox[0].id, zone.getAttribute('data-target'));
                }
            });
        });

        // Close dropdown when background is selected
        document.addEventListener('click', () => {
            btn.classList.remove('active');
            menu.classList.add('hidden');
        });
    },

    switchView(targetId) {
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.remove('active-view');
        });
        const activeTarget = document.getElementById(`view-${targetId}`);
        if (activeTarget) {
            activeTarget.classList.add('active-view');
        }
    }
};

// ================= INTERFACE INPUT MACRO CAPTURES =================
function registerDOMInputHooks() {
    // Brainly
    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        const title = document.getElementById('noteTitleInput');
        const content = document.getElementById('noteContentInput');
        Actions.addNote(title.value, content.value);
        title.value = ''; content.value = '';
    });

    // Boardly
    document.getElementById('addBoardItemBtn').addEventListener('click', () => {
        const input = document.getElementById('boardItemInput');
        Actions.addBoardCard(input.value);
        input.value = '';
    });

    // Timely
    document.getElementById('saveEventBtn').addEventListener('click', () => {
        const title = document.getElementById('eventTitleInput');
        const d = document.getElementById('eventDateInput');
        const t = document.getElementById('eventTimeInput');
        Actions.addEvent(title.value, d.value, t.value);
        title.value = ''; d.value = ''; t.value = '';
    });

    // Taskly
    document.getElementById('addTasklyBtn').addEventListener('click', () => {
        const title = document.getElementById('tasklyInput');
        const date = document.getElementById('tasklyDueDate');
        Actions.addTask(title.value, date.value);
        title.value = ''; date.value = '';
    });

    // Universal Inbox Manual Push Insertion
    document.getElementById('quickInboxBtn').addEventListener('click', () => {
        const input = document.getElementById('quickInboxInput');
        Actions.stageInboxNode(input.value);
        input.value = '';
    });

    // Persistent Voice Mic Button Access
    document.getElementById('voiceMicBtn').addEventListener('click', () => {
        VoiceEngine.toggle();
    });
}

// ================= SYSTEM INITIALIZATION STARTUP LAYER =================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
    ViewController.init();
    VoiceEngine.init();
    registerDOMInputHooks();

    // Set real-time dynamic refresh operations clock loops
    setInterval(() => {
        RenderEngine.updateDashboard();
    }, 1000);
});
