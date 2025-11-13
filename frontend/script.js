// ===============================================
// CORE BACKEND & SECURITY SETUP (script.js top)
// ===============================================

const BASE_URL = 'http://127.0.0.1:8000/api/';
let ACCESS_TOKEN = localStorage.getItem('access_token');

// Global Headers for Authenticated API Calls
const AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
};

// Logout Function
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Utility function to format currency
const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
};

// ===============================================
// UI/SECURITY CHECKS (Initial Load)
// ===============================================

// Security Check: Agar token nahi hai to login page par bhej do
if (!ACCESS_TOKEN) {
    window.location.href = 'login.html';
}

// ===============================================
// BILLING VARIABLES (Mapped from HTML)
// ===============================================

const productCodeInput = document.getElementById('billing-input');
const cartBody = document.getElementById('cart-body');
// Payment Summary values (Corrected selectors)
const subtotalSpan = document.querySelector('#billing-page .bg-white.p-6.rounded-lg.shadow-md.h-fit .space-y-3 div:nth-child(1) span:nth-child(2)');
const gstSpan = document.querySelector('#billing-page .bg-white.p-6.rounded-lg.shadow-md.h-fit .space-y-3 div:nth-child(3) span:nth-child(2)');
const totalSpan = document.querySelector('#billing-page .bg-white.p-6.rounded-lg.shadow-md.h-fit .space-y-3 .text-xl span:nth-child(2)'); // Correct selector for total
const proceedButton = document.getElementById('proceedToPaymentBtn');

// Payment Modal Variables
const paymentModal = document.getElementById('paymentModal');
const modalGrandTotal = document.getElementById('modal-grand-total');
const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');


let cartItems = [];
const GST_RATE = 0.05;

// ===============================================
// EXISTING UI/MODAL LOGIC 
// ===============================================

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Function to show/hide pages (Keep this as is - it handles UI switching)
function showPage(pageId, navElement) {
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(pageId + '-page').classList.add('active');

    const pageTitle = navElement.querySelector('span').textContent;
    document.getElementById('page-title').textContent = pageTitle;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-indigo-600');
    });
    navElement.classList.add('bg-indigo-600');

    if (window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }
}

// Toggle mobile sidebar (keep your existing toggle logic)
if (menuToggle) menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
});

if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
});


// ----------------------------------------------------
// MODAL LOGIC (Simplified and Corrected)
// ----------------------------------------------------

// Payment Modal Logic
if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', closePaymentModal);
}

function openPaymentModal() {
    if (cartItems.length === 0) {
        alert("Please add items to the cart first!");
        return;
    }

    modalGrandTotal.textContent = totalSpan.textContent;

    const modalContent = paymentModal.querySelector('div');
    paymentModal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closePaymentModal() {
    const modalContent = paymentModal.querySelector('div');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        paymentModal.classList.add('hidden');
    }, 300);
}



// frontend/script.js (Existing Modal/Button logic ke neeche add karein)

// Product Modal ke elements ko pakadna (Assuming these IDs exist in index.html)
const addProductModal = document.getElementById('addProductModal');
const addProductForm = addProductModal ? addProductModal.querySelector('form') : null; 
const addProductBtn = document.getElementById('addProductBtn'); // Assuming the main button ID is correct


// Open/Close Modal Functions (Add these if they are missing or update existing ones)
function openModal(modal) {
    if (!modal) return;
    const modalContent = modal.querySelector('div');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeModal(modal) {
    if (!modal) return;
    const modalContent = modal.querySelector('div');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Add New Product Button ko Modal se jodo
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => openModal(addProductModal));
}
if (document.getElementById('closeModalBtn')) {
    document.getElementById('closeModalBtn').addEventListener('click', () => closeModal(addProductModal));
}


// --- Form Submit Logic (Yahi se product backend mein jayega) ---
if (addProductForm) {
    addProductForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Data extraction from form fields
        const productName = document.getElementById('productName').value;
        const productCode = document.getElementById('productID').value;
        const productCategory = document.getElementById('productCategory').value;
        const sellingPrice = parseFloat(document.getElementById('productPrice').value);
        const stockQty = parseInt(document.getElementById('productStock').value);
        
        // Cost price is required by backend model
        const costPrice = 0.01; 

        const productData = {
            name: productName,
            code: productCode,
            category: productCategory,
            selling_price: sellingPrice,
            current_stock: stockQty,
            cost_price: costPrice 
        };

        try {
            const response = await fetch(BASE_URL + 'products/add/', {
                method: 'POST',
                headers: AUTH_HEADERS, // Secured API call
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                alert(`Product "${productName}" added successfully!`);
                closeModal(addProductModal); // Modal band karna
                loadProductTableData(); // Table ko update karna
                loadProductList(); // Billing POS list ko bhi update karna

            } else {
                const errorData = await response.json();
                alert(`Failed to add product: ${errorData.code || errorData.detail || JSON.stringify(errorData)}`);
            }

        } catch (error) {
            console.error("Product Add Error:", error);
            alert("Network error: Could not connect to add product.");
        }
    });
}


// --- Activation: Products Nav Link Click Event ---
// script.js (Navigation Logic ke aas-paas)

const productsNavLink = document.querySelector('.nav-link[onclick*="showPage(\'products\']');
if(productsNavLink) {
    productsNavLink.addEventListener('click', () => {
        // ... (Existing showPage logic) ...
        loadProductTableData(); // <-- YEH LINE YAHAN RUN HONI CHAHIYE
    });
}



// ===============================================
// BILLING LOGIC (Functional Logic)
// ===============================================

// --- 1. Product Add/Scan Logic ---
if (productCodeInput) {
    productCodeInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const code = productCodeInput.value.trim();
            if (code) {
                fetchProductByCode(code);
                productCodeInput.value = '';
            }
        }
    });
}

async function fetchProductByCode(code) {
    try {
        const response = await fetch(BASE_URL + `products/${code}/`);

        if (!response.ok) {
            alert(`Error: Product with code ${code} not found!`);
            return;
        }

        const product = await response.json();
        addItemToCart(product);

    } catch (error) {
        console.error("Fetch Error:", error);
        alert('Could not connect to the inventory server.');
    }
}

function addItemToCart(product) {
    const existingItem = cartItems.find(item => item.code === product.code);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            ...product,
            quantity: 1,
            selling_price: parseFloat(product.selling_price)
        });
    }
    renderCart();
    calculateTotals();
}

// --- 2. Cart Rendering ---
function renderCart() {
    cartBody.innerHTML = '';

    cartItems.forEach((item, index) => {
        const itemTotal = (item.selling_price * item.quantity).toFixed(2);

        const row = document.createElement('tr');
        row.classList.add('border-b', 'hover:bg-gray-50');

        row.innerHTML = `
            <td class="py-3 px-4 text-sm text-gray-800">${item.name} (${item.code})</td>
            <td class="py-3 px-4 text-sm text-gray-800">₹${item.selling_price.toFixed(2)}</td>
            <td class="py-3 px-4 text-sm text-gray-800 text-center">
                <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="w-16 text-center border rounded-md py-1" onchange="updateQuantity(this)">
            </td>
            <td class="py-3 px-4 text-sm text-gray-800 text-right">₹${itemTotal}</td>
            <td class="py-3 px-4 text-center">
                <button class="text-red-500 hover:text-red-700" onclick="removeItem(${index})">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </td>
        `;
        cartBody.appendChild(row);
    });
}

// --- 3. Calculation Logic ---
function calculateTotals() {
    let subTotal = 0;
    cartItems.forEach(item => {
        subTotal += item.selling_price * item.quantity;
    });

    const gstAmount = subTotal * GST_RATE;
    const grandTotal = subTotal + gstAmount;

    // Billing Summary Update
    if (subtotalSpan) subtotalSpan.textContent = `₹${subTotal.toFixed(2)}`;
    if (gstSpan) gstSpan.textContent = `₹${gstAmount.toFixed(2)}`;
    if (totalSpan) totalSpan.textContent = `₹${grandTotal.toFixed(2)}`;
}

// --- 4. Helper Functions (Update Qty / Remove Item) ---
window.updateQuantity = function (inputElement) {
    const index = inputElement.getAttribute('data-index');
    const newQuantity = parseInt(inputElement.value);

    if (newQuantity > 0) {
        cartItems[index].quantity = newQuantity;
    } else {
        removeItem(index);
    }
    renderCart();
    calculateTotals();
};

window.removeItem = function (index) {
    cartItems.splice(index, 1);
    renderCart();
    calculateTotals();
};

// --- Proceed Button opens Modal ---
if (proceedButton) {
    proceedButton.addEventListener('click', openPaymentModal);
}


// --- 5. Payment Processing Logic (Final API Call) ---

paymentMethodBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const paymentMethod = e.currentTarget.getAttribute('data-method');
        processPayment(paymentMethod); // Calls the API
    });
});


// frontend/script.js, processPayment function

// frontend/script.js, processPayment function ke andar

async function processPayment(method) {
    if (cartItems.length === 0) {
        alert("Please add items to the cart first!");
        return;
    }

    // --- IMPORTANT: Remove window.open() here ---
    // Koi bhi naya window/tab nahi kholna hai
    
    closePaymentModal(); // Modal band karna

    const grandTotalValue = parseFloat(totalSpan.textContent.replace('₹', ''));
    const subTotalValue = parseFloat(subtotalSpan.textContent.replace('₹', ''));
    const gstAmountValue = parseFloat(gstSpan.textContent.replace('₹', ''));

    const purchaseData = {
        sub_total: subTotalValue,
        gst_amount: gstAmountValue,
        grand_total: grandTotalValue,
        items: cartItems.map(item => ({
            product_code: item.code,
            quantity_sold: item.quantity,
            unit_price_at_sale: item.selling_price
        }))
    };
    
    try {
        const response = await fetch(BASE_URL + 'purchase/', {
            method: 'POST', 
            headers: AUTH_HEADERS, 
            body: JSON.stringify(purchaseData) 
        });

        const data = await response.json();

        if (response.ok) {
            
            // --- 1. PDF DIRECT DOWNLOAD ---
            const pdfUrl = BASE_URL + `bill/${data.id}/`;
            
            // Invisible link banana
const link = document.createElement('a');
link.href = pdfUrl;
link.setAttribute('download', `Invoice_${data.id}.pdf`); // Download force karna
            
            document.body.appendChild(link);
link.click(); // Download shuru ho jayega
document.body.removeChild(link);
            // -----------------------------
            
            // Cart clear karna
            cartItems = [];
            renderCart();
            calculateTotals();
            
            alert(`✅ Transaction Complete via ${method}! Invoice ID: ${data.id}. Bill downloading...`);

            // 2. UI/Page Persistence Fix (POS Screen ko active rakhega)
            const billingLink = document.querySelector('.nav-link[onclick*="showPage(\'billing\'"]');
            if(billingLink) {
                showPage('billing', billingLink); 
            }
            loadDashboardData();

        } else {
             // 3. Sale Fail hone par koi window close nahi karni
             alert(`Sale Failed: ${data.detail || JSON.stringify(data)}`);
             if (response.status === 401) logout();
        }

    } catch (error) {
        console.error("Network Error:", error);
        alert('Could not connect to the server for finalizing sale.');
    }
}



// ===============================================
// DASHBOARD & ANALYTICS LOGIC (Keep this as is)
// ===============================================

async function loadDashboardData() {
    
    // --- Dashboard Card Targets ---
    const totalRevenueDisplay = document.querySelector('#dashboard-page .bg-indigo-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const stockValueDisplay = document.querySelector('#dashboard-page .bg-green-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const lowStockItemsDisplay = document.querySelector('#dashboard-page .bg-red-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const totalSuppliersDisplay = document.querySelector('#dashboard-page .bg-blue-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    
    // --- Chart/Report Targets ---
    const salesOverviewContainer = document.querySelector('#dashboard-page .lg\\:col-span-2.bg-white.p-6.rounded-lg.shadow-md .h-64');
    const topProductsContainer = document.querySelector('#dashboard-page .bg-white.p-6.rounded-lg.shadow-md:nth-child(2) .h-64');
    const recentSalesBody = document.querySelector('#dashboard-page .bg-white.p-6.rounded-lg.shadow-md table tbody');
    const alertBadge = document.querySelector('.nav-link span.ml-auto');


    try {
        const analyticsResponse = await fetch(BASE_URL + 'analytics/', { headers: AUTH_HEADERS });
        const salesResponse = await fetch(BASE_URL + 'sales/recent/', { headers: AUTH_HEADERS }); 
        
        if (analyticsResponse.status === 401 || salesResponse.status === 401) {
            logout();
            return;
        }

        const analyticsData = await analyticsResponse.json();
        const salesData = await salesResponse.json();
        
        const revenue = analyticsData.revenue;
        const stock = analyticsData.stock;
        const topProducts = analyticsData.top_selling; // Top selling data

        
        // 1. CARDS UPDATE
        if (totalRevenueDisplay) totalRevenueDisplay.textContent = formatCurrency(revenue.total_revenue);
        // Stock Value is not calculated in backend, keep static or N/A
        if (stockValueDisplay) stockValueDisplay.textContent = '₹N/A';
        if (lowStockItemsDisplay) lowStockItemsDisplay.textContent = stock.low_stock_alerts.length;
        if (totalSuppliersDisplay) totalSuppliersDisplay.textContent = 'N/A';

        // Low Stock Alert Badge Update Karna
        alertBadge.textContent = stock.low_stock_alerts.length;
        
        // 2. SALES OVERVIEW (Left Panel - Consolidated Metrics)
        if (salesOverviewContainer) {
            salesOverviewContainer.innerHTML = `
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-gray-800">Key Metrics Overview</h3>
                    <p class="text-gray-700">Total Revenue (Excl. GST): <b>${formatCurrency(revenue.total_revenue)}</b></p>
                    <p class="text-gray-700">Total Profit: <b class="text-green-600">${formatCurrency(revenue.total_profit)}</b></p>
                    <p class="text-gray-700">GST Collected: ${formatCurrency(revenue.total_gst_collected)}</p>
                    <p class="mt-4 text-sm text-gray-600">[Data shown is cumulative. Requires charting library for graphs.]</p>
                </div>
            `;
            salesOverviewContainer.classList.remove('justify-center', 'items-center', 'flex');
            salesOverviewContainer.style.height = 'auto'; 
        }
        
        // 3. TOP SELLING PRODUCTS (Right Panel - Data List)
        if (topProductsContainer && topProducts && topProducts.length > 0) {
            let html = '<div class="space-y-4 pt-2">';
            
            topProducts.forEach((product, index) => {
                html += `
                    <div class="space-y-1 p-2 bg-gray-50 rounded-md">
                        <p class="text-sm font-bold text-indigo-600">#${index + 1}: ${product.product__name}</p>
                        <p class="text-xs text-gray-600 flex justify-between">
                            <span>Sold: ${product.total_quantity_sold} units</span> 
                            <span>Revenue: ${formatCurrency(product.total_revenue)}</span>
                        </p>
                    </div>
                `;
            });
            html += '</div>';
            topProductsContainer.innerHTML = html;
            topProductsContainer.classList.remove('justify-center', 'items-center', 'flex');
            topProductsContainer.style.height = 'auto'; 
        } else if (topProductsContainer) {
            topProductsContainer.innerHTML = '<p class="text-gray-500 p-4">No top selling data available yet.</p>';
            topProductsContainer.classList.add('justify-center', 'items-center', 'flex');
            topProductsContainer.style.height = 'auto';
        }
        
        // 4. RECENT SALES TABLE (Data Inject)
        if (recentSalesBody) {
            recentSalesBody.innerHTML = ''; 

            salesData.forEach(sale => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'hover:bg-gray-50');
                
                row.innerHTML = `
                    <td class="py-3 px-4 text-sm text-gray-800">#INV-${sale.id}</td>
                    <td class="py-3 px-4 text-sm text-gray-800">${sale.customer}</td>
                    <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(sale.total)}</td>
                    <td class="py-3 px-4 text-sm">
                        <span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Completed</span>
                    </td>
                `;
                recentSalesBody.appendChild(row);
            });
        }

    } catch (error) {
        console.error("Dashboard Data Load Error:", error);
    }
}


// Sidebar Navigation se data load karna (jab link click ho)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const onclickAttr = link.getAttribute('onclick');
        const match = onclickAttr.match(/'([^']+)'/);
        const pageId = match ? match[1] : null;

        if (pageId) {
            showPage(pageId, link); 
        }

        if (pageId === 'dashboard' || pageId === 'reports') {
            loadDashboardData(); 
        }
        if (pageId === 'billing') { 
            loadProductList(); 
        }
        /* --- ADDED FOR STOCK PAGE --- */
        if (pageId === 'stock') { 
            loadStockData(); 
        }
    });
});

// Window Load par Dashboard ko force load karna (kyunki woh active hai)
window.addEventListener('load', () => {
    loadDashboardData();
});

// frontend/script.js

// ... (Baaki saara code, variables, aur functions jaisa hai, waisa hi rehne dein) ...

// PRODUCT LIST LOGIC (Visual Cards) - NEW LOGIC
// --- 1. Products Fetching Function (Simplified for Debug) ---
async function loadProductList() {
    // Correctly targeting the ID added in the HTML
    const productListContainer = document.getElementById('product-list-container');
    if (!productListContainer) return;
    
    productListContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Loading products...</p>';
    
    try {
        // Fetching data
        const response = await fetch(BASE_URL + 'products/');
        
        if (!response.ok) {
            productListContainer.innerHTML = '<p class="text-red-500 text-center py-4">Error loading products (Backend issue).</p>';
            return;
        }

        const products = await response.json();
        
        // Final check: Agar data mil gaya to render karo
        if (products && products.length > 0) {
             renderProductCards(products);
        } else {
             productListContainer.innerHTML = '<p class="text-center text-gray-500 py-4">No products added yet.</p>';
        }

    } catch (error) {
        console.error("Product List Fetch Error:", error);
        // Error aane par bhi screen ko blank nahi chhodna
        productListContainer.innerHTML = '<p class="text-red-500 text-center py-4">Cannot connect to inventory server.</p>';
    }
}


// --- 2. Product Cards Rendering ---
function renderProductCards(products) {
    const productListContainer = document.getElementById('product-list-container');
    if (!productListContainer) return;

    productListContainer.innerHTML = ''; // Container clear karein
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('border', 'rounded-lg', 'p-3', 'text-center', 'cursor-pointer', 'hover:shadow-lg', 'hover:border-indigo-500', 'transition-all', 'duration-200');
        
        // Card par click hone par item cart mein add ho jaega
        productCard.onclick = () => {
            fetchProductByCode(product.code); // Reuse existing fetch logic
        };

        const lowStockText = product.current_stock <= 10 && product.current_stock > 0 ? `<p class="text-xs text-yellow-600 font-medium">Low Stock: ${product.current_stock}</p>` : '';
        const outOfStockText = product.current_stock == 0 ? `<p class="text-xs text-red-600 font-medium">Out of Stock</p>` : '';

        productCard.innerHTML = `
            <img src="https://placehold.co/100x100/6366f1/ffffff?text=${product.name.slice(0,1).toUpperCase()}" alt="${product.name}" class="w-full h-20 object-cover rounded-md mb-2 bg-gray-100 mx-auto">
            
            <p class="text-sm font-medium text-gray-800 truncate">${product.name}</p>
            <p class="text-xs text-gray-500">${formatCurrency(product.selling_price)}</p>
            ${lowStockText}
            ${outOfStockText}
        `;
        
        productListContainer.appendChild(productCard);
    });
}


// --- 3. Function Calls (Activation) ---
// Billing Page par aate hi product list load ho

const billingLink = document.querySelector('.nav-link[onclick*="showPage(\'billing\'"]');
if(billingLink) {
    billingLink.addEventListener('click', () => {
        loadProductList(); 
    });
}

// Window Load par Dashboard ko force load karna (kyunki woh active hai)
window.addEventListener('load', () => {
    // NOTE: Initial load par bhi products load ho jayein
    loadProductList();
    loadDashboardData();
    renderCart(); 
    calculateTotals(); 
});

// frontend/script.js (Add this function to handle the Products table data)

// frontend/script.js (loadProductTableData function)

// frontend/script.js (loadProductTableData function)

// frontend/script.js (loadProductTableData function)

async function loadProductTableData() {
    const tableBody = document.querySelector('#products-page table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-gray-500">Loading product list...</td></tr>';

    try {
        // FIX: AUTH_HEADERS ko yahan use karein
        const response = await fetch(BASE_URL + 'products/', { headers: AUTH_HEADERS }); // <--- FIX APPLIED
        
        if (response.status === 401) {
            tableBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-red-500">Session expired. Please log in again.</td></tr>';
            logout(); // Session expired hone par logout karein
            return;
        }

        if (!response.ok) {
            tableBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-red-500">Error loading products (Backend issue).</td></tr>';
            return;
        }


        const products = await response.json();
        tableBody.innerHTML = ''; // Clear loading text

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-gray-500">No products found. Use "Add New Product" button.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.classList.add('border-b', 'hover:bg-gray-50');
            
            const statusColor = product.current_stock <= 5 ? 'text-red-500 font-bold' : 'text-green-600';

            row.innerHTML = `
                <td class="py-3 px-4 text-sm text-gray-800">${product.code}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${product.name}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${product.category || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(product.selling_price)}</td>
                <td class="py-3 px-4 text-sm ${statusColor}">${product.current_stock}</td>
                <td class="py-3 px-4 text-sm space-x-2">
                    <button class="text-blue-500 hover:text-blue-700"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="text-red-500 hover:text-red-700"><ion-icon name="trash-outline"></ion-icon></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-red-500">Failed to load data. Check server connection.</td></tr>';
        console.error("Product Table Load Error:", error);
    }
}

/* frontend/script.js (Add this function) */

async function loadStockData() {
    // Inventory table body ko target karna
    const tableBody = document.getElementById('current-inventory-body');
    // Cards ke targets
    const totalStockValueDisplay = document.querySelector('#stock-page .bg-green-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const totalProductsDisplay = document.querySelector('#stock-page .bg-blue-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const lowStockDisplay = document.querySelector('#stock-page .bg-red-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const outOfStockDisplay = document.querySelector('#stock-page .bg-yellow-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="9" class="py-3 text-center text-gray-500">Loading inventory data...</td></tr>';
    
    try {
        // Authenticated call for Products List (requires login token)
        const response = await fetch(BASE_URL + 'products/', { headers: AUTH_HEADERS });
        
        if (response.status === 401) {
            tableBody.innerHTML = '<tr><td colspan="9" class="py-3 text-center text-red-500">Session expired. Please log in again.</td></tr>';
            logout();
            return;
        }

        const products = await response.json();
        tableBody.innerHTML = '';
        
        let totalStockValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const LOW_STOCK_THRESHOLD = 10; 

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="py-3 text-center text-gray-500">No products found.</td></tr>';
        }

        products.forEach(product => {
            // FIX: Ensure cost_price is treated as a number, defaulting to 0 if null/undefined/non-numeric
            const cost = parseFloat(product.cost_price) || 0; 
            const sellingPrice = parseFloat(product.selling_price) || 0; 

            const stockQty = parseInt(product.current_stock);
            
            // Stock Value calculation (using cost price)
            const stockValue = cost * stockQty;
            totalStockValue += stockValue;

            // Status Checks (Existing Logic)
            let statusText = 'In Stock';
            let statusColor = 'bg-green-100 text-green-700';

            if (stockQty === 0) {
                statusText = 'Out of Stock';
                statusColor = 'bg-yellow-100 text-yellow-700';
                outOfStockCount++;
            } else if (stockQty <= LOW_STOCK_THRESHOLD) {
                statusText = 'Low Stock';
                statusColor = 'bg-red-100 text-red-700';
                lowStockCount++;
            }

            const row = document.createElement('tr');
            row.classList.add('border-b', 'hover:bg-gray-50');

            row.innerHTML = `
                <td class="py-3 px-4 text-sm text-gray-800">${product.code}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${product.name}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${product.category || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(cost)}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(sellingPrice)}</td>
                <td class="py-3 px-4 text-sm text-center font-bold ${statusColor}">${stockQty}</td>
                <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(stockValue)}</td>
                <td class="py-3 px-4 text-sm">
                    <span class="${statusColor} px-2 py-1 rounded-full text-xs font-medium">${statusText}</span>
                </td>
                <td class="py-3 px-4 text-sm space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="openEditModal('${product.code}')"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="text-red-500 hover:text-red-700"><ion-icon name="trash-outline"></ion-icon></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update Cards (Final Summary)
        if (totalStockValueDisplay) totalStockValueDisplay.textContent = formatCurrency(totalStockValue);
        if (totalProductsDisplay) totalProductsDisplay.textContent = products.length;
        if (lowStockDisplay) lowStockDisplay.textContent = lowStockCount;
        if (outOfStockDisplay) outOfStockDisplay.textContent = outOfStockCount;


    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="9" class="py-3 text-center text-red-500">Failed to load data. Check network/server.</td></tr>';
        console.error("Stock Data Load Error:", error);
    }
}

// frontend/script.js (Add this new function)

async function loadReportsData() {
    // --- Target Reports Page Elements ---
    const totalRevenueReport = document.querySelector('#reports-page .bg-green-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const totalProfitReport = document.querySelector('#reports-page .bg-indigo-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const totalOrdersReport = document.querySelector('#reports-page .bg-blue-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const avgOrderValueReport = document.querySelector('#reports-page .bg-yellow-100').closest('.flex').querySelector('.ml-4 p.text-2xl');
    const detailedReportsBody = document.getElementById('detailed-reports-body');
    
    // --- Data Fetching ---
    try {
        const analyticsResponse = await fetch(BASE_URL + 'analytics/', { headers: AUTH_HEADERS });
        const salesResponse = await fetch(BASE_URL + 'sales/recent/', { headers: AUTH_HEADERS }); 

        if (!analyticsResponse.ok || !salesResponse.ok) {
            throw new Error("Failed to fetch data with current token.");
        }

        const analyticsData = await analyticsResponse.json();
        const salesData = await salesResponse.json();
        
        const revenue = analyticsData.revenue;
        const totalOrders = salesData.length;
        const avgOrderValue = totalOrders > 0 ? (revenue.total_revenue / totalOrders) : 0; 
        
        // --- 1. CARDS UPDATE ---
        if (totalRevenueReport) totalRevenueReport.textContent = formatCurrency(revenue.total_revenue);
        if (totalProfitReport) totalProfitReport.textContent = formatCurrency(revenue.total_profit); 
        if (totalOrdersReport) totalOrdersReport.textContent = totalOrders;
        if (avgOrderValueReport) avgOrderValueReport.textContent = formatCurrency(avgOrderValue);

        // --- 2. DETAILED SALES REPORT TABLE ---
        if (detailedReportsBody) {
            detailedReportsBody.innerHTML = ''; 
            salesData.forEach(sale => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'hover:bg-gray-50');
                
                row.innerHTML = `
                    <td class="py-3 px-4 text-sm text-gray-800">#INV-${sale.id}</td>
                    <td class="py-3 px-4 text-sm text-gray-800">${new Date(sale.date).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-sm text-gray-800">${sale.items_count || 0}</td>
                    <td class="py-3 px-4 text-sm text-gray-800">${formatCurrency(sale.total)}</td>
                    <td class="py-3 px-4 text-sm text-green-600">+N/A</td> 
                `;
                detailedReportsBody.appendChild(row);
            });
        }
        
        // --- 3. TOP SELLING & CHART Placeholder Update ---
        // (Assuming you have Top Selling Logic defined elsewhere or using placeholders)
        // ...

    const revenueOverTimeDiv = document.querySelector('#reports-page .h-80.bg-gray-50');
if (revenueOverTimeDiv) {
    revenueOverTimeDiv.innerHTML = '<canvas id="revenueChart"></canvas>';
    revenueOverTimeDiv.classList.remove('flex', 'flex-col', 'items-center', 'justify-center');
    
    // FIX: Final Chart Function call
    fetchAndRenderRevenueChart();
    }
        
    } catch (error) {
        console.error("Reports Data Load Error:", error);
        // Fallback for cards
        document.querySelectorAll('#reports-page .p-2xl').forEach(p => p.textContent = '₹Error');
    }
}




/* --- Activation: Reports Nav Link Click Event --- */
// Navigation Event Listener ko update karein taki woh 'reports' page par click hone par naya function call karein.

const reportsNavLink = document.querySelector('.nav-link[onclick*="showPage(\'reports\'"]');
if(reportsNavLink) {
    reportsNavLink.addEventListener('click', () => {
        // Assume showPage(id, element) is called by onclick in HTML
        
        // Call the dedicated function
        loadReportsData();
    });
}

// NOTE: Aapko yeh bhi check karna hoga ki 'loadDashboardData' function mein reports ka logic na ho, 
// agar ho to use hata dein aur sirf Dashboard ke liye rakhein.


// frontend/script.js (loadReportsData ke bahar add karein)

let myRevenueChart = null; // Global variable to store chart instance

async function fetchAndRenderRevenueChart() {
    try {
        const response = await fetch(BASE_URL + 'sales/daily-revenue/', { headers: AUTH_HEADERS });
        if (!response.ok) throw new Error("Failed to fetch daily revenue data.");

        const data = await response.json();
        
        const labels = data.map(item => new Date(item.date).toLocaleDateString());
        const revenues = data.map(item => item.revenue);
        
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Agar purana chart ho toh use destroy karein
        if (myRevenueChart) {
            myRevenueChart.destroy();
        }
        
        myRevenueChart = new Chart(ctx, {
            type: 'bar', // BAR CHART type
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Revenue (₹)',
                    data: revenues,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)', // Bar color
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (₹)'
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error("Chart Rendering Error:", error);
        const chartDiv = document.querySelector('#reports-page .h-80.bg-gray-50');
        if (chartDiv) chartDiv.innerHTML = '<p class="text-red-500">Error loading chart data.</p>';
    }
}