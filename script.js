// Firebase configuration
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
const resetPasswordBtn = document.getElementById('reset-password-btn');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerNameInput = document.getElementById('register-name');

const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

const locationInput = document.getElementById('location-input');
const locationOkBtn = document.getElementById('location-ok-btn');

const shortcutsList = document.getElementById('shortcuts-list');
const closeShortcutsBtn = document.getElementById('close-shortcuts-btn');

const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// History Popup Elements
const historyPopup = document.querySelector('.history-popup');
const historyPopupList = historyPopup.querySelector('ul');
const closeHistoryBtn = historyPopup.querySelector('.close-popup-btn');

// Function to enable dark mode
function enableDarkMode() {
  body.classList.add('dark-mode');
  localStorage.setItem('darkMode', 'enabled');
}

// Function to disable dark mode
function disableDarkMode() {
  body.classList.remove('dark-mode');
  localStorage.setItem('darkMode', 'disabled');
}

// Check for user's preference in localStorage
if (localStorage.getItem('darkMode') === 'enabled') {
  enableDarkMode();
  darkModeToggle.checked = true;
}

// Event listener for the dark mode toggle
darkModeToggle.addEventListener('change', () => {
  if (darkModeToggle.checked) {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
});

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
        name: name,
        email: email
      }).then(() => userCredential.user.sendEmailVerification());
    })
    .then(() => {
      console.log("User data saved and verification email sent.");
      registerError.textContent = "Registration successful. Please check your email to verify your account.";
      registerNameInput.value = '';
      registerEmailInput.value = '';
      registerPasswordInput.value = '';
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
      const user = userCredential.user;
      if (user.emailVerified) {
        console.log("Login successful (email verified):", user.uid);
        // Proceed to team board (handled by auth.onAuthStateChanged)
      } else {
        console.log("Login attempted with unverified email:", user.uid);
        loginError.textContent = "Please verify your email address before logging in.";
        const resendButton = document.createElement('button');
        resendButton.textContent = 'Resend Verification Email';
        resendButton.classList.add('button');
        resendButton.addEventListener('click', () => {
          user.sendEmailVerification()
            .then(() => {
              loginError.textContent = "Verification email resent. Please check your inbox.";
            })
            .catch((error) => {
              loginError.textContent = `Error resending verification email: ${error.message}`;
            });
        });
        loginError.parentElement.appendChild(resendButton);
      }
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

// Event listener for reset password button
resetPasswordBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const email = loginEmailInput.value;

  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => {
        loginError.textContent = "Password reset email sent. Please check your inbox.";
      })
      .catch((error) => {
        console.error("Password reset error:", error);
        switch (error.code) {
          case 'auth/user-not-found':
            loginError.textContent = "No user found with that email.";
            break;
          case 'auth/invalid-email':
            loginError.textContent = "Please enter a valid email address.";
            break;
          default:
            loginError.textContent = "Could not send password reset email. Please try again.";
        }
      });
  } else {
    loginError.textContent = "Please enter your email address to reset your password.";
  }
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
    if (user.emailVerified) {
      console.log("User is signed in and email is verified:", user.uid);
      currentUserId = user.uid; // Set the current user ID
      loginForm.style.display = 'none';
      teamBoard.style.display = 'block';
      setupLocationUpdate(user.uid);
      setupStatusListeners();
    } else {
      console.log("User is signed in but email is not verified:", user.uid);
      loginForm.style.display = 'block'; // Keep login form visible
      teamBoard.style.display = 'none';
      teamMembersList.innerHTML = '';
      loginError.textContent = "Please verify your email address to access the application.";
    }
  } else {
    // User is signed out
    console.log("User is signed out");
    currentUserId = null; // Clear the current user ID
    loginForm.style.display = 'block';
    teamBoard.style.display = 'none';
    teamMembersList.innerHTML = '';
  }
});

function setupLocationUpdate(userId) {
  // Fetch and set the last used location
  database.ref(`statuses/${userId}`).once('value', snapshot => {
    const userData = snapshot.val();
    if (userData && userData.location) {
      locationInput.value = userData.location;
    }
  });

  locationOkBtn.addEventListener('click', () => {
    const location = locationInput.value;
    updateLocation(userId, location);
  });
}

function updateLocation(userId, location) {
  const locationData = {
    location: location,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  const historyRef = database.ref(`statuses/${userId}/history`);

  historyRef.orderByChild('timestamp').limitToLast(20).once('value', snapshot => {
    const updates = {};
    updates[`statuses/${userId}/location`] = location;
    updates[`statuses/${userId}/lastUpdated`] = firebase.database.ServerValue.TIMESTAMP;
    updates[`statuses/${userId}/history`] = { ...snapshot.val(), [Date.now()]: locationData }; // Add new entry

    database.ref().update(updates);
  });
}

function setupStatusListeners() {
  console.log("setupStatusListeners called");
  database.ref('statuses').on('child_added', (snapshot) => {
    const userId = snapshot.key;
    const userData = snapshot.val();
    fetchAndDisplayMember(userId, userData);
  });

  database.ref('statuses').on('child_changed', (snapshot) => {
    const userId = snapshot.key;
    const userData = snapshot.val();
    const listItem = document.querySelector(`#member-${userId}`);
    if (listItem) {
      updateMemberListItem(listItem, userData);
    } else {
      console.warn(`Could not find list item for user ID: ${userId} during 'child_changed'`);
    }
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
  const name = userName || listItem.querySelector('.member-name')?.textContent.replace(':', '');
  const currentLocationHTML = userData.location
    ? `<span class="member-location clickable-location" data-user-id="${listItem.id.split('-')[1]}">${userData.location}</span>`
    : '';

  listItem.innerHTML = `
    <div class="member-info-row">
      <span class="member-name">${name}</span>
      ${currentLocationHTML}
    </div>
    ${userData.lastUpdated ? `
      <div class="timestamp-row">
        <span class="timestamp">Updated: ${new Date(userData.lastUpdated).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })}</span>
      </div>
    ` : ''}
  `;

  // Add event listener for the clickable location
  const clickableLocation = listItem.querySelector('.clickable-location');
  if (clickableLocation) {
    clickableLocation.addEventListener('click', (event) => {
      const userId = event.target.dataset.userId;
      showLocationHistory(userId, event.target);
    });
  }
}

let currentHistoryPopup = null; // To track if a popup is already open

function showLocationHistory(userId, targetElement) {
  // Close any existing popup
  if (currentHistoryPopup) {
    currentHistoryPopup.classList.add('hidden');
    currentHistoryPopup = null;
    // Remove the click outside listener if a popup was open
    window.removeEventListener('click', outsideClickListener);
  }

  const historyRef = database.ref(`statuses/${userId}/history`);

  historyRef.orderByChild('timestamp').limitToLast(21).once('value', snapshot => {
    const history = snapshot.val();
    if (history) {
      const historyArray = Object.values(history).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first

      historyPopupList.innerHTML = historyArray.map(entry => {
        const dateTime = new Date(entry.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        return `<li>${entry.location} - ${dateTime}</li>`;
      }).join('');

      // Position the popup - Let's try a fixed position in the center for now, adjust as needed
      historyPopup.style.top = `50%`;
      historyPopup.style.left = `50%`;
      historyPopup.style.transform = `translate(-50%, -50%)`;
      historyPopup.style.position = 'fixed'; // Use fixed for center positioning

      historyPopup.classList.remove('hidden');
      currentHistoryPopup = historyPopup;

      // Add event listener to close button
      closeHistoryBtn.addEventListener('click', () => {
        historyPopup.classList.add('hidden');
        currentHistoryPopup = null;
        window.removeEventListener('click', outsideClickListener); // Remove listener when closing
      }, { once: true }); // Remove listener after first execution

      // Add click outside listener
      window.addEventListener('click', outsideClickListener);
    }
  });
}

function outsideClickListener(event) {
  if (currentHistoryPopup && !historyPopup.contains(event.target) && event.target !== document.querySelector('.clickable-location')) {
    historyPopup.classList.add('hidden');
    currentHistoryPopup = null;
    window.removeEventListener('click', outsideClickListener); // Remove listener after closing
  }
}

function focusOnInput(inputId) {
  const inputElement = document.getElementById(inputId);
  if (inputElement) {
    inputElement.focus();
  }
}

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) { // Check for Ctrl or Cmd key
    switch (event.key.toLowerCase()) {
      case 'l':
        focusOnInput('login-email');
        event.preventDefault(); // Prevent default browser behavior
        break;
      case 'p':
        focusOnInput('login-password');
        event.preventDefault();
        break;
      case 'n':
        focusOnInput('register-name');
        event.preventDefault();
        break;
      case 'e':
        focusOnInput('register-email');
        event.preventDefault();
        break;
      case 'r':
        focusOnInput('register-password');
        event.preventDefault();
        break;
      case 's':
        focusOnInput('location-input');
        event.preventDefault();
        break;
    }
  }
});

locationInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // Trigger the click event on the location OK button
    locationOkBtn.click();
    event.preventDefault(); // Prevent form submission or other default behavior
  }
});

if (shortcutsList && closeShortcutsBtn) {
  document.addEventListener('keydown', (event) => {
    // Check if the backtick key is pressed (keyCode 192 or key '`')
    if (event.key === '`') {
      shortcutsList.classList.toggle('hidden');
    }
  });

  closeShortcutsBtn.addEventListener('click', () => {
    shortcutsList.classList.add('hidden');
  });

  // Optional: Close the menu if the user clicks outside of it
  window.addEventListener('click', (event) => {
    if (!shortcutsList.contains(event.target) && event.target !== document.querySelector(':focus') && !shortcutsList.classList.contains('hidden')) {
      shortcutsList.classList.add('hidden');
    }
  });
}