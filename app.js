const firebaseConfig = {
    apiKey: "AIzaSyA2lgjG0kl8UDUboLaztO3jSer5OopD48s",
    authDomain: "buggi-3e1d2.firebaseapp.com",
    projectId: "buggi-3e1d2",
    appId: "1:810286785802:web:c6ba7069c591ebc801c6f3"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let editingId = null;
let editingMode = null;
let sortColumn = 'date_found';
let sortOrder = 'desc';
let allBugs = [];
let currentMode = 'bugs';

// Authentication Functions
function signIn(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert('Login failed: ' + error.message);
        });
}

function createUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            alert('Registration failed: ' + error.message);
        });
}

function signOutUser() {
    auth.signOut()
        .catch((error) => {
            alert('Logout failed: ' + error.message);
        });
}

// Bug Management Functions
async function addBug(bugData) {
    try {
        const linkInput = document.getElementById('linkInput').value.trim();
        await db.collection('bugs').add({
            ...bugData,
            links: linkInput,
            createdBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            pinned: false
        });
        closeModal();
        loadBugs();
    } catch (e) {
        alert('Failed to add bug: ' + e.message);
    }
}

async function updateBug(bugId, updatedData) {
    try {
        const linkInput = document.getElementById('linkInput').value.trim();
        await db.collection('bugs').doc(bugId).update({
            ...updatedData,
            links: linkInput
        });
        closeModal();
        loadBugs();
    } catch (e) {
        alert('Failed to update bug: ' + e.message);
    }
}

async function deleteBug(bugId) {
    try {
        await db.collection('bugs').doc(bugId).delete();
        loadBugs();
    } catch (e) {
        alert('Failed to delete bug: ' + e.message);
    }
}

async function togglePinBug(bugId) {
    try {
        const bugRef = db.collection('bugs').doc(bugId);
        const bugDoc = await bugRef.get();
        const currentPinned = bugDoc.data().pinned || false;
        await bugRef.update({ pinned: !currentPinned });
        loadBugs();
    } catch (e) {
        alert('Failed to toggle pin: ' + e.message);
    }
}

async function loadBugs() {
    if (!auth.currentUser) return;
    try {
        const querySnapshot = await db.collection('bugs')
            .where('createdBy', '==', auth.currentUser.uid)
            .get();
        allBugs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filterAndPopulateBugs();
    } catch (e) {
        alert('Failed to load bugs: ' + e.message);
    }
}

function filterAndPopulateBugs() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    let filteredBugs = selectedCategory === 'all' ? allBugs : allBugs.filter(bug => bug.category === selectedCategory);

    const statusOrder = ["Open", "In Progress", "Closed"];
    const priorityOrder = ["Low", "Medium", "High"];

    const comparator = (a, b) => {
        let valA, valB;
        if (sortColumn === 'status') {
            valA = statusOrder.indexOf(a.status);
            valB = statusOrder.indexOf(b.status);
        } else if (sortColumn === 'priority') {
            valA = priorityOrder.indexOf(a.priority);
            valB = priorityOrder.indexOf(b.priority);
        } else if (sortColumn === 'date_found') {
            valA = new Date(a.date_found);
            valB = new Date(b.date_found);
        } else {
            valA = a[sortColumn]?.toString().toLowerCase() || '';
            valB = b[sortColumn]?.toString().toLowerCase() || '';
        }
        if (typeof valA === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        }
    };

    const pinnedBugs = filteredBugs.filter(bug => bug.pinned).sort(comparator);
    const unpinnedBugs = filteredBugs.filter(bug => !bug.pinned).sort(comparator);
    const sortedBugs = [...pinnedBugs, ...unpinnedBugs];
    populateTable(sortedBugs, 'bugs');

    const categories = [...new Set(allBugs.map(bug => bug.category).filter(cat => cat))];
    const categoryFilterElement = document.getElementById('categoryFilter');
    categoryFilterElement.innerHTML = '<option value="all">All</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === selectedCategory) option.selected = true;
        categoryFilterElement.appendChild(option);
    });
}

// Idea Management Functions
async function addIdea(ideaData) {
    try {
        const linkInput = document.getElementById('linkInput').value.trim();
        await db.collection('ideas').add({
            ...ideaData,
            links: linkInput,
            createdBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            pinned: false
        });
        closeModal();
        loadIdeas();
    } catch (e) {
        alert('Failed to add idea: ' + e.message);
    }
}

async function updateIdea(ideaId, updatedData) {
    try {
        const linkInput = document.getElementById('linkInput').value.trim();
        await db.collection('ideas').doc(ideaId).update({
            ...updatedData,
            links: linkInput
        });
        closeModal();
        loadIdeas();
    } catch (e) {
        alert('Failed to update idea: ' + e.message);
    }
}

async function deleteIdea(ideaId) {
    try {
        await db.collection('ideas').doc(ideaId).delete();
        loadIdeas();
    } catch (e) {
        alert('Failed to delete idea: ' + e.message);
    }
}

async function togglePinIdea(ideaId) {
    try {
        const ideaRef = db.collection('ideas').doc(ideaId);
        const ideaDoc = await ideaRef.get();
        const currentPinned = ideaDoc.data().pinned || false;
        await ideaRef.update({ pinned: !currentPinned });
        loadIdeas();
    } catch (e) {
        alert('Failed to toggle pin: ' + e.message);
    }
}

async function loadIdeas() {
    if (!auth.currentUser) return;
    try {
        const querySnapshot = await db.collection('ideas')
            .where('createdBy', '==', auth.currentUser.uid)
            .get();
        const ideas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const comparator = (a, b) => {
            let valA, valB;
            if (sortColumn === 'title') {
                valA = a.title.toLowerCase();
                valB = b.title.toLowerCase();
            } else if (sortColumn === 'idea') {
                valA = a.idea.toLowerCase();
                valB = b.idea.toLowerCase();
            } else {
                valA = a.title.toLowerCase(); // Default to title
                valB = b.title.toLowerCase();
            }
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        };
        const pinnedIdeas = ideas.filter(idea => idea.pinned).sort(comparator);
        const unpinnedIdeas = ideas.filter(idea => !idea.pinned).sort(comparator);
        const sortedIdeas = [...pinnedIdeas, ...unpinnedIdeas];
        populateTable(sortedIdeas, 'ideas');
    } catch (e) {
        alert('Failed to load ideas: ' + e.message);
    }
}

// UI Functions
function showLoginForm() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('bugTrackerContainer').classList.add('hidden');
    document.getElementById('bugFormModal').classList.add('hidden');
    document.getElementById('modalBackdrop').classList.add('hidden');
}

function showBugTracker() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('bugTrackerContainer').classList.remove('hidden');
    setMode(currentMode);
}

function populateTable(data, mode) {
    const tableBody = document.getElementById('bugTableBody');
    tableBody.innerHTML = '';
    if (mode === 'bugs') {
        data.forEach(bug => {
            const row = document.createElement('tr');
            row.classList.add(`status-${bug.status.toLowerCase().replace(' ', '-')}`);
            row.classList.add(`priority-${bug.priority.toLowerCase()}`);
            if (bug.pinned) row.classList.add('pinned');
            let linkText;
            if (Array.isArray(bug.links)) {
                linkText = bug.links.join(', ');
            } else {
                linkText = bug.links || '';
            }
            row.innerHTML = `
                <td>${bug.title}</td>
                <td>${bug.category || 'N/A'}</td>
                <td>${bug.status}</td>
                <td>${bug.priority}</td>
                <td>${bug.date_found}</td>
                <td>${linkText.startsWith('http') ? `<a href="${linkText}" target="_blank">${linkText}</a>` : linkText}</td>
                <td>
                    <button class="editButton" data-id="${bug.id}">View</button>
                    <button class="deleteButton" data-id="${bug.id}">Delete</button>
                    <button class="pinButton" data-id="${bug.id}">${bug.pinned ? 'Unpin' : 'Pin'}</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        data.forEach(idea => {
            const row = document.createElement('tr');
            if (idea.pinned) row.classList.add('pinned');
            let linkText;
            if (Array.isArray(idea.links)) {
                linkText = idea.links.join(', ');
            } else {
                linkText = idea.links || '';
            }
            row.innerHTML = `
                <td>${idea.title}</td>
                <td>${idea.idea}</td>
                <td>${linkText.startsWith('http') ? `<a href="${linkText}" target="_blank">${linkText}</a>` : linkText}</td>
                <td>
                    <button class="editButton" data-id="${idea.id}">View</button>
                    <button class="deleteButton" data-id="${idea.id}">Delete</button>
                    <button class="pinButton" data-id="${idea.id}">${idea.pinned ? 'Unpin' : 'Pin'}</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function setupForm(mode, isEdit = false, data = {}) {
    const formTitle = document.getElementById('formTitle');
    const categoryLabel = document.getElementById('categoryLabel');
    const categoryInput = document.getElementById('category');
    const descriptionLabel = document.getElementById('descriptionLabel');
    const descriptionInput = document.getElementById('description');
    const statusLabel = document.getElementById('statusLabel');
    const statusSelect = document.getElementById('status');
    const priorityLabel = document.getElementById('priorityLabel');
    const prioritySelect = document.getElementById('priority');
    const dateFoundLabel = document.getElementById('dateFoundLabel');
    const dateFoundInput = document.getElementById('date_found');

    if (mode === 'bugs') {
        formTitle.textContent = isEdit ? 'View / Edit Bug' : 'Add Bug';
        categoryLabel.style.display = 'block';
        categoryInput.style.display = 'block';
        descriptionLabel.textContent = 'Description:';
        statusLabel.style.display = 'block';
        statusSelect.style.display = 'block';
        priorityLabel.style.display = 'block';
        prioritySelect.style.display = 'block';
        dateFoundLabel.style.display = 'block';
        dateFoundInput.style.display = 'block';
    } else {
        formTitle.textContent = isEdit ? 'View / Edit Idea' : 'Add Idea';
        categoryLabel.style.display = 'none';
        categoryInput.style.display = 'none';
        descriptionLabel.textContent = 'Idea:';
        statusLabel.style.display = 'none';
        statusSelect.style.display = 'none';
        priorityLabel.style.display = 'none';
        prioritySelect.style.display = 'none';
        dateFoundLabel.style.display = 'none';
        dateFoundInput.style.display = 'none';
    }

    if (isEdit) {
        document.getElementById('title').value = data.title || '';
        let linkInputValue = '';
        if (Array.isArray(data.links)) {
            linkInputValue = data.links.join(', ');
        } else {
            linkInputValue = data.links || '';
        }
        document.getElementById('linkInput').value = linkInputValue;
        if (mode === 'bugs') {
            document.getElementById('category').value = data.category || '';
            document.getElementById('description').value = data.description || '';
            document.getElementById('status').value = data.status || 'Open';
            document.getElementById('priority').value = data.priority || 'Low';
            document.getElementById('date_found').value = data.date_found || '';
        } else {
            document.getElementById('description').value = data.idea || '';
        }
    } else {
        document.getElementById('bugForm').reset();
        document.getElementById('linkInput').value = '';
        if (mode === 'bugs') {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date_found').value = today;
        }
    }
    showModal();
}

function openAddForm() {
    editingId = null;
    editingMode = null;
    setupForm(currentMode);
}

function openEditForm(id, mode) {
    const collection = mode === 'bugs' ? 'bugs' : 'ideas';
    db.collection(collection).doc(id).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            setupForm(mode, true, data);
            editingId = id;
            editingMode = mode;
        } else {
            alert('Item not found');
        }
    }).catch(e => {
        alert('Failed to load item: ' + e.message);
    });
}

function setMode(mode) {
    currentMode = mode;
    const bugsTab = document.getElementById('bugsTab');
    const ideasTab = document.getElementById('ideasTab');
    const addButton = document.getElementById('addButton');

    if (mode === 'bugs') {
        bugsTab.classList.add('active');
        ideasTab.classList.remove('active');
        addButton.textContent = 'Add Bug';
        document.getElementById('filterContainer').style.display = 'block';
        document.getElementById('tableHeaders').innerHTML = `
            <tr>
                <th data-column="title">Title</th>
                <th data-column="category">Category</th>
                <th data-column="status">Status</th>
                <th data-column="priority">Priority</th>
                <th data-column="date_found">Date Found</th>
                <th>Links</th>
                <th>Actions</th>
            </tr>
        `;
        loadBugs();
    } else {
        ideasTab.classList.add('active');
        bugsTab.classList.remove('active');
        addButton.textContent = 'Add Idea';
        document.getElementById('filterContainer').style.display = 'none';
        document.getElementById('tableHeaders').innerHTML = `
            <tr>
                <th data-column="title">Title</th>
                <th data-column="idea">Idea</th>
                <th>Links</th>
                <th>Actions</th>
            </tr>
        `;
        loadIdeas();
    }

    document.querySelectorAll('#bugTable th[data-column]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-column');
            if (sortColumn === column) {
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortOrder = 'asc';
            }
            document.querySelectorAll('#bugTable th').forEach(header => header.classList.remove('asc', 'desc'));
            th.classList.add(sortOrder);
            if (currentMode === 'bugs') {
                filterAndPopulateBugs();
            } else {
                loadIdeas();
            }
        });
    });
}

function showModal() {
    document.getElementById('bugFormModal').classList.remove('hidden');
    document.getElementById('modalBackdrop').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('bugFormModal').classList.add('hidden');
    document.getElementById('modalBackdrop').classList.add('hidden');
    editingId = null;
    editingMode = null;
}

// Event Listeners
auth.onAuthStateChanged(user => {
    if (user) {
        showBugTracker();
    } else {
        showLoginForm();
    }
});

document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signIn(email, password);
});

document.getElementById('registerForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    createUser(email, password);
});

document.getElementById('showRegister').addEventListener('click', () => {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', () => {
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
});

document.getElementById('logoutButton').addEventListener('click', signOutUser);

document.getElementById('addButton').addEventListener('click', openAddForm);

document.getElementById('bugsTab').addEventListener('click', () => setMode('bugs'));
document.getElementById('ideasTab').addEventListener('click', () => setMode('ideas'));

document.getElementById('categoryFilter').addEventListener('change', filterAndPopulateBugs);

document.getElementById('bugForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    if (currentMode === 'bugs') {
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const status = document.getElementById('status').value;
        const priority = document.getElementById('priority').value;
        const date_found = document.getElementById('date_found').value;
        const bugData = { title, category, description, status, priority, date_found };
        if (editingId && editingMode === 'bugs') {
            updateBug(editingId, bugData);
        } else {
            addBug(bugData);
        }
    } else {
        const idea = document.getElementById('description').value;
        const ideaData = { title, idea };
        if (editingId && editingMode === 'ideas') {
            updateIdea(editingId, ideaData);
        } else {
            addIdea(ideaData);
        }
    }
});

document.getElementById('cancelForm').addEventListener('click', closeModal);

document.getElementById('bugTableBody').addEventListener('click', e => {
    const target = e.target;
    if (target.classList.contains('editButton')) {
        const id = target.getAttribute('data-id');
        openEditForm(id, currentMode);
    } else if (target.classList.contains('deleteButton')) {
        const id = target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this item?')) {
            if (currentMode === 'bugs') {
                deleteBug(id);
            } else {
                deleteIdea(id);
            }
        }
    } else if (target.classList.contains('pinButton')) {
        const id = target.getAttribute('data-id');
        if (currentMode === 'bugs') {
            togglePinBug(id);
        } else {
            togglePinIdea(id);
        }
    }
});

document.getElementById('modalBackdrop').addEventListener('click', closeModal);