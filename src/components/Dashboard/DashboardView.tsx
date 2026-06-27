import './DashboardView.css';

type DashboardViewProps = {
  stats: { activeLoans: number; principal: number; overdueLoans: number; stockValue: number };
  dueSoon: any[];
  activity: any[];
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
  loanStatus: (loan: any) => string;
  daysUntil: (value: string) => number;
};

export default function DashboardView({ stats, dueSoon, activity, formatCurrency, formatDate, loanStatus, daysUntil }: DashboardViewProps) {
  return (
    <section className="view active">
      <div className="stats-grid">
        <article className="stat">
          <span>Active Loans</span>
          <strong>{stats.activeLoans}</strong>
        </article>
        <article className="stat">
          <span>Total Principal</span>
          <strong>{formatCurrency(stats.principal)}</strong>
        </article>
        <article className="stat">
          <span>Overdue Loans</span>
          <strong>{stats.overdueLoans}</strong>
        </article>
        <article className="stat">
          <span>Jewellery Stock</span>
          <strong>{formatCurrency(stats.stockValue)}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Due Soon</h2>
            <span>Next 7 days</span>
          </div>
          <div className="list">
            {dueSoon.length ? dueSoon.map((loan) => (
              <div key={loan.id} className="list-item">
                <div>
                  <strong>{loan.customerName || 'Customer'}</strong>
                  <span>{loan.itemType} {loan.itemDetails} due {formatDate(loan.dueDate)}</span>
                </div>
                <span className={`badge ${loanStatus(loan)}`}>{loanStatus(loan)}</span>
              </div>
            )) : <div className="list-item"><span>No loans due soon</span></div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Recent Activity</h2>
            <span>Latest entries</span>
          </div>
          <div className="list">
            {activity.length ? activity.map((entry) => (
              <div key={`${entry.text}-${entry.date}`} className="list-item">
                <div>
                  <strong>{entry.text}</strong>
                  <span>{new Date(entry.date).toLocaleString('en-IN')}</span>
                </div>
                <strong>{formatCurrency(entry.amount)}</strong>
              </div>
            )) : <div className="list-item"><span>No activity yet</span></div>}
          </div>
        </section>
      </div>
    </section>
  );
}
