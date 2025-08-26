
// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- SELECTORS for various HTML elements ---
    const voucherSection = document.getElementById('voucher-section');
    const recordsSection = document.getElementById('records-section');
    const dashboardSection = document.getElementById('dashboard-section');

    const navVoucherBtn = document.getElementById('nav-voucher');
    const navRecordsBtn = document.getElementById('nav-records');
    const navDashboardBtn = document.getElementById('nav-dashboard');

    const voucherForm = document.getElementById('voucher-form');
    const voucherNoInput = document.getElementById('voucherNo');
    const dateInput = document.getElementById('date');
    const paidToInput = document.getElementById('paidTo');
    const purposeInput = document.getElementById('purpose');
    const amountInput = document.getElementById('amount');
    const amountInWordsP = document.getElementById('amountInWords');
    const recordsListDiv = document.getElementById('records-list');
    
    // Dashboard card selectors
    const totalVouchersEl = document.getElementById('totalVouchers');
    const totalAmountEl = document.getElementById('totalAmount');
    const avgAmountEl = document.getElementById('avgAmount');

    // --- DATA HANDLING (using localStorage) ---
    // Function to get vouchers from localStorage
    const getVouchers = () => {
        const vouchers = localStorage.getItem('vouchers');
        return vouchers ? JSON.parse(vouchers) : [];
    };

    // Function to save vouchers to localStorage
    const saveVouchers = (vouchers) => {
        localStorage.setItem('vouchers', JSON.stringify(vouchers));
    };

    // --- CORE APPLICATION LOGIC ---

    // Function to generate the next voucher number
    const generateVoucherNumber = () => {
        const vouchers = getVouchers();
        return vouchers.length > 0 ? Math.max(...vouchers.map(v => v.id)) + 1 : 1;
    };

    // Function to display all saved vouchers
    const renderRecords = () => {
        const vouchers = getVouchers().sort((a, b) => b.id - a.id); // Show newest first
        recordsListDiv.innerHTML = ''; // Clear previous list
        if (vouchers.length === 0) {
            recordsListDiv.innerHTML = '<p>No records found. Please create a new voucher.</p>';
            return;
        }

        vouchers.forEach(v => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.innerHTML = `
                <h3>Voucher #${v.voucherNo} <span>Date: ${v.date}</span></h3>
                <p><strong>Paid To:</strong> ${v.paidTo}</p>
                <p><strong>Purpose:</strong> ${v.purpose}</p>
                <p class="amount">Rs. ${parseFloat(v.amount).toFixed(2)}</p>
            `;
            recordsListDiv.appendChild(recordItem);
        });
    };
    
    // Function to update the dashboard
    const renderDashboard = () => {
        const vouchers = getVouchers();
        const totalCount = vouchers.length;
        const totalSum = vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);
        const avgAmount = totalCount > 0 ? totalSum / totalCount : 0;

        totalVouchersEl.textContent = totalCount;
        totalAmountEl.textContent = `Rs. ${totalSum.toFixed(2)}`;
        avgAmountEl.textContent = `Rs. ${avgAmount.toFixed(2)}`;
    };

    // --- NAVIGATION LOGIC ---
    const showSection = (sectionToShow) => {
        [voucherSection, recordsSection, dashboardSection].forEach(section => {
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
        
        // Update active button state
        [navVoucherBtn, navRecordsBtn, navDashboardBtn].forEach(btn => btn.classList.remove('active'));
        if (sectionToShow === voucherSection) navVoucherBtn.classList.add('active');
        if (sectionToShow === recordsSection) navRecordsBtn.classList.add('active');
        if (sectionToShow === dashboardSection) navDashboardBtn.classList.add('active');
    };

    navVoucherBtn.addEventListener('click', () => showSection(voucherSection));
    navRecordsBtn.addEventListener('click', () => {
        renderRecords(); // Refresh records before showing
        showSection(recordsSection);
    });
    navDashboardBtn.addEventListener('click', () => {
        renderDashboard(); // Refresh dashboard before showing
        showSection(dashboardSection);
    });

    // --- FORM SUBMISSION LOGIC ---
    voucherForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page from reloading

        const newVoucher = {
            id: generateVoucherNumber(),
            voucherNo: voucherNoInput.value,
            date: dateInput.value,
            paidTo: paidToInput.value,
            purpose: purposeInput.value,
            amount: amountInput.value,
        };

        const vouchers = getVouchers();
        vouchers.push(newVoucher);
        saveVouchers(vouchers);

        alert('Voucher saved successfully!');
        voucherForm.reset();
        initializeApp(); // Reset the form fields
    });

    // --- EVENT LISTENER for amount input ---
    amountInput.addEventListener('input', () => {
        const amount = amountInput.value;
        amountInWordsP.textContent = amount ? numberToWords(amount) + ' Only' : '...';
    });

    // --- INITIALIZATION ---
    const initializeApp = () => {
        voucherNoInput.value = generateVoucherNumber();
        dateInput.valueAsDate = new Date(); // Set today's date
        amountInWordsP.textContent = '...';
        showSection(voucherSection);
        navVoucherBtn.classList.add('active');
    };
    
    initializeApp();
});

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
