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
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerNameInput = document.getElementById('register-name');

const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

const locationInput = document.getElementById('location-input');
const locationOkBtn = document.getElementById('location-ok-btn');

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

      // **ADD THIS SECTION TO SAVE USER PROFILE DATA**
      return database.ref('users/' + userCredential.user.uid).set({
        name: name,
        email: email // You might want to save the email too
        // Add other profile information here if needed
      }).then(() => userCredential.user.sendEmailVerification()); // Chain the email verification
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
  database.ref(`statuses/${userId}`).update({
    location: location,
    lastUpdated: firebase.database.ServerValue.TIMESTAMP
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
    listItem.innerHTML = `
      <div class="member-info-row">
        <span class="member-name">${name}</span>
        ${userData.location ? `<span class="member-location">${userData.location}</span>` : ''}
      </div>
      ${userData.lastUpdated ? `
        <div class="timestamp-row">
          <span class="timestamp">Updated: ${new Date(userData.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} on ${new Date(userData.lastUpdated).toLocaleDateString('en-US')}</span>
        </div>
      ` : ''}
    `;
}