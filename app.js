// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project-id.firebaseapp.com",
    // ... rest of your config
};

// --- INITIALIZE FIREBASE APP ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const usersCollection = db.collection('users');
const vouchersCollection = db.collection('vouchers');

// --- DOM ELEMENT SELECTORS (remains mostly the same) ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userInfoDisplay = document.getElementById('user-info-display');

// --- GLOBAL STATE for logged in user ---
let currentUser = null;

// --- SESSION MANAGEMENT ---
// Check if a user is already logged in from a previous session
function checkSession() {
    const userSession = sessionStorage.getItem('voucherUser');
    if (userSession) {
        currentUser = JSON.parse(userSession);
        showApp();
    } else {
        showLogin();
    }
}

// --- UI VISIBILITY FUNCTIONS ---
function showLogin() {
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showApp() {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userInfoDisplay.textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;
    
    // Show/Hide Admin Panel based on role
    const adminNav = document.getElementById('nav-admin');
    if (currentUser.role === 'Admin') {
        adminNav.classList.remove('hidden');
    } else {
        adminNav.classList.add('hidden');
    }

    initializeMainApp();
}


// --- LOGIN and LOGOUT LOGIC (CUSTOM) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        // Query Firestore for a matching user
        const query = usersCollection
            .where('username', '==', username)
            .where('password', '==', password)
            .limit(1);
            
        const snapshot = await query.get();

        if (snapshot.empty) {
            loginError.textContent = "Invalid username or password.";
            return;
        }

        // User found, get their data
        const userDoc = snapshot.docs[0];
        currentUser = {
            id: userDoc.id,
            username: userDoc.data().username,
            role: userDoc.data().role
        };

        // Store user session in the browser's sessionStorage
        sessionStorage.setItem('voucherUser', JSON.stringify(currentUser));

        // Show the main application
        showApp();

    } catch (error) {
        console.error("Login Error:", error);
        loginError.textContent = "An error occurred. Please try again.";
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('voucherUser');
    showLogin();
});


// --- MAIN APP INITIALIZATION & EVENT LISTENERS ---
function initializeMainApp() {
    // This function sets up the main app after a successful login
    // Your previous functions for navigation, forms, etc., go here.
    // For example:
    document.getElementById('nav-voucher').click(); // Show voucher form by default
    setupEventListeners(); // We will create this function next
}

function setupEventListeners() {
    // This is to prevent adding listeners multiple times
    if (window.appInitialized) return;

    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Your navigation logic here
        });
    });

    // Your other event listeners for save, update, delete, reports etc.
    // go here. The logic inside them remains the same, but they
    // will now use `currentUser.username` instead of `auth.currentUser.uid`
    // to track who created the voucher.
    
    window.appInitialized = true;
}

// --- RENDER RECORDS (Example Update) ---
function renderRecords() {
    // Now, you can filter by username instead of UID
    vouchersCollection.where('author', '==', currentUser.username).orderBy('voucherNo', 'desc')
        .onSnapshot(snapshot => {
            // ... your existing rendering logic
        });
}

// --- SAVE VOUCHER (Example Update) ---
async function handleSaveVoucher(e) {
    e.preventDefault();
    const newVoucher = {
        // ... other voucher data
        author: currentUser.username, // Store username instead of UID
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await vouchersCollection.add(newVoucher);
    // ...
}


// --- START THE APP ---
checkSession();
