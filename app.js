const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const today = new Date();
const storeKey = "pawnJewelleryPrototype";
const businessName = "Sree Somnath Pawn Brokers and Jewellers";

const state = loadState();
let billLines = [];
let activePhotoTarget = "";
let activeStream = null;
let capturedFrame = "";
const capturedPhotos = {
  customerPhoto: "",
  loanCustomerPhoto: "",
  ornamentPhoto: ""
};
const $ = selector => document.querySelector(selector);

const views = {
  dashboard: ["Dashboard", "Today's business position at a glance"],
  loans: ["Pawn Loans", "Create pledge entries, track interest, and print receipts"],
  customers: ["Customers", "KYC and contact records"],
  inventory: ["Jewellery Stock", "Purchase stock, pricing, and sale status"],
  billing: ["Sales Billing", "Create jewellery sale bills from stock"],
  payments: ["Payments", "Collect interest or close pawn loans"],
  reports: ["Reports", "Cash, overdue, stock, and daily notes"]
};

function loanNumber() {
  return `CF-${String(state.loans.length + 1).padStart(4, "0")}`;
}

function interestRateFor(type, amount) {
  const item = String(type || "").toLowerCase();
  const value = Number(amount || 0);
  if (item === "silver") return 2.5;
  if (item === "gold") return value > 25000 ? 2.5 : 3;
  return value > 25000 ? 2.5 : 3;
}

function updateInterestRate() {
  $("#interestRate").value = interestRateFor($("#itemType").value, $("#loanAmount").value);
}

function loadState() {
  const saved = localStorage.getItem(storeKey);
  if (saved) return JSON.parse(saved);
  return {
    customers: [],
    loans: [],
    stock: [],
    payments: [],
    sales: [],
    notes: ""
  };
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(dateValue) {
  const due = new Date(dateValue + "T00:00:00");
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((due - start) / 86400000);
}

function loanStatus(loan) {
  if (loan.status === "Closed") return "closed";
  return daysUntil(loan.dueDate) < 0 ? "overdue" : "open";
}

function interestDue(loan) {
  const created = new Date(loan.createdAt);
  const months = Math.max(1, Math.ceil((today - created) / (86400000 * 30)));
  return Math.round(loan.amount * (loan.rate / 100) * months);
}

function customerName(customerId) {
  return state.customers.find(c => c.id === customerId)?.name || "Walk-in";
}

function stockLabel(item) {
  return `${item.sku} - ${item.name} (${money.format(item.sellingPrice)})`;
}

function fileToDataUrl(file) {
  return new Promise(resolve => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function photoValue(inputId) {
  return capturedPhotos[inputId] || await fileToDataUrl($(`#${inputId}`).files[0]);
}

function setPhotoPreview(inputId, src) {
  const preview = $(`#${inputId}Preview`);
  if (!preview) return;
  preview.innerHTML = src ? `<img src="${src}" alt="Captured photo">` : "No photo";
}

function clearPhoto(inputId) {
  capturedPhotos[inputId] = "";
  if ($(`#${inputId}`)) $(`#${inputId}`).value = "";
  setPhotoPreview(inputId, "");
}

function photoBox(title, src, note) {
  return `
    <div class="photo-box">
      <span>${title}</span>
      ${src ? `<img src="${src}" alt="${title}">` : `<div class="photo-empty">Photo not added</div>`}
      ${note ? `<small>${note}</small>` : ""}
    </div>
  `;
}

function customerFromLoanForm(photo) {
  const name = $("#loanCustomerName").value.trim();
  if (!name) return "";
  const customer = {
    id: id("CUS"),
    name,
    phone: $("#loanCustomerPhone").value.trim(),
    idType: $("#loanCustomerIdType").value,
    idNumber: $("#loanCustomerIdNumber").value.trim(),
    address: $("#loanCustomerAddress").value.trim(),
    photo
  };
  state.customers.push(customer);
  return customer.id;
}

function fillCustomerFields(prefix, data) {
  if (prefix === "loanCustomer") {
    if (data.name) $("#loanCustomerName").value = data.name;
    if (data.idType) $("#loanCustomerIdType").value = data.idType;
    if (data.idNumber) $("#loanCustomerIdNumber").value = data.idNumber;
    if (data.address) $("#loanCustomerAddress").value = data.address;
    return;
  }
  if (data.name) $("#customerName").value = data.name;
  if (data.idType) $("#idType").value = data.idType;
  if (data.idNumber) $("#idNumber").value = data.idNumber;
  if (data.address) $("#address").value = data.address;
}

function parseIdPayload(raw) {
  const text = String(raw || "").trim();
  const data = {};
  const xmlMatch = text.match(/<\?xml|<PrintLetterBarcode|<KycRes|<UidData/i);
  if (xmlMatch) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const node = doc.querySelector("PrintLetterBarcode, Poi, Poa, UidData") || doc.documentElement;
    const attr = name => node?.getAttribute(name) || "";
    data.name = attr("name");
    data.idNumber = attr("uid") || attr("u") || "";
    const addressParts = ["house", "street", "lm", "loc", "vtc", "po", "dist", "state", "pc"].map(attr).filter(Boolean);
    data.address = addressParts.join(", ");
  } else {
    const nameMatch = text.match(/(?:name|customer|cardholder)[:=\s]+([A-Z][A-Z .]{2,})/i);
    const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
    const panMatch = text.match(/\b[A-Z]{5}\d{4}[A-Z]\b/i);
    if (nameMatch) data.name = nameMatch[1].trim();
    if (aadhaarMatch) data.idNumber = aadhaarMatch[0].replace(/\s/g, "");
    if (panMatch) data.idNumber = panMatch[0].toUpperCase();
  }
  if (data.idNumber && /^\d{12}$/.test(data.idNumber)) data.idType = "Aadhaar";
  if (data.idNumber && /^[A-Z]{5}\d{4}[A-Z]$/.test(data.idNumber)) data.idType = "PAN";
  return data;
}

async function scanIdProof(inputId, prefix) {
  const status = $(`#${inputId}Status`);
  const file = $(`#${inputId}`).files[0];
  if (!file) {
    status.textContent = "Please choose or take an ID proof photo first.";
    return;
  }
  if (!("BarcodeDetector" in window)) {
    status.textContent = "This browser cannot auto-scan ID images. Please enter the details manually.";
    return;
  }
  status.textContent = "Scanning ID proof...";
  try {
    const detector = new BarcodeDetector({ formats: ["qr_code", "pdf417", "aztec", "data_matrix"] });
    const image = await createImageBitmap(file);
    const codes = await detector.detect(image);
    if (!codes.length) {
      status.textContent = "No readable QR/barcode found. Please enter the details manually.";
      return;
    }
    const details = parseIdPayload(codes[0].rawValue);
    fillCustomerFields(prefix, details);
    status.textContent = details.name || details.idNumber ? "ID details filled. Please check once before saving." : "Code scanned, but customer details were not readable. Please enter manually.";
  } catch (error) {
    status.textContent = "Could not scan this ID image. Please enter the details manually.";
  }
}

function render() {
  renderSelectors();
  renderDashboard();
  renderCustomers();
  renderLoans();
  renderStock();
  renderBilling();
  renderPayments();
  renderReports();
  saveState();
}

function renderSelectors() {
  const customerOptions = state.customers.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join("");
  const emptyCustomer = `<option value="">Walk-in / Select customer</option>`;
  $("#loanCustomer").innerHTML = `<option value="">New customer below or select existing</option>` + customerOptions;
  $("#billCustomer").innerHTML = emptyCustomer + customerOptions;

  const available = state.stock.filter(i => i.status === "Available");
  $("#billItem").innerHTML = available.map(i => `<option value="${i.id}">${stockLabel(i)}</option>`).join("") || `<option value="">No available stock</option>`;
}

function renderDashboard() {
  const activeLoans = state.loans.filter(l => l.status !== "Closed");
  const overdue = activeLoans.filter(l => loanStatus(l) === "overdue");
  const stockValue = state.stock.filter(i => i.status === "Available").reduce((sum, i) => sum + Number(i.costPrice), 0);
  $("#activeLoans").textContent = activeLoans.length;
  $("#totalPrincipal").textContent = money.format(activeLoans.reduce((sum, l) => sum + Number(l.amount), 0));
  $("#overdueLoans").textContent = overdue.length;
  $("#stockValue").textContent = money.format(stockValue);

  const dueSoon = activeLoans
    .filter(l => daysUntil(l.dueDate) <= 7)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 6);
  $("#dueSoonList").innerHTML = dueSoon.length ? dueSoon.map(l => `
    <div class="list-item">
      <div><strong>${customerName(l.customerId)}</strong><span>${l.itemType} ${l.itemDetails} due ${formatDate(l.dueDate)}</span></div>
      <span class="badge ${loanStatus(l)}">${loanStatus(l)}</span>
    </div>
  `).join("") : `<div class="list-item"><span>No loans due soon</span></div>`;

  const activity = [
    ...state.loans.map(l => ({ date: l.createdAt, text: `Loan ${l.loanNo} created`, amount: l.amount })),
    ...state.payments.map(p => ({ date: p.date, text: `${p.type} payment collected`, amount: p.amount })),
    ...state.sales.map(s => ({ date: s.date, text: `Bill ${s.billNo} created`, amount: s.total }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  $("#activityList").innerHTML = activity.length ? activity.map(a => `
    <div class="list-item"><div><strong>${a.text}</strong><span>${new Date(a.date).toLocaleString("en-IN")}</span></div><strong>${money.format(a.amount)}</strong></div>
  `).join("") : `<div class="list-item"><span>No activity yet</span></div>`;
}

function renderCustomers() {
  const q = $("#customerSearch").value.toLowerCase();
  const rows = state.customers.filter(c => Object.values(c).join(" ").toLowerCase().includes(q));
  $("#customerTable").innerHTML = table(["Name", "Mobile", "ID", "Address", "Loans"], rows.map(c => [
    c.name,
    c.phone,
    `${c.idType}: ${c.idNumber}`,
    c.address,
    state.loans.filter(l => l.customerId === c.id && l.status !== "Closed").length
  ]));
}

function renderLoans() {
  const q = $("#loanSearch").value.toLowerCase();
  const rows = state.loans.filter(l => `${l.loanNo} ${customerName(l.customerId)} ${l.itemType} ${l.itemDetails}`.toLowerCase().includes(q));
  $("#loanTable").innerHTML = table(["Loan", "Customer", "Item", "Loan", "Due", "Status", "Action"], rows.map(l => [
    l.loanNo,
    customerName(l.customerId),
    `${l.itemType}<br>${l.itemDetails}<br>${l.weight}g ${l.purity}`,
    `${money.format(l.amount)}<br>${l.rate}% / month`,
    formatDate(l.dueDate),
    `<span class="badge ${loanStatus(l)}">${l.status === "Closed" ? "Closed" : loanStatus(l)}</span>`,
    `<div class="row-actions"><button onclick="showReceipt('${l.id}')">Receipt</button><button class="secondary" onclick="closeLoan('${l.id}')">Close</button></div>`
  ]));
}

function renderStock() {
  const q = $("#stockSearch").value.toLowerCase();
  const rows = state.stock.filter(i => Object.values(i).join(" ").toLowerCase().includes(q));
  $("#stockTable").innerHTML = table(["SKU", "Item", "Metal", "Weight", "Cost", "Selling", "Status"], rows.map(i => [
    i.sku,
    `${i.name}<br>${i.category}`,
    i.metal,
    `${i.weight}g`,
    money.format(i.costPrice),
    money.format(i.sellingPrice),
    `<span class="badge ${i.status === "Sold" ? "sold" : "open"}">${i.status}</span>`
  ]));
}

function renderBilling() {
  $("#billTable").innerHTML = table(["SKU", "Item", "Price", "Making", "Discount", "Total"], billLines.map(line => [
    line.sku, line.name, money.format(line.price), money.format(line.making), money.format(line.discount), money.format(line.total)
  ]));
  $("#billTotal").textContent = money.format(billLines.reduce((sum, l) => sum + l.total, 0));
}

function renderPayments() {
  const q = $("#paymentSearch").value.toLowerCase();
  const rows = state.loans
    .filter(l => l.status !== "Closed")
    .filter(l => `${l.loanNo} ${customerName(l.customerId)} ${l.itemDetails}`.toLowerCase().includes(q));
  $("#paymentTable").innerHTML = table(["Loan", "Customer", "Principal", "Interest Due", "Due Date", "Actions"], rows.map(l => [
    l.loanNo,
    customerName(l.customerId),
    money.format(l.amount),
    money.format(interestDue(l)),
    formatDate(l.dueDate),
    `<div class="row-actions"><button onclick="collectInterest('${l.id}')">Collect interest</button><button class="secondary" onclick="closeLoan('${l.id}')">Close loan</button></div>`
  ]));
}

function renderReports() {
  const principalOut = state.loans.filter(l => l.status !== "Closed").reduce((sum, l) => sum + Number(l.amount), 0);
  const payments = state.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const sales = state.sales.reduce((sum, s) => sum + Number(s.total), 0);
  const stockCost = state.stock.filter(i => i.status === "Available").reduce((sum, i) => sum + Number(i.costPrice), 0);
  $("#cashReport").innerHTML = [
    ["Principal outstanding", principalOut],
    ["Payments collected", payments],
    ["Sales billed", sales],
    ["Available stock cost", stockCost]
  ].map(([label, amount]) => `<div class="report-line"><span>${label}</span><strong>${money.format(amount)}</strong></div>`).join("");

  const overdue = state.loans.filter(l => l.status !== "Closed" && loanStatus(l) === "overdue");
  $("#overdueReport").innerHTML = overdue.length ? overdue.map(l => `
    <div class="list-item"><div><strong>${customerName(l.customerId)}</strong><span>${l.loanNo} is overdue by ${Math.abs(daysUntil(l.dueDate))} days</span></div><strong>${money.format(l.amount)}</strong></div>
  `).join("") : `<div class="list-item"><span>No overdue loans</span></div>`;
  $("#businessNotes").value = state.notes || "";
}

function table(headers, rows) {
  return `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${
    rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">No records found</td></tr>`
  }</tbody>`;
}

function showReceipt(loanId) {
  const loan = state.loans.find(l => l.id === loanId);
  const customer = state.customers.find(c => c.id === loan.customerId);
  const receivedDate = formatDate(loan.createdAt.slice(0, 10));
  $("#receiptContent").innerHTML = `
    <div class="receipt-header">
      <div>
        <h2>${businessName}</h2>
      </div>
      <div class="receipt-number">
        <span>Loan No</span>
        <strong>${loan.loanNo}</strong>
      </div>
    </div>

    <div class="receipt-summary">
      <div><span>Receipt Date</span><strong>${receivedDate}</strong></div>
      <div><span>Due Date</span><strong>${formatDate(loan.dueDate)}</strong></div>
      <div><span>Loan Amount Given</span><strong>${money.format(loan.amount)}</strong></div>
      <div><span>Interest</span><strong>${loan.rate}% per month</strong></div>
    </div>

    <div class="receipt-section">
      <h3>Customer Details</h3>
      <div class="receipt-with-photo">
        ${photoBox("Customer Photo", customer?.photo || "", customerName(loan.customerId))}
        <div class="receipt-grid">
          <div class="receipt-line"><span>Name</span><strong>${customerName(loan.customerId)}</strong></div>
          <div class="receipt-line"><span>Mobile</span><strong>${customer?.phone || "-"}</strong></div>
          <div class="receipt-line"><span>ID Proof</span><strong>${customer ? `${customer.idType} ${customer.idNumber}` : "-"}</strong></div>
          <div class="receipt-line"><span>Address</span><strong>${customer?.address || "-"}</strong></div>
        </div>
      </div>
    </div>

    <div class="receipt-section">
      <h3>Ornament Details</h3>
      <div class="receipt-with-photo">
        ${photoBox("Ornament Photo", loan.ornamentPhoto || "", loan.photoNote || "")}
        <div class="receipt-grid">
          <div class="receipt-line"><span>Article Type</span><strong>${loan.itemType}</strong></div>
          <div class="receipt-line"><span>Description</span><strong>${loan.itemDetails}</strong></div>
          <div class="receipt-line"><span>Weight / Purity</span><strong>${loan.weight}g / ${loan.purity || "-"}</strong></div>
          <div class="receipt-line"><span>Packet / Reference No</span><strong>${loan.photoRef || "-"}</strong></div>
          <div class="receipt-line"><span>Estimated Value</span><strong>${money.format(loan.valuation)}</strong></div>
          <div class="receipt-line"><span>Amount Advanced</span><strong>${money.format(loan.amount)}</strong></div>
        </div>
      </div>
    </div>

    <div class="terms-box">
      <strong>Plain summary:</strong>
      The above ornament has been received as security for the loan amount shown. Customer must repay principal, interest and any agreed charges before or on the due date to release the ornament.
      <br><strong>Note:</strong> After 11 months, the ornament will be dismantled as per shop policy.
    </div>

    <div class="signature-row">
      <span>Customer Signature</span>
      <span>Staff Signature</span>
    </div>
  `;
  $("#receiptDialog").showModal();
}

function collectInterest(loanId) {
  const loan = state.loans.find(l => l.id === loanId);
  const amount = interestDue(loan);
  state.payments.push({ id: id("PAY"), loanId, amount, type: "Interest", date: new Date().toISOString() });
  render();
}

function closeLoan(loanId) {
  const loan = state.loans.find(l => l.id === loanId);
  if (!loan || loan.status === "Closed") return;
  state.payments.push({ id: id("PAY"), loanId, amount: Number(loan.amount) + interestDue(loan), type: "Closure", date: new Date().toISOString() });
  loan.status = "Closed";
  render();
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item, .view").forEach(el => el.classList.remove("active"));
    button.classList.add("active");
    $(`#${button.dataset.view}`).classList.add("active");
    $("#pageTitle").textContent = views[button.dataset.view][0];
    $("#pageSubtitle").textContent = views[button.dataset.view][1];
  });
});

$("#customerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const photo = await photoValue("customerPhoto");
  state.customers.push({
    id: id("CUS"),
    name: $("#customerName").value.trim(),
    phone: $("#customerPhone").value.trim(),
    idType: $("#idType").value,
    idNumber: $("#idNumber").value.trim(),
    address: $("#address").value.trim(),
    photo
  });
  event.target.reset();
  clearPhoto("customerPhoto");
  render();
});

$("#loanForm").addEventListener("submit", async event => {
  event.preventDefault();
  const newCustomerPhoto = await photoValue("loanCustomerPhoto");
  const newCustomerId = customerFromLoanForm(newCustomerPhoto);
  const customerId = newCustomerId || $("#loanCustomer").value;
  if (!customerId) return alert("Please select an existing customer or fill the new customer details.");
  const ornamentPhoto = await photoValue("ornamentPhoto");
  const loan = {
    id: id("LOAN"),
    loanNo: loanNumber(),
    customerId,
    itemType: $("#itemType").value,
    itemDetails: $("#itemDetails").value.trim(),
    photoRef: $("#photoRef").value.trim(),
    photoNote: $("#photoNote").value.trim(),
    ornamentPhoto,
    weight: Number($("#weight").value),
    purity: $("#purity").value.trim(),
    valuation: Number($("#valuation").value),
    amount: Number($("#loanAmount").value),
    rate: Number($("#interestRate").value),
    dueDate: $("#dueDate").value,
    status: "Open",
    createdAt: new Date().toISOString()
  };
  state.loans.push(loan);
  event.target.reset();
  clearPhoto("loanCustomerPhoto");
  clearPhoto("ornamentPhoto");
  setDefaultDueDate();
  render();
  showReceipt(loan.id);
});

$("#stockForm").addEventListener("submit", event => {
  event.preventDefault();
  state.stock.push({
    id: id("STK"),
    sku: $("#sku").value.trim() || `TAG-${String(state.stock.length + 1).padStart(4, "0")}`,
    name: $("#stockName").value.trim(),
    category: $("#stockCategory").value,
    metal: $("#stockMetal").value,
    weight: Number($("#stockWeight").value),
    costPrice: Number($("#costPrice").value),
    sellingPrice: Number($("#sellingPrice").value),
    status: "Available",
    createdAt: new Date().toISOString()
  });
  event.target.reset();
  render();
});

$("#itemType").addEventListener("change", updateInterestRate);
$("#loanAmount").addEventListener("input", updateInterestRate);

document.querySelectorAll(".scan-id-button").forEach(button => {
  button.addEventListener("click", () => scanIdProof(button.dataset.scanInput, button.dataset.fillPrefix));
});

$("#addToBillBtn").addEventListener("click", () => {
  const item = state.stock.find(i => i.id === $("#billItem").value);
  if (!item) return;
  const making = Number($("#makingCharges").value || 0);
  const disc = Number($("#discount").value || 0);
  billLines.push({ id: item.id, sku: item.sku, name: item.name, price: Number(item.sellingPrice), making, discount: disc, total: Number(item.sellingPrice) + making - disc });
  renderBilling();
});

$("#printBillBtn").addEventListener("click", () => {
  if (!billLines.length) return alert("Add at least one item to bill.");
  const total = billLines.reduce((sum, l) => sum + l.total, 0);
  const sale = { id: id("BILL"), billNo: `BILL-${String(state.sales.length + 1).padStart(5, "0")}`, customerId: $("#billCustomer").value, lines: billLines, total, date: new Date().toISOString() };
  state.sales.push(sale);
  billLines.forEach(line => {
    const stock = state.stock.find(i => i.id === line.id);
    if (stock) stock.status = "Sold";
  });
  $("#receiptContent").innerHTML = `
    <h2>Jewellery Sales Bill</h2>
    <p>${businessName}</p>
    <p>Bill ${sale.billNo} - ${new Date(sale.date).toLocaleString("en-IN")}</p>
    <div class="receipt-grid">
      <div class="receipt-line"><span>Customer</span><strong>${customerName(sale.customerId)}</strong></div>
      <div class="receipt-line"><span>Total</span><strong>${money.format(total)}</strong></div>
    </div>
    <table>${table(["SKU", "Item", "Total"], billLines.map(l => [l.sku, l.name, money.format(l.total)]))}</table>
  `;
  billLines = [];
  render();
  $("#receiptDialog").showModal();
});

$("#backupBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawn-jewellery-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("#seedBtn").addEventListener("click", () => {
  if (state.customers.length || state.loans.length || state.stock.length) {
    if (!confirm("This will add sample records to existing data. Continue?")) return;
  }
  addSampleData();
  render();
});

$("#businessNotes").addEventListener("input", event => {
  state.notes = event.target.value;
  saveState();
});

["loanSearch", "customerSearch", "stockSearch", "paymentSearch"].forEach(field => {
  $(`#${field}`).addEventListener("input", render);
});

["customerPhoto", "loanCustomerPhoto", "ornamentPhoto"].forEach(inputId => {
  $(`#${inputId}`).addEventListener("change", async event => {
    capturedPhotos[inputId] = "";
    setPhotoPreview(inputId, await fileToDataUrl(event.target.files[0]));
  });
});

document.querySelectorAll(".camera-button").forEach(button => {
  button.addEventListener("click", () => openCamera(button.dataset.photoTarget));
});

$("#printReceiptBtn").addEventListener("click", () => window.print());
$("#closeReceiptBtn").addEventListener("click", () => $("#receiptDialog").close());
$("#closeCameraBtn").addEventListener("click", closeCamera);
$("#capturePhotoBtn").addEventListener("click", captureCameraPhoto);
$("#retakePhotoBtn").addEventListener("click", retakeCameraPhoto);
$("#choosePhotoBtn").addEventListener("click", choosePhotoFallback);
$("#usePhotoBtn").addEventListener("click", useCameraPhoto);

async function openCamera(target) {
  activePhotoTarget = target;
  capturedFrame = "";
  stopCameraStream();
  $("#cameraTitle").textContent = target === "ornamentPhoto" ? "Take Ornament Photo" : "Take Customer Photo";
  $("#cameraStatus").textContent = "Camera is starting. If the browser asks permission, choose Allow.";
  $("#cameraCanvas").style.display = "none";
  $("#cameraVideo").style.display = "block";
  $("#capturePhotoBtn").disabled = true;
  $("#usePhotoBtn").disabled = true;
  $("#retakePhotoBtn").disabled = true;
  $("#cameraDialog").showModal();
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera is not available in this browser.");
    }
    const facingMode = target === "ornamentPhoto" ? "environment" : "user";
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false });
    } catch (firstError) {
      activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    $("#cameraVideo").srcObject = activeStream;
    $("#cameraVideo").onloadedmetadata = () => {
      $("#cameraStatus").textContent = "Camera is ready. Click Capture photo.";
      $("#capturePhotoBtn").disabled = false;
    };
  } catch (error) {
    $("#cameraStatus").textContent = "Camera could not be opened. Click Choose photo, or allow camera permission in the browser and try again.";
    $("#capturePhotoBtn").disabled = true;
    $("#retakePhotoBtn").disabled = true;
    $("#usePhotoBtn").disabled = true;
    choosePhotoFallback();
  }
}

function stopCameraStream() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
}

function closeCamera() {
  stopCameraStream();
  $("#cameraDialog").close();
}

function captureCameraPhoto() {
  const video = $("#cameraVideo");
  const canvas = $("#cameraCanvas");
  if (!video.videoWidth || !video.videoHeight) {
    $("#cameraStatus").textContent = "Camera is still loading. Wait one second and try Capture photo again.";
    return;
  }
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 960;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedFrame = canvas.toDataURL("image/jpeg", 0.85);
  video.style.display = "none";
  canvas.style.display = "block";
  $("#cameraStatus").textContent = "Photo captured. Click Use this photo to save it.";
  $("#usePhotoBtn").disabled = false;
  $("#retakePhotoBtn").disabled = false;
}

function retakeCameraPhoto() {
  capturedFrame = "";
  $("#cameraVideo").style.display = "block";
  $("#cameraCanvas").style.display = "none";
  $("#cameraStatus").textContent = "Camera is ready. Click Capture photo.";
  $("#usePhotoBtn").disabled = true;
}

function choosePhotoFallback() {
  if (!activePhotoTarget) return;
  $(`#${activePhotoTarget}`).click();
}

function useCameraPhoto() {
  if (!activePhotoTarget || !capturedFrame) return;
  capturedPhotos[activePhotoTarget] = capturedFrame;
  $(`#${activePhotoTarget}`).value = "";
  setPhotoPreview(activePhotoTarget, capturedFrame);
  closeCamera();
}

function setDefaultDueDate() {
  const due = new Date();
  due.setMonth(due.getMonth() + 3);
  $("#dueDate").value = due.toISOString().slice(0, 10);
}

function addSampleData() {
  const c1 = { id: id("CUS"), name: "Ravi Sharma", phone: "9876543210", idType: "Aadhaar", idNumber: "XXXX-XXXX-2481", address: "MG Road, Bengaluru" };
  const c2 = { id: id("CUS"), name: "Neha Verma", phone: "9988776655", idType: "PAN", idNumber: "ABCDE1234F", address: "Park Street, Kolkata" };
  state.customers.push(c1, c2);
  state.loans.push({
    id: id("LOAN"), loanNo: loanNumber(), customerId: c1.id, itemType: "Gold", itemDetails: "22K chain and ring", photoRef: "PKT-101", photoNote: "Sample ornament photo not added", ornamentPhoto: "", weight: 28.4, purity: "916", valuation: 168000, amount: 105000, rate: 2.5, dueDate: offsetDate(20), status: "Open", createdAt: offsetIso(-38)
  });
  state.loans.push({
    id: id("LOAN"), loanNo: loanNumber(), customerId: c2.id, itemType: "Silver", itemDetails: "Anklets pair", photoRef: "PKT-102", photoNote: "Sample ornament photo not added", ornamentPhoto: "", weight: 185, purity: "925", valuation: 18000, amount: 10000, rate: 2.5, dueDate: offsetDate(-5), status: "Open", createdAt: offsetIso(-64)
  });
  state.stock.push(
    { id: id("STK"), sku: "TAG-0001", name: "Gold Ring", category: "Ring", metal: "Gold", weight: 5.4, costPrice: 32500, sellingPrice: 39800, status: "Available", createdAt: offsetIso(-8) },
    { id: id("STK"), sku: "TAG-0002", name: "Silver Coin", category: "Coin", metal: "Silver", weight: 50, costPrice: 5200, sellingPrice: 6400, status: "Available", createdAt: offsetIso(-3) }
  );
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function offsetIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

setDefaultDueDate();
updateInterestRate();
render();
