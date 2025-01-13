// Firebase configuration (replace with your actual config from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBI8rEB5JGkUpBnCpcudl73OVvjJaIQOsM",
  authDomain: "in-out-board-d68d7.firebaseapp.com",
  databaseURL: "https://in-out-board-d68d7-default-rtdb.firebaseio.com",
  projectId: "in-out-board-d68d7",
  appId: "1:912785729741:web:34f76a9ff7ea11bf71a184"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

const loginForm = document.getElementById('auth-container');
const teamBoard = document.getElementById('team-board');
const teamMembersList = document.getElementById('team-members-list');
const logoutBtn = document.getElementById('logout-btn');

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerNameInput = document.getElementById('register-name');

const locationInput = document.getElementById('location-input');
const inBtn = document.getElementById('in-btn');
const outBtn = document.getElementById('out-btn');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// Event listener for registration button
registerBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const name = registerNameInput.value;
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;

  registerError.textContent = ''; // Clear previous error
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Registration successful:", userCredential.user);
      return database.ref('users/' + userCredential.user.uid).set({
        name: name
      });
    })
    .then(() => {
      console.log("User name saved to database.");
      registerNameInput.value = '';
      registerEmailInput.value = '';
      registerPasswordInput.value = '';
      // Optionally, provide a success message
    })
    .catch((error) => {
      console.error("Registration error:", error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          registerError.textContent = "An account with this email already exists.";
          break;
        case 'auth/invalid-email':
          registerError.textContent = "Please enter a valid email address.";
          break;
        case 'auth/weak-password':
          registerError.textContent = "Password should be at least 6 characters.";
          break;
        default:
          registerError.textContent = "Registration failed. Please try again.";
      }
    });
});

// Event listener for login button
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const email = loginEmailInput.value;
  const password = loginPasswordInput.value;

  loginError.textContent = ''; // Clear previous error
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful:", userCredential.user);
    })
    .catch((error) => {
      console.error("Login error:", error);
      switch (error.code) {
        case 'auth/user-not-found':
          loginError.textContent = "No user found with that email.";
          break;
        case 'auth/wrong-password':
          loginError.textContent = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          loginError.textContent = "Please enter a valid email address.";
          break;
        default:
          loginError.textContent = "Login failed. Please check your email and password.";
      }
    });
});

// Event listener for logout button
logoutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      console.log("Logged out");
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});

let currentUserId = null; // Store the current user's ID

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.uid);
    currentUserId = user.uid; // Set the current user ID
    loginForm.style.display = 'none';
    teamBoard.style.display = 'block';
    myCurrentStatus.innerHTML = "Loading Status";
    setupStatusListeners(); // Call setupStatusListeners
    setupMyStatusListeners(user.uid); // Set up listeners for the logged-in user's status
  } else {
    // User is signed out
    console.log("User is signed out");
    currentUserId = null; // Clear the current user ID
    loginForm.style.display = 'block';
    teamBoard.style.display = 'none';
    teamMembersList.innerHTML = '';
    myCurrentStatus.innerHTML = '';
  }
});

const myCurrentStatus = document.getElementById('my-current-status');

function setupMyStatusListeners(userId) {
  const locationOkBtn = document.getElementById('location-ok-btn');
  locationOkBtn.addEventListener('click', (e) => {
    const location = locationInput.value;
    updateMyStatus(undefined, location); // Pass undefined for status to only update location
  });

  inBtn.addEventListener('click', () => {
    updateMyStatus(true, locationInput.value);
  });

  outBtn.addEventListener('click', () => {
    updateMyStatus(false, locationInput.value);
  });

  // Listen for changes to the user's own status in real-time
  database.ref(`statuses/${userId}`).on('value', (snapshot) => {
    const userData = snapshot.val();
    let statusText = ''; // Start with an empty string
    if (userData) {
      statusText += `<span class="${userData.status === true ? 'status-in' : 'status-out'}">${userData.status === true ? 'In' : 'Out'}</span>`;
      if (userData.location) {
        statusText += ` - ${userData.location}`;
      }
      if (userData.lastUpdated) {
        const date = new Date(userData.lastUpdated);
        const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const formattedDate = date.toLocaleDateString('en-US');
        statusText += ` <span class="timestamp">(Updated: ${formattedTime} on ${formattedDate})</span>`;
      }
    } else {
      statusText = `Out - No Location Set`;
    }
    myCurrentStatus.innerHTML = statusText;
  });
}

function updateMyStatus(status, location) {
  if (currentUserId) {
    const updates = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (location !== undefined) {
      updates.location = location;
    }
    updates.lastUpdated = firebase.database.ServerValue.TIMESTAMP;

    database.ref(`statuses/${currentUserId}`).update(updates).then(() => {
      locationInput.value = ''; // Clear the location input after update
    });
  }
}

function setupStatusListeners() {
  console.log("setupStatusListeners called");
  database.ref('statuses').on('child_changed', (snapshot) => {
    const userId = snapshot.key;
    const userData = snapshot.val();
    console.log(`Status changed for user ${userId}:`, userData);

    const listItem = document.querySelector(`#member-${userId}`);
    if (listItem) {
      updateMemberListItem(listItem, userData);
    }
  });

  database.ref('statuses').on('child_added', (snapshot) => {
    const userId = snapshot.key;
    const userData = snapshot.val();
    console.log(`New status added for user ${userId}:`, userData);
    fetchAndDisplayMember(userId, userData);
  });

  database.ref('statuses').on('child_removed', (snapshot) => {
    const userId = snapshot.key;
    const listItem = document.querySelector(`#member-${userId}`);
    if (listItem) {
      listItem.remove();
    }
  });
}

function fetchAndDisplayMember(userId, userData) {
  database.ref('users/' + userId).once('value', (userSnapshot) => {
    const userName = userSnapshot.val()?.name || 'Unknown User';

    const listItem = document.createElement('li');
    listItem.classList.add('member');
    listItem.id = `member-${userId}`;

    updateMemberListItem(listItem, userData, userName);

    teamMembersList.appendChild(listItem);
  });
}

function updateMemberListItem(listItem, userData, userName) {
    const name = userName || listItem.querySelector('.member-name').textContent.replace(':', ''); // Use existing name if not provided
    listItem.innerHTML = `
      <div class="member-info-row">
        <span class="member-name">${name}</span>
        <span class="member-status ${userData.status === true ? 'status-in' : 'status-out'}">
          ${userData.status === true ? 'In' : 'Out'}
        </span>
        ${userData.location ? `<span class="member-location">${userData.location}</span>` : ''}
      </div>
      ${userData.lastUpdated ? `
        <div class="timestamp-row">
          <span class="timestamp">Updated: ${new Date(userData.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} on ${new Date(userData.lastUpdated).toLocaleDateString('en-US')}</span>
        </div>
      ` : ''}
    `;
}