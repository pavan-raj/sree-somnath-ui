import './PaymentsView.css';
import type { Dispatch, SetStateAction } from 'react';

type PaymentsViewProps = {
  rows: any[];
  customerLookup: Map<string, any>;
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
  onCollectInterest: (loanId: string) => void;
  onCloseLoan: (loanId: string) => void;
  paymentSearch: string;
  setPaymentSearch: Dispatch<SetStateAction<string>>;
};

export default function PaymentsView({ rows, customerLookup, formatCurrency, formatDate, onCollectInterest, onCloseLoan, paymentSearch, setPaymentSearch }: PaymentsViewProps) {
  return (
    <section className="view active">
      <div className="workspace single">
        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Collect Interest / Close Loan</h2>
            <input className="search" placeholder="Search active loans" value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Loan</th><th>Customer</th><th>Principal</th><th>Interest Due</th><th>Due Date</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.length ? rows.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.loanNo}</td>
                    <td>{customerLookup.get(loan.customerId)?.name || 'Walk-in'}</td>
                    <td>{formatCurrency(loan.amount)}</td>
                    <td>{formatCurrency(Math.round(loan.amount * (loan.rate / 100)))}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => onCollectInterest(loan.id)}>Collect interest</button>
                        <button type="button" className="secondary" onClick={() => onCloseLoan(loan.id)}>Close loan</button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
