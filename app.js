/**
 * Dadventures - MVP Logic
 */

// --- Data Models & Initial Data ---

const ACTIVITY_TYPES = {
    calm: { label: '🧠 Calm', color: 'var(--type-calm)' },
    wild: { label: '⚔️ Wild', color: 'var(--type-wild)' },
    creative: { label: '🎨 Creative', color: 'var(--type-creative)' },
    outside: { label: '🌳 Outside', color: 'var(--type-outside)' },
    routine: { label: '📅 Routine', color: 'transparent' } // Visual type for routines
};

const INITIAL_ACTIVITIES = [
    { id: 'a1', name: 'Build a Fort', type: 'creative', duration: 'medium', energy: 'medium', location: 'home' },
    { id: 'a2', name: 'Park Scavenger Hunt', type: 'outside', duration: 'medium', energy: 'high', location: 'park' },
    { id: 'a3', name: 'Read & Cuddle', type: 'calm', duration: 'short', energy: 'low', location: 'home' },
    { id: 'a4', name: 'Dino Battle', type: 'wild', duration: 'medium', energy: 'high', location: 'home' },
    { id: 'a5', name: 'Water Paint on Patio', type: 'creative', duration: 'short', energy: 'low', location: 'garden' },
    { id: 'a6', name: 'Bike Ride', type: 'outside', duration: 'long', energy: 'high', location: 'park' },
];

const INITIAL_ROUTINES = [
    { id: 'r1', name: '🌞 Breakfast', type: 'routine', duration: 'short', energy: 'medium', location: 'home' },
    { id: 'r2', name: '🍱 Lunch', type: 'routine', duration: 'medium', energy: 'medium', location: 'home' },
    { id: 'r3', name: '😴 Nap', type: 'routine', duration: 'medium', energy: 'low', location: 'home' },
    { id: 'r4', name: '🛁 Bath', type: 'routine', duration: 'short', energy: 'low', location: 'home' },
    { id: 'r5', name: '🌚 Dinner', type: 'routine', duration: 'medium', energy: 'medium', location: 'home' },
    { id: 'r6', name: '📖 Bedtime', type: 'routine', duration: 'short', energy: 'low', location: 'home' }
];

// --- State Management ---

let state = {
    activities: [...INITIAL_ACTIVITIES],
    routines: [...INITIAL_ROUTINES],
    plan: {
        // "2025-12-01": ['a1', 'a3']
    },
    notes: {
        // "2025-12-01": "Great day!"
    },
    templates: {
        // "Dragon Day": ['a1', 'a4', 'a6']
        // "Week X": { type: 'week', plan: {...} }
    },
    currentWeekStart: getMonday(new Date())
};

// --- DOM Elements ---

const els = {
    library: document.getElementById('activity-library'),
    routineLibrary: document.getElementById('routine-library'),
    templateLibrary: document.getElementById('template-library'),

    // Sidebar Tabs
    tabActivities: document.getElementById('tab-activities'),
    tabRoutines: document.getElementById('tab-routines'),
    tabTemplates: document.getElementById('tab-templates'),

    // Filters
    activityFilters: document.getElementById('activity-filters'),
    filterEnergy: document.getElementById('filter-energy'),
    filterLocation: document.getElementById('filter-location'),
    filterType: document.getElementById('filter-type'),
    filterDuration: document.getElementById('filter-duration'),

    // Calendar
    grid: document.querySelector('.calendar-grid'),
    prevWeekBtn: document.getElementById('prev-week'),
    nextWeekBtn: document.getElementById('next-week'),
    weekLabel: document.getElementById('current-week-label'),
    currentYear: document.getElementById('current-year'),

    // Header Controls
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    fileImport: document.getElementById('file-import'),
    btnSaveWeek: document.getElementById('btn-save-week-template'),
    btnClearWeek: document.getElementById('btn-clear-week'),

    // Modal els
    btnAddActivity: document.getElementById('btn-add-activity'),
    modal: document.getElementById('activity-modal'),
    formActivity: document.getElementById('form-activity'),
    btnCancelActivity: document.getElementById('btn-cancel-activity')
};

// --- Init ---

function init() {
    loadFromStorage();
    renderLibrary();
    renderRoutines();
    renderTemplates();
    renderWeek();
    setupEventListeners();
    updateYear();
}

function updateYear() {
    if (els.currentYear) {
        els.currentYear.textContent = new Date().getFullYear();
    }
}

// --- Rendering ---

function renderRoutines() {
    if (!els.routineLibrary) return;
    els.routineLibrary.innerHTML = '';
    state.routines.forEach(routine => {
        const div = createActivityCard(routine, true);
        els.routineLibrary.appendChild(div);
    });
}

function renderTemplates() {
    els.templateLibrary.innerHTML = '';
    const names = Object.keys(state.templates);

    if (names.length === 0) {
        els.templateLibrary.innerHTML = '<div style="padding:10px; color:var(--text-secondary); text-align:center; font-size:0.8rem;">No templates saved.</div>';
        return;
    }

    names.forEach(name => {
        const div = document.createElement('div');
        div.className = 'template-card';
        div.draggable = true;
        div.dataset.templateName = name; // Identify as template
        div.addEventListener('dragstart', handleTemplateDragStart);

        const tmpl = state.templates[name];
        let countText = '';
        let tooltip = '';

        if (Array.isArray(tmpl) || (tmpl.type !== 'week' && tmpl.activities)) {
            // Day Template
            const acts = Array.isArray(tmpl) ? tmpl : tmpl.activities; // Compat
            countText = `${acts.length} items`;
            tooltip = acts.map(id => {
                const a = state.activities.find(x => x.id === id) || state.routines.find(x => x.id === id);
                return a ? a.name : 'Unknown';
            }).join(', ');
        } else if (tmpl.type === 'week') {
            countText = 'Full Week';
            tooltip = 'Full Week Plan';
        }

        div.title = tooltip;

        div.innerHTML = `
            <h4>${name}</h4>
            <div class="activity-details">
                <span>${countText}</span>
                <span class="btn-small" onclick="deleteTemplate('${name}', event)" style="font-size:10px; padding:2px 4px;">✕</span>
            </div>
        `;
        els.templateLibrary.appendChild(div);
    });
}

// Global scope for onclick
window.deleteTemplate = function (name, e) {
    if (e) e.stopPropagation();
    if (confirm(`Delete template "${name}"?`)) {
        delete state.templates[name];
        saveToStorage();
        renderTemplates();
    }
}

window.deleteFromLibrary = function (id, e) {
    if (e) e.stopPropagation();
    if (confirm('Delete this activity permanently?')) {
        state.activities = state.activities.filter(a => a.id !== id);
        saveToStorage();
        renderLibrary();
    }
}

function handleTemplateDragStart(e) {
    const name = this.dataset.templateName;
    e.dataTransfer.effectAllowed = 'copy';

    const tmpl = state.templates[name];

    // Check if week or day template
    if (tmpl.type === 'week') {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'template',
            isWeek: true,
            weekPlan: tmpl.plan
        }));
    } else {
        // Handle Day Template (legacy array or object)
        const activities = Array.isArray(tmpl) ? tmpl : tmpl.activities;
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'template',
            activities: activities
        }));
    }
}

function renderLibrary() {
    els.library.innerHTML = '';

    const energyFilter = els.filterEnergy ? els.filterEnergy.value : 'all';
    const locFilter = els.filterLocation ? els.filterLocation.value : 'all';
    const typeFilter = els.filterType ? els.filterType.value : 'all';
    const durFilter = els.filterDuration ? els.filterDuration.value : 'all';

    const filtered = state.activities.filter(a => {
        if (energyFilter !== 'all' && a.energy !== energyFilter) return false;
        if (locFilter !== 'all' && a.location !== locFilter) return false;
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (durFilter !== 'all' && a.duration !== durFilter) return false;
        return true;
    });

    filtered.forEach(activity => {
        const card = createActivityCard(activity);
        els.library.appendChild(card);
    });
}

function createActivityCard(activity, isRoutine = false) {
    const div = document.createElement('div');
    // For styling, if routine, we add .routine class. 
    // Types: calm, wild, creative, outside. routine is handled by 'isRoutine' param mostly or type check.
    const typeClass = ACTIVITY_TYPES[activity.type] ? `type-${activity.type}` : 'type-calm';

    div.className = `activity-card ${typeClass} ${isRoutine ? 'routine' : ''}`;
    div.draggable = true;
    div.dataset.id = activity.id;
    div.title = activity.name;

    // Drag Events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    let deleteHtml = '';
    // Only allow deleting custom activities from library
    if (!isRoutine) {
        deleteHtml = `<button class="delete-btn" onclick="deleteFromLibrary('${activity.id}', event)">✕</button>`;
    }

    div.innerHTML = `
        ${deleteHtml}
        <h4>${activity.name}</h4>
        ${!isRoutine ? `
        <div class="activity-details">
            <span>${ACTIVITY_TYPES[activity.type]?.label || 'Activity'}</span>
            <span>${activity.duration}</span>
        </div>` : ''}
    `;

    // Add color badge if not routine (routine is dashed outline info)
    if (!isRoutine && ACTIVITY_TYPES[activity.type]) {
        div.innerHTML += `<div class="card-type-box" style="background: ${ACTIVITY_TYPES[activity.type].color}"></div>`;
    }

    return div;
}

function renderWeek() {
    const start = state.currentWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    els.weekLabel.textContent = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

    // Render 7 Days
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const col = document.querySelector(`.day-column[data-day="${i}"]`);
        if (!col) continue;

        // Update number
        const dateEl = col.querySelector('.day-date');
        if (dateEl) dateEl.textContent = date.getDate();

        // Highlight today
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) col.classList.add('today');
        else col.classList.remove('today');

        // Header Buttons (Save / Clear)
        const header = col.querySelector('.day-header');
        // Check if buttons exist, if not create container
        let btnContainer = header.querySelector('.day-header-btns');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.className = 'day-header-btns';
            btnContainer.style.display = 'flex';
            btnContainer.style.justifyContent = 'center';
            btnContainer.style.gap = '4px';
            btnContainer.style.marginTop = '4px';
            header.appendChild(btnContainer);
        }

        // Refresh buttons logic
        btnContainer.innerHTML = '';

        // Save Btn
        const btnSave = document.createElement('button');
        btnSave.className = 'btn-small';
        btnSave.innerHTML = '💾';
        btnSave.title = 'Save Day as Template';
        btnSave.onclick = () => saveDayAsTemplate(dateStr);
        btnContainer.appendChild(btnSave);

        // Clear Btn
        const btnClear = document.createElement('button');
        btnClear.className = 'btn-small';
        btnClear.innerHTML = '🗑️';
        btnClear.title = 'Clear Day';
        btnClear.onclick = () => clearDay(dateStr);
        btnContainer.appendChild(btnClear);


        // Render Slots
        const slotContainer = col.querySelector('.day-slots');
        slotContainer.innerHTML = '';
        slotContainer.dataset.date = dateStr;

        const dayActivities = state.plan[dateStr] || [];
        dayActivities.forEach((id, index) => {
            // Find in activities OR routines
            const activity = state.activities.find(a => a.id === id) || state.routines.find(r => r.id === id);

            if (activity) {
                const isRoutine = (activity.type === 'routine');
                const card = createActivityCard(activity, isRoutine);

                card.dataset.index = index; // For Reordering lookup
                card.dataset.originDate = dateStr;

                // Add "Remove from Plan" button
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-btn';
                delBtn.innerHTML = '✕';
                delBtn.title = 'Remove from day';
                // Stop propagation handled in click
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteFromPlan(dateStr, index);
                };
                card.appendChild(delBtn);

                slotContainer.appendChild(card);
            }
        });

        // Notes
        const noteArea = col.querySelector('.day-notes textarea');
        if (noteArea) {
            noteArea.value = state.notes[dateStr] || '';
            noteArea.onchange = (e) => saveNote(dateStr, e.target.value);
        }
    }
}

// --- Drag & Drop Logic ---

let draggedItem = null; // Store reference to DOM element
let draggedMeta = null; // { source: 'library' | 'plan', id: string, date?: string, index?: number }

function handleDragStart(e) {
    draggedItem = this;
    const isPlan = this.parentElement.classList.contains('day-slots');

    draggedMeta = {
        id: this.dataset.id,
        source: isPlan ? 'plan' : 'library',
        date: this.dataset.originDate,
        index: parseInt(this.dataset.index)
    };

    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', this.dataset.id);

    // Defer styling to avoid disappearing immediately
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    const placeholders = document.querySelectorAll('.drag-placeholder');
    placeholders.forEach(p => p.remove());
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedItem = null;
    draggedMeta = null;
}

// Helper to calculate insertion index
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.activity-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2; // Distance from center of child
        // We want the element where mouse is *above* the center (negative offset) 
        // but closest to 0.
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupEventListeners() {
    // Library Filters
    if (els.filterEnergy) els.filterEnergy.addEventListener('change', renderLibrary);
    if (els.filterLocation) els.filterLocation.addEventListener('change', renderLibrary);
    if (els.filterType) els.filterType.addEventListener('change', renderLibrary);
    if (els.filterDuration) els.filterDuration.addEventListener('change', renderLibrary);

    // Tabs
    els.tabActivities.addEventListener('click', () => switchTab('activities'));
    els.tabRoutines.addEventListener('click', () => switchTab('routines'));
    els.tabTemplates.addEventListener('click', () => switchTab('templates'));

    // Week Nav
    els.prevWeekBtn.addEventListener('click', () => {
        state.currentWeekStart.setDate(state.currentWeekStart.getDate() - 7);
        renderWeek();
    });
    els.nextWeekBtn.addEventListener('click', () => {
        state.currentWeekStart.setDate(state.currentWeekStart.getDate() + 7);
        renderWeek();
    });

    // Drop Zones
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy'; // default
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            // 1. Template Drop (Whole Week or Day Template into Day)
            const jsonData = e.dataTransfer.getData('application/json');
            if (jsonData && !draggedMeta) { // If draggedMeta is null, it might be a template from sidebar
                try {
                    const data = JSON.parse(jsonData);
                    if (data.type === 'template') {
                        if (data.isWeek) {
                            if (confirm('Apply full week template? This will merge with existing plans.')) {
                                Object.keys(data.weekPlan).forEach(offset => {
                                    const date = new Date(state.currentWeekStart);
                                    date.setDate(date.getDate() + parseInt(offset));
                                    const dStr = date.toISOString().split('T')[0];
                                    if (!data.weekPlan[offset]) return;
                                    data.weekPlan[offset].forEach(actId => addToPlan(dStr, actId));
                                });
                            }
                        } else if (data.activities && zone.dataset.date) {
                            data.activities.forEach(id => addToPlan(zone.dataset.date, id));
                        }
                        return;
                    }
                } catch (e) { }
            }

            // 2. Item Drop (Reorder or Add)
            const id = e.dataTransfer.getData('text/plain');
            const targetDate = zone.dataset.date;

            if (targetDate && id) {
                // Calculate Target Index
                const afterElement = getDragAfterElement(zone, e.clientY);

                let targetIndex = state.plan[targetDate] ? state.plan[targetDate].length : 0;
                if (afterElement) {
                    // Find index of afterElement
                    // Note: DOM children include buttons/etc? No, just cards in .day-slots
                    // But we should be careful.
                    const children = [...zone.querySelectorAll('.activity-card')];
                    const idx = children.indexOf(afterElement);
                    if (idx !== -1) targetIndex = idx;
                }

                if (draggedMeta && draggedMeta.source === 'plan') {
                    // REORDERING / MOVING
                    const sourceDate = draggedMeta.date;
                    const sourceIndex = draggedMeta.index;

                    if (sourceDate === targetDate) {
                        // Same Day Reorder
                        moveActivity(targetDate, sourceIndex, targetIndex);
                    } else {
                        // Move to Different Day
                        moveActivityBetweenDays(sourceDate, sourceIndex, targetDate, targetIndex);
                    }
                } else {
                    // ADDING FROM LIBRARY
                    addToPlanAtIndex(targetDate, id, targetIndex);
                }
            }
        });
    });
    els.btnImport.addEventListener('click', () => els.fileImport.click());
    els.fileImport.addEventListener('change', importData);
    if (els.btnSaveWeek) els.btnSaveWeek.addEventListener('click', saveWeekAsTemplate);

    // Clear Week
    if (els.btnClearWeek) {
        els.btnClearWeek.addEventListener('click', () => {
            if (confirm('Clear all plans for this week?')) {
                for (let i = 0; i < 7; i++) {
                    const date = new Date(state.currentWeekStart);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    delete state.plan[dateStr];
                }
                saveToStorage();
                renderWeek();
            }
        });
    }

    // Modal Events
    els.btnAddActivity.addEventListener('click', () => {
        els.modal.classList.remove('hidden');
    });

    els.btnCancelActivity.addEventListener('click', () => {
        els.modal.classList.add('hidden');
        els.formActivity.reset();
    });

    els.formActivity.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(els.formActivity);
        const newActivity = {
            id: 'a' + Date.now(),
            name: formData.get('name'),
            type: formData.get('type'),
            duration: formData.get('duration'),
            energy: formData.get('energy'),
            location: formData.get('location')
        };

        state.activities.push(newActivity);
        saveToStorage();
        renderLibrary();

        els.modal.classList.add('hidden');
        els.formActivity.reset();
    });
}

// --- Logic Helpers ---

// --- Logic Helpers ---

// Legacy append
function addToPlan(dateStr, activityId) {
    addToPlanAtIndex(dateStr, activityId, state.plan[dateStr] ? state.plan[dateStr].length : 0);
}

function addToPlanAtIndex(dateStr, activityId, index) {
    if (!state.plan[dateStr]) state.plan[dateStr] = [];
    state.plan[dateStr].splice(index, 0, activityId);
    saveToStorage();
    renderWeek();
}

function moveActivity(dateStr, fromIndex, toIndex) {
    const list = state.plan[dateStr];
    const [moved] = list.splice(fromIndex, 1);
    // If toIndex was > fromIndex, it effectively shifted down by 1 because of removing.
    // However, when dropping *before* an element, the targetIndex is based on DOM before removal.
    // If we drag item 0 to be before item 2 (index 1), we remove 0, list shifts.
    // Logic:
    // If dropping 'after' logic is used, it's easier. 'getDragAfterElement' finds element we drop BEFORE.

    // Correction:
    // If we drag from index 0 to index 2 (before item currently at 2).
    // Array: [A, B, C, D] -> Drag A before C. Target Index of C is 2.
    // Remove A -> [B, C, D]. Insert A at 2? -> [B, C, A, D]. Correct.
    // What if drag C (2) before A (0)? Target 0.
    // Remove C -> [A, B, D]. Insert C at 0 -> [C, A, B, D]. Correct.
    // What if drag A (0) before B (1)? Target 1.
    // Remove A -> [B, C, D]. Insert at 1 -> [B, A, C, D]. 
    // Wait, if I drag A over B, 'after element' is B (if in top half) or C (if bottom half).
    // getDragAfterElement returns the element *after* the cursor.
    // If I drag A (0) and hover over B (1) top half -> After is B. Target 1.
    // Remove A -> [B, C, D]. Insert at 1 -> [B, A, C...].
    // BUT since A was at 0, B was at 1. Removing A makes B at 0. So insert at 1 puts it AFTER B.
    // Adjust logic: if fromIndex < toIndex, we need to decrement toIndex because removal shifted everything down.

    if (fromIndex < toIndex) {
        toIndex--;
    }

    list.splice(toIndex, 0, moved);
    saveToStorage();
    renderWeek();
}

function moveActivityBetweenDays(fromDate, fromIndex, toDate, toIndex) {
    const fromList = state.plan[fromDate];
    const [moved] = fromList.splice(fromIndex, 1);
    if (fromList.length === 0) delete state.plan[fromDate];

    if (!state.plan[toDate]) state.plan[toDate] = [];
    state.plan[toDate].splice(toIndex, 0, moved);

    saveToStorage();
    renderWeek();
}

function deleteFromPlan(dateStr, index) {
    if (!state.plan[dateStr]) return;
    state.plan[dateStr].splice(index, 1);
    // If empty delete key? Optional.
    if (state.plan[dateStr].length === 0) delete state.plan[dateStr];

    saveToStorage();
    renderWeek();
}

function clearDay(dateStr) {
    // User requested no confirmation for individual days
    if (state.plan[dateStr]) {
        delete state.plan[dateStr];
        saveToStorage();
        renderWeek();
    }
}

function saveDayAsTemplate(dateStr) {
    const activities = state.plan[dateStr];
    if (!activities || activities.length === 0) {
        alert('This day is empty. Add activities before saving.');
        return;
    }
    const name = prompt('Name this template (e.g. "Dragon Day"):');
    if (name) {
        state.templates[name] = { type: 'day', activities: [...activities] };
        saveToStorage();
        renderTemplates();
        switchTab('templates');
    }
}

function saveWeekAsTemplate() {
    const name = prompt('Name this Week Template (e.g. "Summer Holiday A"):');
    if (name) {
        // Deep copy the current plan for visible week
        // We need 0-6 offsets
        const relativePlan = {};
        const start = state.currentWeekStart;

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dStr = date.toISOString().split('T')[0];

            if (state.plan[dStr] && state.plan[dStr].length > 0) {
                relativePlan[i] = [...state.plan[dStr]];
            }
        }

        state.templates[name] = { type: 'week', plan: relativePlan };
        saveToStorage();
        renderTemplates();
        switchTab('templates');
    }
}

function saveNote(dateStr, text) {
    state.notes[dateStr] = text;
    saveToStorage();
}

function switchTab(tab) {
    // Hide all lists/filters
    els.activityFilters.classList.add('hidden');
    els.library.classList.add('hidden');
    els.routineLibrary.classList.add('hidden');
    els.templateLibrary.classList.add('hidden');

    // Deactivate tabs
    els.tabActivities.classList.remove('active');
    els.tabRoutines.classList.remove('active');
    els.tabTemplates.classList.remove('active');

    if (tab === 'activities') {
        els.activityFilters.classList.remove('hidden');
        els.library.classList.remove('hidden');
        els.tabActivities.classList.add('active');
    } else if (tab === 'routines') {
        els.routineLibrary.classList.remove('hidden');
        els.tabRoutines.classList.add('active');
    } else {
        els.templateLibrary.classList.remove('hidden');
        els.tabTemplates.classList.add('active');
    }
}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// --- Persistence ---

const STORAGE_KEY = 'dadventures_data';

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        plan: state.plan,
        notes: state.notes,
        templates: state.templates,
        activities: state.activities // Save activities too in case user adds custom ones
    }));
}

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            state.plan = data.plan || {};
            state.notes = data.notes || {};
            state.templates = data.templates || {};
            if (data.activities && Array.isArray(data.activities)) state.activities = data.activities;
            // routines are static for now, so we don't load them to overwrite new ones 
            // unless we want user custom routines later.
        } catch (e) {
            console.error('Error loading state', e);
        }
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dadventures_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event) {
    try {
        const obj = JSON.parse(event.target.result);
        if (obj.plan && obj.activities) {
            state.activities = obj.activities;
            state.plan = obj.plan;
            state.notes = obj.notes || {};
            state.templates = obj.templates || {};
            saveToStorage();
            renderLibrary();
            renderRoutines();
            renderTemplates();
            renderWeek();
            alert('Import successful!');
        } else {
            alert('Invalid file format. Needs plan and activities.');
        }
    } catch (e) {
        alert('Error parsing JSON');
    }
}

// Start
init();
