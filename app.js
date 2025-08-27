document.addEventListener('DOMContentLoaded', () => {

    // --- STEP 1: PASTE YOUR FIREBASE CONFIG HERE ---
    const firebaseConfig = {
    apiKey: "AIzaSyBdq5ZiiIr3EVPMfeRNb55UITX5hoYOH2Y",
    authDomain: "modern-voucher-pro.firebaseapp.com",
    projectId: "modern-voucher-pro",
    storageBucket: "modern-voucher-pro.firebasestorage.app",
    messagingSenderId: "427545654170",
    appId: "1:427545654170:web:70d4efb1c4d068a67a8023",
    measurementId: "G-P44RSLYVW5"
  };

    // --- STEP 2: INITIALIZE FIREBASE AND FIRESTORE ---
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const vouchersCollection = db.collection('vouchers');


    // --- DOM ELEMENT SELECTORS (No changes here) ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');
    const voucherForm = document.getElementById('voucher-form');
    const voucherIdInput = document.getElementById('voucherId');
    const voucherNoInput = document.getElementById('voucherNo');
    const dateInput = document.getElementById('date');
    const paidToInput = document.getElementById('paidTo');
    const purposeInput = document.getElementById('purpose');
    const amountInput = document.getElementById('amount');
    const amountInWordsDiv = document.getElementById('amount-in-words');
    const saveBtn = document.getElementById('save-btn');
    const updateBtn = document.getElementById('update-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const recordsTbody = document.getElementById('records-tbody');
    const searchInput = document.getElementById('search-records');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');

    // Global variable to hold local copy of vouchers
    let localVouchers = [];

    // --- NAVIGATION LOGIC (No changes here) ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            contentSections.forEach(section => {
                section.classList.toggle('active', section.id === targetId);
            });
        });
    });

    // --- VOUCHER FORM LOGIC ---
    async function resetForm() {
        voucherForm.reset();
        voucherIdInput.value = '';
        dateInput.valueAsDate = new Date();
        voucherNoInput.value = await getNextVoucherNumber();
        amountInWordsDiv.textContent = '';
        saveBtn.classList.remove('hidden');
        updateBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        document.querySelector('.nav-btn[data-target="voucher-section"]').click();
    }
    
    async function getNextVoucherNumber() {
        // Query Firestore for the voucher with the highest ID
        const query = vouchersCollection.orderBy('id', 'desc').limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) {
            return 1; // If no vouchers exist, start at 1
        }
        const lastVoucher = snapshot.docs[0].data();
        return lastVoucher.id + 1;
    }

    voucherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nextId = await getNextVoucherNumber();
        const newVoucher = {
            id: nextId, // We manage our own auto-incrementing ID
            voucherNo: nextId.toString(),
            date: dateInput.value,
            paidTo: paidToInput.value,
            purpose: purposeInput.value,
            amount: parseFloat(amountInput.value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            // Add the new voucher to Firestore
            await vouchersCollection.add(newVoucher);
            alert('Voucher saved successfully to the cloud!');
            resetForm();
            // The listener will automatically update the table
        } catch (error) {
            console.error("Error saving voucher: ", error);
            alert("Could not save voucher. Check console for details.");
        }
    });

    updateBtn.addEventListener('click', async () => {
        const docIdToUpdate = voucherIdInput.value;
        if (!docIdToUpdate) return;
        
        const updatedData = {
            // We don't update the ID or voucherNo
            date: dateInput.value,
            paidTo: paidToInput.value,
            purpose: purposeInput.value,
            amount: parseFloat(amountInput.value)
        };

        try {
            await vouchersCollection.doc(docIdToUpdate).update(updatedData);
            alert('Voucher updated successfully in the cloud!');
            resetForm();
        } catch (error) {
            console.error("Error updating voucher: ", error);
            alert("Could not update voucher.");
        }
    });

    cancelBtn.addEventListener('click', resetForm);

    // --- REAL-TIME RECORDS TABLE LOGIC ---
    function renderRecords(filter = '') {
        recordsTbody.innerHTML = '';
        
        const filteredVouchers = localVouchers.filter(v => 
            v.paidTo.toLowerCase().includes(filter.toLowerCase()) || 
            v.purpose.toLowerCase().includes(filter.toLowerCase())
        ).sort((a, b) => b.id - a.id);

        if (filteredVouchers.length === 0) {
            recordsTbody.innerHTML = '<tr><td colspan="5">No records found.</td></tr>';
            return;
        }

        filteredVouchers.forEach(voucher => {
            const row = document.createElement('tr');
            // We store the Firestore document ID on the row for easy access
            row.setAttribute('data-id', voucher.docId); 
            row.innerHTML = `
                <td>${voucher.voucherNo}</td>
                <td>${voucher.date}</td>
                <td>${voucher.paidTo}</td>
                <td class="amount">${voucher.amount.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn-print"><i class="fas fa-print"></i></button>
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            recordsTbody.appendChild(row);
        });
    }

    searchInput.addEventListener('input', (e) => renderRecords(e.target.value));

    recordsTbody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const row = e.target.closest('tr');
        const docId = row.dataset.id;
        
        if (button.classList.contains('btn-delete')) {
            if (confirm('Are you sure you want to delete this voucher? This action is permanent.')) {
                vouchersCollection.doc(docId).delete()
                    .then(() => {
                        alert('Voucher deleted.');
                    })
                    .catch(error => {
                        console.error("Error deleting document: ", error);
                    });
            }
        }
        
        if (button.classList.contains('btn-edit')) {
            const voucherToEdit = localVouchers.find(v => v.docId === docId);
            
            voucherIdInput.value = voucherToEdit.docId; // Store Firestore document ID
            voucherNoInput.value = voucherToEdit.voucherNo;
            dateInput.value = voucherToEdit.date;
            paidToInput.value = voucherToEdit.paidTo;
            purposeInput.value = voucherToEdit.purpose;
            amountInput.value = voucherToEdit.amount;
            amountInput.dispatchEvent(new Event('input')); // Update words

            saveBtn.classList.add('hidden');
            updateBtn.classList.remove('hidden');
            cancelBtn.classList.remove('hidden');

            document.querySelector('.nav-btn[data-target="voucher-section"]').click();
        }

        if (button.classList.contains('btn-print')) {
            const voucherToPrint = localVouchers.find(v => v.docId === docId);
            printVoucher(voucherToPrint);

        }
    });

    function printVoucher(voucher) {
        // Print logic remains the same
        const printContent = `
            <style> body { font-family: sans-serif; } h1 { color: #4A90E2; } table { width: 100%; border-collapse: collapse; } td { padding: 8px; border: 1px solid #ddd; } </style>
            <h1>Cash Voucher</h1><hr>
            <table>
                <tr><td><strong>Voucher No:</strong></td><td>${voucher.voucherNo}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${voucher.date}</td></tr>
                <tr><td><strong>Paid To:</strong></td><td>${voucher.paidTo}</td></tr>
                <tr><td><strong>Purpose:</strong></td><td>${voucher.purpose}</td></tr>
                <tr><td><strong>Amount:</strong></td><td><strong>Rs. ${voucher.amount.toFixed(2)}</strong></td></tr>
            </table>
            <br><br><p>_________________________<br>Receiver's Signature</p>`;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
    
    // --- Amount to Words Logic (No changes here) ---
    amountInput.addEventListener('input', () => { /* ... same as before ... */ });
    function numberToWords(num) { /* ... same as before ... */ }
    

    // --- REPORTS LOGIC (Now using localVouchers) ---
    function getReportData() { /* ... same as before, but uses localVouchers instead of getVouchers() ... */ }
    downloadPdfBtn.addEventListener('click', () => { /* ... same as before ... */ });
    downloadExcelBtn.addEventListener('click', () => { /* ... same as before ... */ });


    // --- INITIAL APP LOAD & REAL-TIME LISTENER ---
    function listenForVouchers() {
        vouchersCollection.orderBy('createdAt').onSnapshot(snapshot => {
            localVouchers = []; // Clear local cache
            snapshot.forEach(doc => {
                localVouchers.push({
                    docId: doc.id, // Store the unique Firestore document ID
                    ...doc.data()
                });
            });
            // Re-render the table with the fresh data from the cloud
            renderRecords(searchInput.value); 
        }, error => {
            console.error("Error listening for voucher updates: ", error);
        });
    }

    // Start the application
    resetForm();
    listenForVouchers(); // This starts the real-time listener!
});