import './ReportsView.css';

type ReportsViewProps = {
  notes: string;
  onNotesChange: (value: string) => void;
  data: any;
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
  daysUntil: (value: string) => number;
  customerLookup: Map<string, any>;
};

export default function ReportsView({ notes, onNotesChange, data, formatCurrency, formatDate, daysUntil, customerLookup }: ReportsViewProps) {
  const principalOut = data.loans.filter((loan) => loan.status !== 'Closed').reduce((sum, loan) => sum + Number(loan.amount), 0);
  const payments = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const sales = data.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const stockCost = data.stock.filter((item) => item.status === 'Available').reduce((sum, item) => sum + Number(item.costPrice), 0);
  const overdue = data.loans.filter((loan) => loan.status !== 'Closed' && daysUntil(loan.dueDate) < 0);

  return (
    <section className="view active">
      <div className="report-grid">
        <section className="panel">
          <h2>Cash Summary</h2>
          <div className="report-lines">
            <div className="report-line"><span>Principal outstanding</span><strong>{formatCurrency(principalOut)}</strong></div>
            <div className="report-line"><span>Payments collected</span><strong>{formatCurrency(payments)}</strong></div>
            <div className="report-line"><span>Sales billed</span><strong>{formatCurrency(sales)}</strong></div>
            <div className="report-line"><span>Available stock cost</span><strong>{formatCurrency(stockCost)}</strong></div>
          </div>
        </section>
        <section className="panel">
          <h2>Overdue Alerts</h2>
          <div className="list">
            {overdue.length ? overdue.map((loan) => (
              <div key={loan.id} className="list-item">
                <div>
                  <strong>{customerLookup.get(loan.customerId)?.name || 'Walk-in'}</strong>
                  <span>{loan.loanNo} is overdue by {Math.abs(daysUntil(loan.dueDate))} days</span>
                </div>
                <strong>{formatCurrency(loan.amount)}</strong>
              </div>
            )) : <div className="list-item"><span>No overdue loans</span></div>}
          </div>
        </section>
        <section className="panel">
          <h2>Business Notes</h2>
          <textarea rows="9" placeholder="Daily notes, audit reminders, gold rate notes" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
        </section>
      </div>
    </section>
  );
}
