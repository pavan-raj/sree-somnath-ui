import './CustomersView.css';
import PhotoUploadField from '../PhotoUploadField/PhotoUploadField';

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';

type CustomersViewProps = {
  customerForm: any;
  setCustomerForm: Dispatch<SetStateAction<any>>;
  customerSearch: string;
  setCustomerSearch: Dispatch<SetStateAction<string>>;
  rows: any[];
  loanCount: (customerId: string) => number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  customerPhoto: string;
  onCustomerPhoto: (event: string | ChangeEvent<HTMLInputElement>) => void;
};

export default function CustomersView({ customerForm, setCustomerForm, customerSearch, setCustomerSearch, rows, loanCount, onSubmit, customerPhoto, onCustomerPhoto }: CustomersViewProps) {
  return (
    <section className="view active">
      <div className="workspace">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <h2>Customer KYC</h2>
          <label>Full Name <input value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label>Mobile <input value={customerForm.phone} onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))} required /></label>
          <label>ID Type <select value={customerForm.idType} onChange={(event) => setCustomerForm((current) => ({ ...current, idType: event.target.value }))}><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Driving Licence</option><option>Other</option></select></label>
          <label>ID Number <input value={customerForm.idNumber} onChange={(event) => setCustomerForm((current) => ({ ...current, idNumber: event.target.value }))} required /></label>
          <PhotoUploadField
            label="Customer Photo"
            preview={customerPhoto}
            capture="user"
            onFileSelected={onCustomerPhoto}
          />
          <label>Address <textarea rows="4" value={customerForm.address} onChange={(event) => setCustomerForm((current) => ({ ...current, address: event.target.value }))} required /></label>
          <button type="submit">Save customer</button>
        </form>
        <section className="panel table-panel">
          <div className="panel-head"><h2>Customer List</h2><input className="search" placeholder="Search customers" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} /></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Mobile</th><th>ID</th><th>Address</th><th>Loans</th></tr></thead>
              <tbody>
                {rows.length ? rows.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.idType}: {customer.idNumber}</td>
                    <td>{customer.address}</td>
                    <td>{loanCount(customer.id)}</td>
                  </tr>
                )) : <tr><td colSpan="5">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
