// Wait for the DOM and Firebase SDKs to be loaded
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
