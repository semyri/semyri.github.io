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
let currentLinks = [];
let editingBugId = null;
let sortColumn = 'date_found'; // Default sort column
let sortOrder = 'desc'; // Default sort order (newest first)

// Authentication Functions
function signIn(email, password) {
    console.log('Attempting sign-in with:', email);
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Signed in successfully:', userCredential.user.email);
        })
        .catch((error) => {
            console.error('Sign-in error:', error.code, error.message);
            alert('Login failed: ' + error.message);
        });
}

function createUser(email, password) {
    console.log('Attempting registration with:', email);
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User created successfully:', userCredential.user.email);
        })
        .catch((error) => {
            console.error('Registration error:', error.code, error.message);
            alert('Registration failed: ' + error.message);
        });
}

function signOutUser() {
    auth.signOut()
        .then(() => {
            console.log('Signed out successfully');
        })
        .catch((error) => {
            console.error('Sign-out error:', error);
            alert('Logout failed: ' + error.message);
        });
}

// Bug Management Functions
async function addBug(bugData) {
    try {
        await db.collection('bugs').add({
            ...bugData,
            links: currentLinks,
            createdBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            pinned: false
        });
        console.log('Bug added successfully');
        closeModal();
        loadBugs();
    } catch (e) {
        console.error('Error adding bug:', e);
        alert('Failed to add bug: ' + e.message);
    }
}

async function updateBug(bugId, updatedData) {
    try {
        await db.collection('bugs').doc(bugId).update({
            ...updatedData,
            links: currentLinks
        });
        console.log('Bug updated successfully');
        closeModal();
        loadBugs();
    } catch (e) {
        console.error('Error updating bug:', e);
        alert('Failed to update bug: ' + e.message);
    }
}

async function deleteBug(bugId) {
    try {
        await db.collection('bugs').doc(bugId).delete();
        console.log('Bug deleted successfully');
        loadBugs();
    } catch (e) {
        console.error('Error deleting bug:', e);
        alert('Failed to delete bug: ' + e.message);
    }
}

async function togglePin(bugId) {
    try {
        const bugRef = db.collection('bugs').doc(bugId);
        const bugDoc = await bugRef.get();
        const currentPinned = bugDoc.data().pinned || false;
        await bugRef.update({ pinned: !currentPinned });
        console.log('Bug pinned state toggled');
        loadBugs();
    } catch (e) {
        console.error('Error toggling pin:', e);
        alert('Failed to toggle pin: ' + e.message);
    }
}

async function loadBugs() {
    try {
        const querySnapshot = await db.collection('bugs')
            .where('createdBy', '==', auth.currentUser.uid)
            .get();
        let bugs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
                valA = a[sortColumn].toString().toLowerCase();
                valB = b[sortColumn].toString().toLowerCase();
            }
            if (typeof valA === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            }
        };

        const pinnedBugs = bugs.filter(bug => bug.pinned).sort(comparator);
        const unpinnedBugs = bugs.filter(bug => !bug.pinned).sort(comparator);
        const sortedBugs = [...pinnedBugs, ...unpinnedBugs];

        populateBugTable(sortedBugs);
    } catch (e) {
        console.error('Error loading bugs:', e);
        alert('Failed to load bugs: ' + e.message);
    }
}

// UI Functions
function showLoginForm() {
    console.log('Showing login form');
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('bugTrackerContainer').classList.add('hidden');
    document.getElementById('bugFormModal').classList.add('hidden');
    document.getElementById('modalBackdrop').classList.add('hidden');
}

function showBugTracker() {
    console.log('Showing bug tracker');
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('bugTrackerContainer').classList.remove('hidden');
    loadBugs();
}

function populateBugTable(bugs) {
    const tableBody = document.getElementById('bugTableBody');
    tableBody.innerHTML = '';
    bugs.forEach(bug => {
        const row = document.createElement('tr');
        row.classList.add(`status-${bug.status.toLowerCase().replace(' ', '-')}`);
        row.classList.add(`priority-${bug.priority.toLowerCase()}`);
        if (bug.pinned) row.classList.add('pinned');
        row.innerHTML = `
            <td>${bug.title}</td>
            <td>${bug.status}</td>
            <td>${bug.priority}</td>
            <td>${bug.date_found}</td>
            <td>${bug.links.map(link => {
                if (link.startsWith('http://') || link.startsWith('https://')) {
                    return `<a href="${link}" target="_blank">${link}</a>`;
                } else {
                    return link;
                }
            }).join(', ')}</td>
            <td>
                <button class="editButton" data-id="${bug.id}">View</button>
                <button class="deleteButton" data-id="${bug.id}">Delete</button>
                <button class="pinButton" data-id="${bug.id}">${bug.pinned ? 'Unpin' : 'Pin'}</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function displayLinks() {
    const linksList = document.getElementById('linksList');
    linksList.innerHTML = '';
    currentLinks.forEach((link, index) => {
        const linkDiv = document.createElement('div');
        linkDiv.innerHTML = `${link} <button type="button" data-index="${index}">Remove</button>`;
        linksList.appendChild(linkDiv);
    });
}

function resetFormFields() {
    document.getElementById('bugForm').reset();
    currentLinks = [];
    displayLinks();
    document.getElementById('formTitle').textContent = 'Add Bug';
    editingBugId = null;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date_found').value = today;
}

function showModal() {
    const modal = document.getElementById('bugFormModal');
    const backdrop = document.getElementById('modalBackdrop');
    if (modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        modal.style.display = 'block';
        backdrop.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('bugFormModal');
    const backdrop = document.getElementById('modalBackdrop');
    if (modal && backdrop) {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    }
}

function openAddBugForm() {
    resetFormFields();
    showModal();
}

function openEditForm(bugId) {
    console.log('Opening edit form for bug ID:', bugId);
    db.collection('bugs').doc(bugId).get().then(doc => {
        if (doc.exists) {
            const bug = doc.data();
            document.getElementById('title').value = bug.title;
            document.getElementById('description').value = bug.description;
            document.getElementById('status').value = bug.status;
            document.getElementById('priority').value = bug.priority;
            document.getElementById('date_found').value = bug.date_found;
            currentLinks = bug.links.slice();
            displayLinks();
            document.getElementById('formTitle').textContent = 'View / Edit Bug';
            editingBugId = bugId;
            showModal();
        } else {
            console.error('Bug document does not exist');
            alert('Bug not found');
        }
    }).catch(e => {
        console.error('Error fetching bug for edit:', e);
        alert('Failed to load bug for editing: ' + e.message);
    });
}

// Event Listeners
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User authenticated:', user.email);
        showBugTracker();
    } else {
        console.log('No user authenticated');
        showLoginForm();
    }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signIn(email, password);
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        createUser(email, password);
    });
}

const showRegister = document.getElementById('showRegister');
if (showRegister) {
    showRegister.addEventListener('click', () => {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registerSection').classList.remove('hidden');
    });
}

const showLogin = document.getElementById('showLogin');
if (showLogin) {
    showLogin.addEventListener('click', () => {
        document.getElementById('registerSection').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
    });
}

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', signOutUser);
}

const addBugButton = document.getElementById('addBugButton');
if (addBugButton) {
    addBugButton.addEventListener('click', openAddBugForm);
}

const addLinkButton = document.getElementById('addLinkButton');
if (addLinkButton) {
    addLinkButton.addEventListener('click', () => {
        const linkInput = document.getElementById('linkInput');
        const link = linkInput.value.trim();
        if (link) {
            currentLinks.push(link);
            displayLinks();
            linkInput.value = '';
        } else {
            alert('Please enter a link or path');
        }
    });
}

const linksList = document.getElementById('linksList');
if (linksList) {
    linksList.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            const index = parseInt(e.target.getAttribute('data-index'));
            currentLinks.splice(index, 1);
            displayLinks();
        }
    });
}

const bugForm = document.getElementById('bugForm');
if (bugForm) {
    bugForm.addEventListener('submit', e => {
        e.preventDefault();
        const bugData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            status: document.getElementById('status').value,
            priority: document.getElementById('priority').value,
            date_found: document.getElementById('date_found').value
        };
        if (editingBugId) {
            updateBug(editingBugId, bugData);
        } else {
            addBug(bugData);
        }
    });
}

const cancelForm = document.getElementById('cancelForm');
if (cancelForm) {
    cancelForm.addEventListener('click', closeModal);
}

const bugTableBody = document.getElementById('bugTableBody');
if (bugTableBody) {
    bugTableBody.addEventListener('click', e => {
        const target = e.target;
        if (target.classList.contains('editButton')) {
            const bugId = target.getAttribute('data-id');
            console.log('Edit button clicked for bug ID:', bugId);
            openEditForm(bugId);
        } else if (target.classList.contains('deleteButton')) {
            const bugId = target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this bug?')) {
                deleteBug(bugId);
            }
        } else if (target.classList.contains('pinButton')) {
            const bugId = target.getAttribute('data-id');
            togglePin(bugId);
        }
    });
}

const tableHeaders = document.querySelectorAll('#bugTable th[data-column]');
if (tableHeaders.length > 0) {
    tableHeaders.forEach(th => {
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
            loadBugs();
        });
    });
}

const modalBackdrop = document.getElementById('modalBackdrop');
if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeModal);
}