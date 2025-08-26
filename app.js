// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDkVr_8XVPQFDfo5q-8eVjuIvJHBbZ_2M",
  authDomain: "web-voucher-app.firebaseapp.com",
  databaseURL: "https://web-voucher-app-default-rtdb.firebaseio.com",
  projectId: "web-voucher-app",
  storageBucket: "web-voucher-app.firebasestorage.app",
  messagingSenderId: "290727151353",
  appId: "1:290727151353:web:bc8dba8830446585834428",
  measurementId: "G-E4V61MC0NS"
};
// --- INITIALIZE FIREBASE APP ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const vouchersCollection = db.collection('vouchers');

// --- DOM ELEMENT SELECTORS ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');

const voucherForm = document.getElementById('voucher-form');
const voucherIdInput = document.getElementById('voucherId');
const voucherNoInput = document.getElementById('voucherNo');
const dateInput = document.getElementById('date');
const paidToInput = document.getElementById('paidTo');
const purposeInput = document.getElementById('purpose');
const amountInput = document.getElementById('amount');
const amountInWordsP = document.getElementById('amountInWords');

const saveBtn = document.getElementById('save-btn');
const updateBtn = document.getElementById('update-btn');
const cancelUpdateBtn = document.getElementById('cancel-update-btn');

const recordsListDiv = document.getElementById('records-list');
const navButtons = document.querySelectorAll('nav button');
const sections = document.querySelectorAll('main section');

// --- AUTHENTICATION STATE OBSERVER ---
// This is the main controller for showing/hiding content
auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;
        initializeMainApp(); // Initialize the main app UI and data
    } else {
        // User is logged out
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// --- LOGIN AND LOGOUT LOGIC ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = ''; // Clear previous errors
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error("Login Error:", error);
            loginError.textContent = "Invalid email or password. Please try again.";
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});


// --- MAIN APP INITIALIZATION ---
function initializeMainApp() {
    setupEventListeners();
    resetVoucherForm();
    document.getElementById('nav-voucher').click(); // Show voucher form by default
}

// --- SETUP EVENT LISTENERS (Called once after login) ---
function setupEventListeners() {
    // Navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => handleNavigation(button));
    });

    // Voucher Form Actions
    voucherForm.addEventListener('submit', handleSaveVoucher);
    updateBtn.addEventListener('click', handleUpdateVoucher);
    cancelUpdateBtn.addEventListener('click', resetVoucherForm);

    // Dynamic actions on the records list (Edit, Delete, Print)
    recordsListDiv.addEventListener('click', handleRecordAction);
    
    // Convert amount to words dynamically
    amountInput.addEventListener('input', () => {
        const amount = amountInput.value;
        amountInWordsP.textContent = amount ? numberToWords(amount) + ' Only' : '...';
    });
}

// --- NAVIGATION HANDLER ---
function handleNavigation(clickedButton) {
    sections.forEach(sec => sec.classList.add('hidden'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(clickedButton.id.replace('nav-', '') + '-section');
    targetSection.classList.remove('hidden');
    clickedButton.classList.add('active');

    // Load data for the specific section
    if (targetSection.id === 'records-section') {
        renderRecords();
    }
    if (targetSection.id === 'reports-section') {
        // You can add your report filter population logic here
    }
}


// --- CRUD AND DATA FUNCTIONS ---

async function handleSaveVoucher(e) {
    e.preventDefault();
    const newVoucher = {
        voucherNo: parseInt(voucherNoInput.value),
        date: dateInput.value,
        paidTo: paidToInput.value,
        purpose: purposeInput.value,
        amount: parseFloat(amountInput.value),
        author: auth.currentUser.uid, // Track who created it
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await vouchersCollection.add(newVoucher);
        alert('Voucher saved successfully!');
        resetVoucherForm();
    } catch (error) {
        console.error("Error saving voucher:", error);
        alert('Error: Could not save voucher.');
    }
}

async function handleUpdateVoucher() {
    const id = voucherIdInput.value;
    if (!id) return;

    const updatedData = {
        date: dateInput.value,
        paidTo: paidToInput.value,
        purpose: purposeInput.value,
        amount: parseFloat(amountInput.value),
    };

    try {
        await vouchersCollection.doc(id).update(updatedData);
        alert('Voucher updated successfully!');
        resetVoucherForm();
    } catch (error) {
        console.error("Error updating voucher:", error);
        alert('Error: Could not update voucher.');
    }
}

function renderRecords() {
    // Only fetch records created by the current user
    vouchersCollection.where('author', '==', auth.currentUser.uid).orderBy('voucherNo', 'desc')
        .onSnapshot(snapshot => {
            recordsListDiv.innerHTML = '';
            if (snapshot.empty) {
                recordsListDiv.innerHTML = '<p>No records found. Create a new voucher to get started.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const voucher = doc.data();
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';
                recordItem.setAttribute('data-id', doc.id);
                // ... (innerHTML for record item remains the same)
                 recordItem.innerHTML = `
                    <h3>Voucher #${voucher.voucherNo} <span>Date: ${voucher.date}</span></h3>
                    <p><strong>Paid To:</strong> ${voucher.paidTo}</p>
                    <p><strong>Purpose:</strong> ${voucher.purpose}</p>
                    <p class="amount">Rs. ${voucher.amount.toFixed(2)}</p>
                    <div class="record-actions">
                        <button class="btn-print">Print</button>
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                `;
                recordsListDiv.appendChild(recordItem);
            });
        }, error => {
            console.error("Error fetching records:", error);
            recordsListDiv.innerHTML = '<p>Error loading records.</p>';
        });
}


async function handleRecordAction(e) {
    const targetButton = e.target;
    const recordItem = targetButton.closest('.record-item');
    if (!recordItem) return;

    const docId = recordItem.dataset.id;

    if (targetButton.classList.contains('btn-delete')) {
        if (confirm('Are you sure you want to delete this voucher permanently?')) {
            try {
                await vouchersCollection.doc(docId).delete();
                alert('Voucher deleted.');
            } catch (error) {
                console.error("Error deleting voucher:", error);
                alert('Could not delete voucher.');
            }
        }
    }

    if (targetButton.classList.contains('btn-edit')) {
        const doc = await vouchersCollection.doc(docId).get();
        const voucher = doc.data();

        voucherIdInput.value = doc.id;
        voucherNoInput.value = voucher.voucherNo;
        dateInput.value = voucher.date;
        paidToInput.value = voucher.paidTo;
        purposeInput.value = voucher.purpose;
        amountInput.value = voucher.amount;
        amountInput.dispatchEvent(new Event('input')); // Trigger word conversion

        saveBtn.classList.add('hidden');
        updateBtn.classList.remove('hidden');
        cancelUpdateBtn.classList.remove('hidden');

        document.getElementById('nav-voucher').click();
    }
    
    // (Your Print and Report logic can be added back here)
}


// --- UTILITY FUNCTIONS ---
async function resetVoucherForm() {
    voucherForm.reset();
    voucherIdInput.value = '';
    dateInput.valueAsDate = new Date();
    
    // Get and set the next voucher number
    const nextVoucherNo = await getNextVoucherNumber();
    voucherNoInput.value = nextVoucherNo;

    amountInWordsP.textContent = '...';
    saveBtn.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    cancelUpdateBtn.classList.add('hidden');
}

async function getNextVoucherNumber() {
    const query = vouchersCollection.where('author', '==', auth.currentUser.uid).orderBy('voucherNo', 'desc').limit(1);
    const snapshot = await query.get();
    if (snapshot.empty) {
        return 1;
    }
    const lastVoucher = snapshot.docs[0].data();
    return lastVoucher.voucherNo + 1;
}

// Number to Words function remains the same
function numberToWords(num) {
    // ... (keep the same function from the previous answer)
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const numStr = Math.round(num).toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}    if (targetSection.id === 'records-section') {
        renderRecords();
    }
    if (targetSection.id === 'reports-section') {
        // You can add your report filter population logic here
    }
}


// --- CRUD AND DATA FUNCTIONS ---

async function handleSaveVoucher(e) {
    e.preventDefault();
    const newVoucher = {
        voucherNo: parseInt(voucherNoInput.value),
        date: dateInput.value,
        paidTo: paidToInput.value,
        purpose: purposeInput.value,
        amount: parseFloat(amountInput.value),
        author: auth.currentUser.uid, // Track who created it
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await vouchersCollection.add(newVoucher);
        alert('Voucher saved successfully!');
        resetVoucherForm();
    } catch (error) {
        console.error("Error saving voucher:", error);
        alert('Error: Could not save voucher.');
    }
}

async function handleUpdateVoucher() {
    const id = voucherIdInput.value;
    if (!id) return;

    const updatedData = {
        date: dateInput.value,
        paidTo: paidToInput.value,
        purpose: purposeInput.value,
        amount: parseFloat(amountInput.value),
    };

    try {
        await vouchersCollection.doc(id).update(updatedData);
        alert('Voucher updated successfully!');
        resetVoucherForm();
    } catch (error) {
        console.error("Error updating voucher:", error);
        alert('Error: Could not update voucher.');
    }
}

function renderRecords() {
    // Only fetch records created by the current user
    vouchersCollection.where('author', '==', auth.currentUser.uid).orderBy('voucherNo', 'desc')
        .onSnapshot(snapshot => {
            recordsListDiv.innerHTML = '';
            if (snapshot.empty) {
                recordsListDiv.innerHTML = '<p>No records found. Create a new voucher to get started.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const voucher = doc.data();
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';
                recordItem.setAttribute('data-id', doc.id);
                // ... (innerHTML for record item remains the same)
                 recordItem.innerHTML = `
                    <h3>Voucher #${voucher.voucherNo} <span>Date: ${voucher.date}</span></h3>
                    <p><strong>Paid To:</strong> ${voucher.paidTo}</p>
                    <p><strong>Purpose:</strong> ${voucher.purpose}</p>
                    <p class="amount">Rs. ${voucher.amount.toFixed(2)}</p>
                    <div class="record-actions">
                        <button class="btn-print">Print</button>
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                `;
                recordsListDiv.appendChild(recordItem);
            });
        }, error => {
            console.error("Error fetching records:", error);
            recordsListDiv.innerHTML = '<p>Error loading records.</p>';
        });
}


async function handleRecordAction(e) {
    const targetButton = e.target;
    const recordItem = targetButton.closest('.record-item');
    if (!recordItem) return;

    const docId = recordItem.dataset.id;

    if (targetButton.classList.contains('btn-delete')) {
        if (confirm('Are you sure you want to delete this voucher permanently?')) {
            try {
                await vouchersCollection.doc(docId).delete();
                alert('Voucher deleted.');
            } catch (error) {
                console.error("Error deleting voucher:", error);
                alert('Could not delete voucher.');
            }
        }
    }

    if (targetButton.classList.contains('btn-edit')) {
        const doc = await vouchersCollection.doc(docId).get();
        const voucher = doc.data();

        voucherIdInput.value = doc.id;
        voucherNoInput.value = voucher.voucherNo;
        dateInput.value = voucher.date;
        paidToInput.value = voucher.paidTo;
        purposeInput.value = voucher.purpose;
        amountInput.value = voucher.amount;
        amountInput.dispatchEvent(new Event('input')); // Trigger word conversion

        saveBtn.classList.add('hidden');
        updateBtn.classList.remove('hidden');
        cancelUpdateBtn.classList.remove('hidden');

        document.getElementById('nav-voucher').click();
    }
    
    // (Your Print and Report logic can be added back here)
}


// --- UTILITY FUNCTIONS ---
async function resetVoucherForm() {
    voucherForm.reset();
    voucherIdInput.value = '';
    dateInput.valueAsDate = new Date();
    
    // Get and set the next voucher number
    const nextVoucherNo = await getNextVoucherNumber();
    voucherNoInput.value = nextVoucherNo;

    amountInWordsP.textContent = '...';
    saveBtn.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    cancelUpdateBtn.classList.add('hidden');
}

async function getNextVoucherNumber() {
    const query = vouchersCollection.where('author', '==', auth.currentUser.uid).orderBy('voucherNo', 'desc').limit(1);
    const snapshot = await query.get();
    if (snapshot.empty) {
        return 1;
    }
    const lastVoucher = snapshot.docs[0].data();
    return lastVoucher.voucherNo + 1;
}

// Number to Words function remains the same
function numberToWords(num) {
    // ... (keep the same function from the previous answer)
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const numStr = Math.round(num).toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}// Wait for the DOM and Firebase SDKs to be loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
    <script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDDkVr_8XVPQFDfo5q-8eVjuIvJHBbZ_2M",
    authDomain: "web-voucher-app.firebaseapp.com",
    databaseURL: "https://web-voucher-app-default-rtdb.firebaseio.com",
    projectId: "web-voucher-app",
    storageBucket: "web-voucher-app.firebasestorage.app",
    messagingSenderId: "290727151353",
    appId: "1:290727151353:web:bc8dba8830446585834428",
    measurementId: "G-E4V61MC0NS"
  };
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

    // --- SELECTORS ---
    // (Selectors for forms, buttons, sections, etc.)
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailEl = document.getElementById('user-email');
    
    const voucherForm = document.getElementById('voucher-form');
    const voucherIdInput = document.getElementById('voucherId');
    const voucherNoInput = document.getElementById('voucherNo');
    // ... all other form input selectors
    const saveBtn = document.getElementById('save-btn');
    const updateBtn = document.getElementById('update-btn');
    const cancelUpdateBtn = document.getElementById('cancel-update-btn');

    const recordsListDiv = document.getElementById('records-list');
    
    // Navigation
    const navButtons = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('main section');
    
    // Reports
    const reportYearSelect = document.getElementById('report-year');
    const reportMonthSelect = document.getElementById('report-month');
    const downloadReportBtn = document.getElementById('download-report-btn');

    // --- AUTHENTICATION ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userEmailEl.textContent = user.email;
            initializeApp();
        } else {
            // User is signed out
            loginContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = error.message;
            });
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // --- NAVIGATION ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Hide all sections
            sections.forEach(sec => sec.classList.add('hidden'));
            // Show the target section
            const target = document.getElementById(button.id.replace('nav-', '') + '-section');
            target.classList.remove('hidden');
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Refresh data on navigation
            if(target.id === 'records-section') renderRecords();
            if(target.id === 'reports-section') populateReportFilters();
        });
    });
    
    // --- FIRESTORE CRUD OPERATIONS ---
    const generateVoucherNumber = async () => {
        const snapshot = await vouchersCollection.orderBy('voucherNo', 'desc').limit(1).get();
        if (snapshot.empty) {
            return 1;
        }
        return snapshot.docs[0].data().voucherNo + 1;
    };

    voucherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const voucherNo = await generateVoucherNumber();
        
        const newVoucher = {
            voucherNo: voucherNo,
            date: document.getElementById('date').value,
            paidTo: document.getElementById('paidTo').value,
            purpose: document.getElementById('purpose').value,
            amount: parseFloat(document.getElementById('amount').value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await vouchersCollection.add(newVoucher);
            alert('Voucher saved successfully!');
            resetForm();
        } catch (error) {
            alert('Error saving voucher: ' + error.message);
        }
    });

    const renderRecords = () => {
        vouchersCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            recordsListDiv.innerHTML = '';
            if (snapshot.empty) {
                recordsListDiv.innerHTML = '<p>No records found.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const voucher = doc.data();
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';
                recordItem.setAttribute('data-id', doc.id);
                recordItem.innerHTML = `
                    <h3>Voucher #${voucher.voucherNo} <span>Date: ${voucher.date}</span></h3>
                    <p><strong>Paid To:</strong> ${voucher.paidTo}</p>
                    <p><strong>Purpose:</strong> ${voucher.purpose}</p>
                    <p class="amount">Rs. ${voucher.amount.toFixed(2)}</p>
                    <div class="record-actions">
                        <button class="btn-print">Print</button>
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                `;
                recordsListDiv.appendChild(recordItem);
            });
        });
    };
    
    // --- EDIT, UPDATE, DELETE, PRINT ---
    recordsListDiv.addEventListener('click', async (e) => {
        const id = e.target.closest('.record-item').dataset.id;

        if (e.target.classList.contains('btn-delete')) {
            if (confirm('Are you sure you want to delete this voucher?')) {
                await vouchersCollection.doc(id).delete();
                alert('Voucher deleted.');
            }
        }
        
        if (e.target.classList.contains('btn-edit')) {
            const doc = await vouchersCollection.doc(id).get();
            const voucher = doc.data();
            
            voucherIdInput.value = doc.id;
            voucherNoInput.value = voucher.voucherNo;
            document.getElementById('date').value = voucher.date;
            document.getElementById('paidTo').value = voucher.paidTo;
            document.getElementById('purpose').value = voucher.purpose;
            document.getElementById('amount').value = voucher.amount;
            
            saveBtn.classList.add('hidden');
            updateBtn.classList.remove('hidden');
            cancelUpdateBtn.classList.remove('hidden');
            
            document.getElementById('nav-voucher').click(); // Switch to voucher form
        }

        if (e.target.classList.contains('btn-print')) {
            // This is a simple print, you can create a more complex template
            const doc = await vouchersCollection.doc(id).get();
            const v = doc.data();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html><head><title>Voucher #${v.voucherNo}</title></head><body>
                <h1>CASH VOUCHER</h1>
                <p><strong>Voucher No:</strong> ${v.voucherNo}</p>
                <p><strong>Date:</strong> ${v.date}</p>
                <p><strong>Paid To:</strong> ${v.paidTo}</p>
                <p><strong>Purpose:</strong> ${v.purpose}</p>
                <h2>Amount: Rs. ${v.amount.toFixed(2)}</h2>
                </body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    });

    updateBtn.addEventListener('click', async () => {
        const id = voucherIdInput.value;
        const updatedData = {
            date: document.getElementById('date').value,
            paidTo: document.getElementById('paidTo').value,
            purpose: document.getElementById('purpose').value,
            amount: parseFloat(document.getElementById('amount').value),
        };
        await vouchersCollection.doc(id).update(updatedData);
        alert('Voucher updated!');
        resetForm();
    });

    cancelUpdateBtn.addEventListener('click', resetForm);

    // --- REPORTS ---
    const populateReportFilters = () => {
        // Simple year population logic, you can make this more dynamic
        reportYearSelect.innerHTML = '<option value="2024">2024</option><option value="2023">2023</option>';
        reportMonthSelect.innerHTML = `
            <option value="All">All Months</option>
            <option value="01">January</option><option value="02">February</option>
            <option value="03">March</option><option value="04">April</option>
            <option value="05">May</option><option value="06">June</option>
            <option value="07">July</option><option value="08">August</option>
            <option value="09">September</option><option value="10">October</option>
            <option value="11">November</option><option value="12">December</option>
        `;
    };

    downloadReportBtn.addEventListener('click', async () => {
        const year = reportYearSelect.value;
        const month = reportMonthSelect.value;
        
        let query = vouchersCollection;
        // Firestore date is stored as YYYY-MM-DD string, so we can filter with startsWith
        let startDate = `${year}-01-01`;
        let endDate = `${year}-12-31`;

        if (month !== 'All') {
            startDate = `${year}-${month}-01`;
            const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
            endDate = `${year}-${month}-${lastDay}`;
        }
        
        query = query.where('date', '>=', startDate).where('date', '<=', endDate).orderBy('date');
        const snapshot = await query.get();
        
        if(snapshot.empty){
            alert('No records found for the selected period.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const tableColumn = ["Voucher No", "Date", "Paid To", "Purpose", "Amount (Rs)"];
        const tableRows = [];
        let totalAmount = 0;

        snapshot.forEach(doc => {
            const v = doc.data();
            const rowData = [
                v.voucherNo,
                v.date,
                v.paidTo,
                v.purpose,
                v.amount.toFixed(2)
            ];
            tableRows.push(rowData);
            totalAmount += v.amount;
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        const finalY = doc.autoTable.previous.finalY;
        doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, finalY + 10);
        doc.text(`Report for ${month === 'All' ? 'All Months' : document.querySelector('#report-month option:checked').text}, ${year}`, 14, 10);
        doc.save(`voucher-report-${year}-${month}.pdf`);
    });

    // --- UTILITY FUNCTIONS ---
    function resetForm() {
        voucherForm.reset();
        voucherIdInput.value = '';
        saveBtn.classList.remove('hidden');
        updateBtn.classList.add('hidden');
        cancelUpdateBtn.classList.add('hidden');
        initializeApp();
    }
    
    async function initializeApp() {
        voucherNoInput.value = await generateVoucherNumber();
        document.getElementById('date').valueAsDate = new Date();
    }
    
    // You can keep your numberToWords function here
});});

// --- HELPER FUNCTION: Number to Words ---
// (A standard function to convert numbers to words)
function numberToWords(num) {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
