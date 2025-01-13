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
const registerNameInput = document.getElementById('register-name'); // New input

const locationInput = document.getElementById('location-input');
const inBtn = document.getElementById('in-btn');
const outBtn = document.getElementById('out-btn');

// Event listener for registration button
registerBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const name = registerNameInput.value; // Get the name
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Registration successful:", userCredential.user);
      // Store the name in the database, linked to the user's UID
      return database.ref('users/' + userCredential.user.uid).set({
        name: name
      });
    })
    .then(() => {
      console.log("User name saved to database.");
    })
    .catch((error) => {
      console.error("Registration error:", error);
    });
});

// Event listener for login button
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const email = loginEmailInput.value;
  const password = loginPasswordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful:", userCredential.user);
    })
    .catch((error) => {
      console.error("Login error:", error);
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
    database.ref(`statuses/${userId}`).once('value', (snapshot) => {
      const currentStatus = snapshot.val()?.status || false;
      updateMyStatus(currentStatus, location);
    });
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
    if (userData) {
      let statusText = `My Status: <span class="${userData.status === true ? 'status-in' : 'status-out'}">${userData.status === true ? 'In' : 'Out'}</span>`;
      if (userData.location) {
        statusText += ` - ${userData.location}`;
      }
      if (userData.lastUpdated) {
        const date = new Date(userData.lastUpdated);
        const formattedTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const formattedDate = date.toLocaleDateString();
        statusText += ` <span class="timestamp">(Updated: ${formattedTime} on ${formattedDate})</span>`;
      }
      myCurrentStatus.innerHTML = statusText;
    } else {
      myCurrentStatus.innerHTML = `My Status: Out - No Location Set`;
    }
  });
}

function updateMyStatus(status, location) {
  if (currentUserId) {
    database.ref(`statuses/${currentUserId}`).update({
      status: status,
      location: location,
      lastUpdated: firebase.database.ServerValue.TIMESTAMP // Add the timestamp
    });
  }
}

function setupStatusListeners() {
  console.log("setupStatusListeners called");
  database.ref('statuses').on('value', (snapshot) => {
    const statuses = snapshot.val();
    console.log("Fetched Statuses:", statuses);

    teamMembersList.innerHTML = '';

    if (statuses) {
      for (const userId in statuses) {
        const userData = statuses[userId];

        database.ref('users/' + userId).once('value', (userSnapshot) => {
          const userName = userSnapshot.val()?.name || 'Unknown User';

          const listItem = document.createElement('li');
          listItem.classList.add('member');

          const userSpan = document.createElement('span');
          userSpan.textContent = `${userName}: `;
          listItem.appendChild(userSpan);

          const statusSpan = document.createElement('span');
          statusSpan.textContent = userData.status === true ? 'In' : 'Out';
          statusSpan.classList.add(userData.status === true ? 'status-in' : 'status-out');
          listItem.appendChild(statusSpan);

          if (userData.location) {
            const locationSpan = document.createElement('span');
            locationSpan.textContent = ` - ${userData.location}`;
            listItem.appendChild(locationSpan);
          }

          // Display the timestamp
          if (userData.lastUpdated) {
            const timestampSpan = document.createElement('span');
            const date = new Date(userData.lastUpdated);
            const formattedTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const formattedDate = date.toLocaleDateString();
            timestampSpan.textContent = ` (Updated: ${date.toString()})`;
            timestampSpan.classList.add('timestamp');
            listItem.appendChild(timestampSpan);
          }

          teamMembersList.appendChild(listItem);
        });
      }
    } else {
      teamMembersList.textContent = 'No statuses yet.';
    }
  });
}