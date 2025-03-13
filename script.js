// Firebase Configuration (replace with your own config)
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

// Global variable to store links for the current bug
let currentLinks = [];
let editingBugId = null;

// Authentication Functions
function signIn(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Signed in:', userCredential.user.email);
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            alert('Login failed: ' + error.message);
        });
}

function createUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User created:', userCredential.user.email);
        })
        .catch((error) => {
            console.error('Create user error:', error);
            alert('Registration failed: ' + error.message);
        });
}

function signOutUser() {
    auth.signOut()
        .then(() => {
            console.log('Signed out');
        })
        .catch((error) => {
            console.error('Sign out error:', error);
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
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Bug added');
        resetForm();
        loadBugs();
    } catch (e) {
        console.error('Error adding bug:', e);
        alert('Failed to add bug');
    }
}

async function updateBug(bugId, updatedData) {
    try {
        await db.collection('bugs').doc(bugId).update({
            ...updatedData,
            links: currentLinks
        });
        console.log('Bug updated');
        resetForm();
        loadBugs();
    } catch (e) {
        console.error('Error updating bug:', e);
        alert('Failed to update bug');
    }
}

async function deleteBug(bugId) {
    try {
        await db.collection('bugs').doc(bugId).delete();
        console.log('Bug deleted');
        loadBugs();
    } catch (e) {
        console.error('Error deleting bug:', e);
        alert('Failed to delete bug');
    }
}

async function loadBugs() {
    try {
        const querySnapshot = await db.collection('bugs')
            .where('createdBy', '==', auth.currentUser.uid)
            .get();
        const bugs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateBugTable(bugs);
    } catch (e) {
        console.error('Error loading bugs:', e);
        alert('Failed to load bugs');
    }
}

// UI Functions
function showLoginForm() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('bugTrackerContainer').classList.add('hidden');
}

function showBugTracker() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('bugTrackerContainer').classList.remove('hidden');
    loadBugs();
}

function populateBugTable(bugs) {
    const tableBody = document.getElementById('bugTableBody');
    tableBody.innerHTML = '';
    bugs.forEach(bug => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bug.title}</td>
            <td>${bug.status}</td>
            <td>${bug.priority}</td>
            <td>${bug.date_found}</td>
            <td>${bug.links.map(link => `<a href="${link}" target="_blank">${link}</a>`).join(', ')}</td>
            <td>
                <button class="editButton" data-id="${bug.id}">Edit</button>
                <button class="deleteButton" data-id="${bug.id}">Delete</button>
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

function resetForm() {
    document.getElementById('bugForm').reset();
    currentLinks = [];
    displayLinks();
    document.getElementById('bugFormContainer').classList.add('hidden');
    document.getElementById('formTitle').textContent = 'Add Bug';
    editingBugId = null;
}

function openEditForm(bugId) {
    db.collection('bugs').doc(bugId).get().then(doc => {
        const bug = doc.data();
        document.getElementById('title').value = bug.title;
        document.getElementById('description').value = bug.description;
        document.getElementById('status').value = bug.status;
        document.getElementById('priority').value = bug.priority;
        document.getElementById('date_found').value = bug.date_found;
        currentLinks = bug.links.slice();
        displayLinks();
        document.getElementById('formTitle').textContent = 'Edit Bug';
        document.getElementById('bugFormContainer').classList.remove('hidden');
        editingBugId = bugId;
    });
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

document.getElementById('addBugButton').addEventListener('click', () => {
    resetForm();
    document.getElementById('bugFormContainer').classList.remove('hidden');
});

document.getElementById('addLinkButton').addEventListener('click', () => {
    const linkInput = document.getElementById('linkInput');
    const link = linkInput.value.trim();
    if (link && link.match(/^https?:\/\/.+/)) {
        currentLinks.push(link);
        displayLinks();
        linkInput.value = '';
    } else {
        alert('Please enter a valid URL');
    }
});

document.getElementById('linksList').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
        const index = parseInt(e.target.getAttribute('data-index'));
        currentLinks.splice(index, 1);
        displayLinks();
    }
});

document.getElementById('bugForm').addEventListener('submit', e => {
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

document.getElementById('cancelForm').addEventListener('click', resetForm);

document.getElementById('bugTableBody').addEventListener('click', e => {
    if (e.target.classList.contains('editButton')) {
        const bugId = e.target.getAttribute('data-id');
        openEditForm(bugId);
    } else if (e.target.classList.contains('deleteButton')) {
        const bugId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this bug?')) {
            deleteBug(bugId);
        }
    }
});