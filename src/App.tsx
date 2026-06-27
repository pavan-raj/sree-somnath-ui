import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import DashboardView from './components/Dashboard/DashboardView';
import LoansView from './components/Loans/LoansView';
import CustomersView from './components/Customers/CustomersView';
import InventoryView from './components/Inventory/InventoryView';
import BillingView from './components/Billing/BillingView';
import PaymentsView from './components/Payments/PaymentsView';
import ReportsView from './components/Reports/ReportsView';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import ReceiptModal from './components/Receipt/ReceiptModal';
import './App.css';

const STORE_KEY = 'pawnJewelleryPrototype';

const views = [
  { id: 'dashboard', title: 'Dashboard', subtitle: "Today's business position at a glance" },
  { id: 'loans', title: 'Pawn Loans', subtitle: 'Create pledge entries, track interest, and print receipts' },
  { id: 'customers', title: 'Customers', subtitle: 'KYC and contact records' },
  { id: 'inventory', title: 'Jewellery Stock', subtitle: 'Purchase stock, pricing, and sale status' },
  { id: 'billing', title: 'Sales Billing', subtitle: 'Create jewellery sale bills from stock' },
  { id: 'payments', title: 'Payments', subtitle: 'Collect interest or close pawn loans' },
  { id: 'reports', title: 'Reports', subtitle: 'Cash, overdue, stock, and daily notes' }
];

type Customer = {
  id: string;
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  photo?: string;
};

type Loan = {
  id: string;
  loanNo: string;
  customerId: string;
  itemType: string;
  itemDetails: string;
  photoRef: string;
  photoNote: string;
  ornamentPhoto: string;
  weight: number;
  purity: string;
  valuation: number;
  amount: number;
  rate: number;
  dueDate: string;
  status: 'Open' | 'Closed';
  createdAt: string;
};

type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  metal: string;
  weight: number;
  costPrice: number;
  sellingPrice: number;
  status: 'Available' | 'Sold';
  createdAt: string;
};

type Payment = {
  id: string;
  loanId: string;
  amount: number;
  type: string;
  date: string;
};

type Sale = {
  id: string;
  billNo: string;
  customerId: string;
  lines: BillLine[];
  total: number;
  date: string;
};

type BillLine = {
  id: string;
  sku: string;
  name: string;
  price: number;
  making: number;
  discount: number;
  total: number;
};

type AppState = {
  customers: Customer[];
  loans: Loan[];
  stock: StockItem[];
  payments: Payment[];
  sales: Sale[];
  notes: string;
};

type LoanForm = {
  existingCustomer: string;
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  itemType: string;
  photoRef: string;
  itemDetails: string;
  photoNote: string;
  weight: string;
  purity: string;
  valuation: string;
  loanAmount: string;
  interestRate: string;
  dueDate: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
};

type StockForm = {
  name: string;
  category: string;
  metal: string;
  weight: string;
  costPrice: string;
  sellingPrice: string;
  sku: string;
};

type BillingForm = {
  customerId: string;
  itemId: string;
  makingCharges: string;
  discount: string;
};

function getDefaultState(): AppState {
  return {
    customers: [],
    loans: [],
    stock: [],
    payments: [],
    sales: [],
    notes: ''
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return getDefaultState();
  const saved = window.localStorage.getItem(STORE_KEY);
  if (!saved) return getDefaultState();

  try {
    return JSON.parse(saved) as AppState;
  } catch {
    return getDefaultState();
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value: string): string {
  if (!value) return '';
  return new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(dateValue: string): number {
  const today = new Date();
  const due = new Date(dateValue + 'T00:00:00');
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((due.getTime() - start.getTime()) / 86400000);
}

function loanStatus(loan: Loan): string {
  if (loan.status === 'Closed') return 'closed';
  return daysUntil(loan.dueDate) < 0 ? 'overdue' : 'open';
}

function interestDue(loan: Loan) {
  const today = new Date();
  const created = new Date(loan.createdAt);
  const months = Math.max(1, Math.ceil((today - created) / (86400000 * 30)));
    return Math.round(Number(loan.amount) * (Number(loan.rate) / 100) * months);
}

function defaultDueDate(): string {
  const due = new Date();
  due.setMonth(due.getMonth() + 3);
    return due.toISOString().slice(0, 10);
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function offsetIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
    return d.toISOString();
}

function fileToDataUrl(file: File | null) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function buildSampleData() {
  return {
    customers: [
      { id: createId('CUS'), name: 'Ravi Sharma', phone: '9876543210', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-2481', address: 'MG Road, Bengaluru' },
      { id: createId('CUS'), name: 'Neha Verma', phone: '9988776655', idType: 'PAN', idNumber: 'ABCDE1234F', address: 'Park Street, Kolkata' }
    ],
    loans: [
      { id: createId('LOAN'), loanNo: `CF-${String(1).padStart(4, '0')}`, customerId: '', itemType: 'Gold', itemDetails: '22K chain and ring', photoRef: 'PKT-101', photoNote: 'Sample ornament photo not added', ornamentPhoto: '', weight: 28.4, purity: '916', valuation: 168000, amount: 105000, rate: 2.5, dueDate: offsetDate(20), status: 'Open', createdAt: offsetIso(-38) },
      { id: createId('LOAN'), loanNo: `CF-${String(2).padStart(4, '0')}`, customerId: '', itemType: 'Silver', itemDetails: 'Anklets pair', photoRef: 'PKT-102', photoNote: 'Sample ornament photo not added', ornamentPhoto: '', weight: 185, purity: '925', valuation: 18000, amount: 10000, rate: 2.5, dueDate: offsetDate(-5), status: 'Open', createdAt: offsetIso(-64) }
    ],
    stock: [
      { id: createId('STK'), sku: 'TAG-0001', name: 'Gold Ring', category: 'Ring', metal: 'Gold', weight: 5.4, costPrice: 32500, sellingPrice: 39800, status: 'Available', createdAt: offsetIso(-8) },
      { id: createId('STK'), sku: 'TAG-0002', name: 'Silver Coin', category: 'Coin', metal: 'Silver', weight: 50, costPrice: 5200, sellingPrice: 6400, status: 'Available', createdAt: offsetIso(-3) }
    ],
    payments: [],
    sales: [],
    notes: ''
  };
}

export default function App() {
  // The app keeps one source of truth for business data so every view stays in sync.
  const initialState = useMemo<AppState>(() => loadState(), []);
  const [data, setData] = useState<AppState>(initialState);
  const [activeView, setActiveView] = useState('dashboard');
  const [notes, setNotes] = useState(initialState.notes);
  const [loanForm, setLoanForm] = useState({
    existingCustomer: '',
    name: '',
    phone: '',
    idType: 'Aadhaar',
    idNumber: '',
    address: '',
    itemType: 'Gold',
    photoRef: '',
    itemDetails: '',
    photoNote: '',
    weight: '',
    purity: '',
    valuation: '',
    loanAmount: '',
    interestRate: '3',
    dueDate: defaultDueDate()
  });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', idType: 'Aadhaar', idNumber: '', address: '' });
  const [stockForm, setStockForm] = useState({ name: '', category: 'Ring', metal: 'Gold', weight: '', costPrice: '', sellingPrice: '', sku: '' });
  const [billingForm, setBillingForm] = useState({ customerId: '', itemId: '', makingCharges: '0', discount: '0' });
  const [billLines, setBillLines] = useState<BillLine[]>([]);
  const [loanSearch, setLoanSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [loanCustomerPhoto, setLoanCustomerPhoto] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [ornamentPhoto, setOrnamentPhoto] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...data, notes }));
  }, [data, notes]);

  const activeViewMeta = useMemo(() => views.find((view) => view.id === activeView) || views[0], [activeView]);

  const dashboardStats = useMemo(() => {
    const activeLoans = data.loans.filter((loan) => loan.status !== 'Closed');
    const overdue = activeLoans.filter((loan) => loanStatus(loan) === 'overdue');
    const stockValue = data.stock.filter((item) => item.status === 'Available').reduce((sum, item) => sum + Number(item.costPrice), 0);

    return {
      activeLoans: activeLoans.length,
      principal: activeLoans.reduce((sum, loan) => sum + Number(loan.amount), 0),
      overdueLoans: overdue.length,
      stockValue
    };
  }, [data]);

  const dueSoon = useMemo(() => {
    return data.loans
      .filter((loan) => loan.status !== 'Closed')
      .filter((loan) => daysUntil(loan.dueDate) <= 7)
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
      .slice(0, 6);
  }, [data]);

  const activity = useMemo(() => {
    return [
      ...data.loans.map((loan) => ({ date: loan.createdAt, text: `Loan ${loan.loanNo} created`, amount: loan.amount })),
      ...data.payments.map((payment) => ({ date: payment.date, text: `${payment.type} payment collected`, amount: payment.amount })),
      ...data.sales.map((sale) => ({ date: sale.date, text: `Bill ${sale.billNo} created`, amount: sale.total }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [data]);

  const customerLookup = useMemo(() => new Map(data.customers.map((customer) => [customer.id, customer])), [data.customers]);

  const loanRows = useMemo(() => {
    const query = loanSearch.toLowerCase();
    return data.loans.filter((loan) => {
      const customerName = customerLookup.get(loan.customerId)?.name || 'Walk-in';
      return `${loan.loanNo} ${customerName} ${loan.itemType} ${loan.itemDetails}`.toLowerCase().includes(query);
    });
  }, [data.loans, loanSearch, customerLookup]);

  const customerRows = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return data.customers.filter((customer) => Object.values(customer).join(' ').toLowerCase().includes(query));
  }, [data.customers, customerSearch]);

  const stockRows = useMemo(() => {
    const query = stockSearch.toLowerCase();
    return data.stock.filter((item) => Object.values(item).join(' ').toLowerCase().includes(query));
  }, [data.stock, stockSearch]);

  const paymentRows = useMemo(() => {
    const query = paymentSearch.toLowerCase();
    return data.loans
      .filter((loan) => loan.status !== 'Closed')
      .filter((loan) => `${loan.loanNo} ${customerLookup.get(loan.customerId)?.name || 'Walk-in'} ${loan.itemDetails}`.toLowerCase().includes(query));
  }, [data.loans, paymentSearch, customerLookup]);

  const handleAddCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCustomer = {
      id: createId('CUS'),
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      idType: customerForm.idType,
      idNumber: customerForm.idNumber.trim(),
      address: customerForm.address.trim(),
      photo: customerPhoto
    };

    setData((current) => ({ ...current, customers: [...current.customers, nextCustomer] }));
    setCustomerForm({ name: '', phone: '', idType: 'Aadhaar', idNumber: '', address: '' });
    setCustomerPhoto('');
  };

  const handleAddLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let customerId = loanForm.existingCustomer;

    if (!customerId && loanForm.name.trim()) {
      const newCustomer = {
        id: createId('CUS'),
        name: loanForm.name.trim(),
        phone: loanForm.phone.trim(),
        idType: loanForm.idType,
        idNumber: loanForm.idNumber.trim(),
        address: loanForm.address.trim(),
        photo: loanCustomerPhoto
      };
      setData((current) => ({ ...current, customers: [...current.customers, newCustomer] }));
      customerId = newCustomer.id;
    }

    if (!customerId) {
      window.alert('Please select an existing customer or fill the new customer details.');
      return;
    }

    const nextLoan = {
      id: createId('LOAN'),
      loanNo: `CF-${String(data.loans.length + 1).padStart(4, '0')}`,
      customerId,
      itemType: loanForm.itemType,
      itemDetails: loanForm.itemDetails.trim(),
      photoRef: loanForm.photoRef.trim(),
      photoNote: loanForm.photoNote.trim(),
      ornamentPhoto: ornamentPhoto,
      weight: Number(loanForm.weight),
      purity: loanForm.purity.trim(),
      valuation: Number(loanForm.valuation),
      amount: Number(loanForm.loanAmount),
      rate: Number(loanForm.interestRate),
      dueDate: loanForm.dueDate,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    setData((current) => ({ ...current, loans: [...current.loans, nextLoan] }));
    setLoanForm({
      existingCustomer: '',
      name: '',
      phone: '',
      idType: 'Aadhaar',
      idNumber: '',
      address: '',
      itemType: 'Gold',
      photoRef: '',
      itemDetails: '',
      photoNote: '',
      weight: '',
      purity: '',
      valuation: '',
      loanAmount: '',
      interestRate: '3',
      dueDate: defaultDueDate()
    });
    setLoanCustomerPhoto('');
    setOrnamentPhoto('');
    setReceipt(nextLoan);
  };

  const handleAddStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextStock = {
      id: createId('STK'),
      sku: stockForm.sku.trim() || `TAG-${String(data.stock.length + 1).padStart(4, '0')}`,
      name: stockForm.name.trim(),
      category: stockForm.category,
      metal: stockForm.metal,
      weight: Number(stockForm.weight),
      costPrice: Number(stockForm.costPrice),
      sellingPrice: Number(stockForm.sellingPrice),
      status: 'Available',
      createdAt: new Date().toISOString()
    };

    setData((current) => ({ ...current, stock: [...current.stock, nextStock] }));
    setStockForm({ name: '', category: 'Ring', metal: 'Gold', weight: '', costPrice: '', sellingPrice: '', sku: '' });
  };

  const handleAddToBill = () => {
    const selectedItem = data.stock.find((item) => item.id === billingForm.itemId);
    if (!selectedItem) return;

    const making = Number(billingForm.makingCharges || 0);
    const discount = Number(billingForm.discount || 0);
    const total = Number(selectedItem.sellingPrice) + making - discount;

    setBillLines((current) => [...current, {
      id: selectedItem.id,
      sku: selectedItem.sku,
      name: selectedItem.name,
      price: Number(selectedItem.sellingPrice),
      making,
      discount,
      total
    }]);
  };

  const handlePrintBill = () => {
    if (!billLines.length) return window.alert('Add at least one item to bill.');
    const total = billLines.reduce((sum, line) => sum + line.total, 0);
    const sale = { id: createId('BILL'), billNo: `BILL-${String(data.sales.length + 1).padStart(5, '0')}`, customerId: billingForm.customerId, lines: billLines, total, date: new Date().toISOString() };

    setData((current) => ({
      ...current,
      sales: [...current.sales, sale],
      stock: current.stock.map((item) => billLines.some((line) => line.id === item.id) ? { ...item, status: 'Sold' } : item)
    }));
    setBillLines([]);
    setBillingForm((current) => ({ ...current, customerId: '', itemId: '' }));
    setReceipt({ type: 'bill', sale, businessName: 'Sree Somnath Pawn Brokers and Jewellers' });
  };

  const handleCollectInterest = (loanId) => {
    const loan = data.loans.find((item) => item.id === loanId);
    if (!loan) return;
    const amount = interestDue(loan);
    setData((current) => ({ ...current, payments: [...current.payments, { id: createId('PAY'), loanId, amount, type: 'Interest', date: new Date().toISOString() }] }));
  };

  const handleCloseLoan = (loanId) => {
    const loan = data.loans.find((item) => item.id === loanId);
    if (!loan || loan.status === 'Closed') return;
    setData((current) => ({
      ...current,
      payments: [...current.payments, { id: createId('PAY'), loanId, amount: Number(loan.amount) + interestDue(loan), type: 'Closure', date: new Date().toISOString() }],
      loans: current.loans.map((item) => item.id === loanId ? { ...item, status: 'Closed' } : item)
    }));
  };

  const handleLoadSampleData = () => {
    if (data.customers.length || data.loans.length || data.stock.length) {
      const shouldContinue = window.confirm('This will add sample records to existing data. Continue?');
      if (!shouldContinue) return;
    }

    const seed = buildSampleData();
    setData((current) => {
      const seededCustomers = seed.customers.map((customer, index) => ({
        ...customer,
        id: `${customer.id}-${index + 1}`
      }));

      const seededLoans = seed.loans.map((loan, index) => ({
        ...loan,
        customerId: seededCustomers[index % seededCustomers.length].id,
        loanNo: `CF-${String(current.loans.length + index + 1).padStart(4, '0')}`
      }));

      return {
        ...current,
        customers: [...current.customers, ...seededCustomers],
        loans: [...current.loans, ...seededLoans],
        stock: [...current.stock, ...seed.stock],
        payments: current.payments,
        sales: current.sales,
        notes: current.notes
      };
    });
  };

  const handleBackup = () => {
    const blob = new Blob([JSON.stringify({ ...data, notes }, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pawn-jewellery-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAttachPhoto = async (
    input: string | ChangeEvent<HTMLInputElement>,
    setter: Dispatch<SetStateAction<string>>
  ) => {
    if (!input) return;
    if (typeof input === 'string') {
      setter(input);
      return;
    }
    const file = input.target?.files?.[0];
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setter(preview);
  };

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onSelect={setActiveView} />

      <main className="content">
        <TopBar
          title={activeViewMeta.title}
          subtitle={activeViewMeta.subtitle}
          actions={[
            <button key="seed" className="secondary" onClick={handleLoadSampleData}>Load sample data</button>,
            <button key="backup" className="secondary" onClick={handleBackup}>Backup</button>
          ]}
        />

        {activeView === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            dueSoon={dueSoon.map((loan) => ({ ...loan, customerName: customerLookup.get(loan.customerId)?.name || 'Walk-in' }))}
            activity={activity}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            loanStatus={loanStatus}
            daysUntil={daysUntil}
          />
        )}

        {activeView === 'loans' && (
          <LoansView
            loanForm={loanForm}
            setLoanForm={setLoanForm}
            loanSearch={loanSearch}
            setLoanSearch={setLoanSearch}
            rows={loanRows}
            customerLookup={customerLookup}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            loanStatus={loanStatus}
            onSubmit={handleAddLoan}
            onReceipt={(loanId) => setReceipt(data.loans.find((loan) => loan.id === loanId) ?? null)}
            onCloseLoan={handleCloseLoan}
            loanCustomerPhoto={loanCustomerPhoto}
            ornamentPhoto={ornamentPhoto}
            onLoanCustomerPhoto={(event) => handleAttachPhoto(event, setLoanCustomerPhoto)}
            onOrnamentPhoto={(event) => handleAttachPhoto(event, setOrnamentPhoto)}
          />
        )}

        {activeView === 'customers' && (
          <CustomersView
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            rows={customerRows}
            loanCount={(customerId) => data.loans.filter((loan) => loan.customerId === customerId && loan.status !== 'Closed').length}
            onSubmit={handleAddCustomer}
            customerPhoto={customerPhoto}
            onCustomerPhoto={(event) => handleAttachPhoto(event, setCustomerPhoto)}
          />
        )}

        {activeView === 'inventory' && (
          <InventoryView
            stockForm={stockForm}
            setStockForm={setStockForm}
            stockSearch={stockSearch}
            setStockSearch={setStockSearch}
            rows={stockRows}
            onSubmit={handleAddStock}
          />
        )}

        {activeView === 'billing' && (
          <BillingView
            billingForm={billingForm}
            setBillingForm={setBillingForm}
            billLines={billLines}
            onAddToBill={handleAddToBill}
            onPrintBill={handlePrintBill}
            customers={data.customers}
            stock={data.stock.filter((item) => item.status === 'Available')}
            formatCurrency={formatCurrency}
          />
        )}

        {activeView === 'payments' && (
          <PaymentsView
            rows={paymentRows}
            customerLookup={customerLookup}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onCollectInterest={handleCollectInterest}
            onCloseLoan={handleCloseLoan}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
          />
        )}

        {activeView === 'reports' && (
          <ReportsView
            notes={notes}
            onNotesChange={setNotes}
            data={data}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            daysUntil={daysUntil}
            customerLookup={customerLookup}
          />
        )}
      </main>

      <ReceiptModal
        receipt={receipt}
        onClose={() => setReceipt(null)}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        customerLookup={customerLookup}
      />
    </div>
  );
}
