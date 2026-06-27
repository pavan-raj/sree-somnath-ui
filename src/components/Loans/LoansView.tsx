import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import PhotoUploadField from '../PhotoUploadField/PhotoUploadField';
import './LoansView.css';

type LoansViewProps = {
  loanForm: any;
  setLoanForm: Dispatch<SetStateAction<any>>;
  loanSearch: string;
  setLoanSearch: Dispatch<SetStateAction<string>>;
  rows: any[];
  customerLookup: Map<string, any>;
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
  loanStatus: (loan: any) => string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReceipt: (loanId: string) => void;
  onCloseLoan: (loanId: string) => void;
  loanCustomerPhoto: string;
  ornamentPhoto: string;
  onLoanCustomerPhoto: (event: string | ChangeEvent<HTMLInputElement>) => void;
  onOrnamentPhoto: (event: string | ChangeEvent<HTMLInputElement>) => void;
};

export default function LoansView({
  loanForm,
  setLoanForm,
  loanSearch,
  setLoanSearch,
  rows,
  customerLookup,
  formatCurrency,
  formatDate,
  loanStatus,
  onSubmit,
  onReceipt,
  onCloseLoan,
  loanCustomerPhoto,
  ornamentPhoto,
  onLoanCustomerPhoto,
  onOrnamentPhoto
}: LoansViewProps) {
  return (
    <section className="view active">
      <div className="workspace">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <h2>New Pawn Loan</h2>
          <section className="mini-section">
            <h3>Customer Details</h3>
            <label>
              Existing Customer
              <select value={loanForm.existingCustomer} onChange={(event) => setLoanForm((current) => ({ ...current, existingCustomer: event.target.value }))}>
                <option value="">New customer below or select existing</option>
                {Array.from(customerLookup.values()).map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name} - {customer.phone}</option>
                ))}
              </select>
            </label>
            <p className="helper-text">For a new customer, fill the details below. It will be saved automatically in Customers also.</p>
            <div className="field-row">
              <label>New Customer Name <input value={loanForm.name} onChange={(event) => setLoanForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" /></label>
              <label>Mobile <input value={loanForm.phone} onChange={(event) => setLoanForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Mobile number" /></label>
            </div>
            <div className="field-row">
              <label>ID Type <select value={loanForm.idType} onChange={(event) => setLoanForm((current) => ({ ...current, idType: event.target.value }))}><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Driving Licence</option><option>Other</option></select></label>
              <label>ID Number <input value={loanForm.idNumber} onChange={(event) => setLoanForm((current) => ({ ...current, idNumber: event.target.value }))} placeholder="ID proof number" /></label>
            </div>
            <PhotoUploadField
              label="Customer Photo"
              preview={loanCustomerPhoto}
              capture="user"
              onFileSelected={onLoanCustomerPhoto}
            />
            <label>Address <textarea rows="3" value={loanForm.address} onChange={(event) => setLoanForm((current) => ({ ...current, address: event.target.value }))} placeholder="Customer address" /></label>
          </section>

          <section className="mini-section">
            <h3>Ornament Details</h3>
            <div className="field-row">
              <label>Item Type <select value={loanForm.itemType} onChange={(event) => setLoanForm((current) => ({ ...current, itemType: event.target.value }))}><option>Gold</option><option>Silver</option><option>Diamond</option><option>Watch</option><option>Other</option></select></label>
              <label>Packet / Reference No <input value={loanForm.photoRef} onChange={(event) => setLoanForm((current) => ({ ...current, photoRef: event.target.value }))} placeholder="Packet number or locker reference" /></label>
            </div>
            <div className="field-row">
              <label>Item Details <input value={loanForm.itemDetails} onChange={(event) => setLoanForm((current) => ({ ...current, itemDetails: event.target.value }))} placeholder="22K bangles, chain, ring" required /></label>
              <label>Photo Note <input value={loanForm.photoNote} onChange={(event) => setLoanForm((current) => ({ ...current, photoNote: event.target.value }))} placeholder="Example: front side photo taken" /></label>
            </div>
            <PhotoUploadField
              label="Ornament Photo"
              preview={ornamentPhoto}
              capture="environment"
              onFileSelected={onOrnamentPhoto}
            />
            <div className="field-row">
              <label>Weight (g) <input type="number" min="0" step="0.01" value={loanForm.weight} onChange={(event) => setLoanForm((current) => ({ ...current, weight: event.target.value }))} required /></label>
              <label>Purity <input value={loanForm.purity} onChange={(event) => setLoanForm((current) => ({ ...current, purity: event.target.value }))} placeholder="22K / 916 / 925" /></label>
            </div>
            <div className="field-row">
              <label>Valuation <input type="number" min="0" value={loanForm.valuation} onChange={(event) => setLoanForm((current) => ({ ...current, valuation: event.target.value }))} required /></label>
              <label>Loan Amount <input type="number" min="0" value={loanForm.loanAmount} onChange={(event) => setLoanForm((current) => ({ ...current, loanAmount: event.target.value }))} required /></label>
            </div>
            <div className="field-row">
              <label>Interest % / Month <input type="number" min="0" step="0.1" value={loanForm.interestRate} onChange={(event) => setLoanForm((current) => ({ ...current, interestRate: event.target.value }))} required /></label>
              <label>Due Date <input type="date" value={loanForm.dueDate} onChange={(event) => setLoanForm((current) => ({ ...current, dueDate: event.target.value }))} required /></label>
            </div>
          </section>
          <button type="submit">Create loan receipt</button>
        </form>
        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Loan Register</h2>
            <input className="search" placeholder="Search loan, customer, item" value={loanSearch} onChange={(event) => setLoanSearch(event.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Loan</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((loan) => {
                  const customer = customerLookup.get(loan.customerId) || { name: 'Walk-in' };
                  return (
                    <tr key={loan.id}>
                      <td>{loan.loanNo}</td>
                      <td>{customer.name}</td>
                      <td>{loan.itemType}<br />{loan.itemDetails}<br />{loan.weight}g {loan.purity}</td>
                      <td>{formatCurrency(loan.amount)}<br />{loan.rate}% / month</td>
                      <td>{formatDate(loan.dueDate)}</td>
                      <td><span className={`badge ${loanStatus(loan)}`}>{loan.status === 'Closed' ? 'Closed' : loanStatus(loan)}</span></td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => onReceipt(loan.id)}>Receipt</button>
                          <button type="button" className="secondary" onClick={() => onCloseLoan(loan.id)}>Close</button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="7">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
