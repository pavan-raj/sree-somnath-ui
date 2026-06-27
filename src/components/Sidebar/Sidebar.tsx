import './Sidebar.css';

type SidebarProps = {
  activeView: string;
  onSelect: (viewId: string) => void;
};

export default function Sidebar({ activeView, onSelect }: SidebarProps) {
  const views = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'loans', label: 'Pawn Loans' },
    { id: 'customers', label: 'Customers' },
    { id: 'inventory', label: 'Jewellery Stock' },
    { id: 'billing', label: 'Sales Billing' },
    { id: 'payments', label: 'Payments' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">SS</div>
        <div>
          <strong>Sree Somnath</strong>
          <span>Pawn Brokers and Jewellers</span>
        </div>
      </div>
      <nav>
        {views.map((view) => (
          <button
            key={view.id}
            className={`nav-item ${activeView === view.id ? 'active' : ''}`}
            onClick={() => onSelect(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
