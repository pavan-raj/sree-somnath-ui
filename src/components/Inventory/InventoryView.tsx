import './InventoryView.css';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

type InventoryViewProps = {
  stockForm: any;
  setStockForm: Dispatch<SetStateAction<any>>;
  stockSearch: string;
  setStockSearch: Dispatch<SetStateAction<string>>;
  rows: any[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function InventoryView({ stockForm, setStockForm, stockSearch, setStockSearch, rows, onSubmit }: InventoryViewProps) {
  return (
    <section className="view active">
      <div className="workspace">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <h2>Jewellery Stock Entry</h2>
          <label>Item Name <input value={stockForm.name} onChange={(event) => setStockForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <div className="field-row">
            <label>Category <select value={stockForm.category} onChange={(event) => setStockForm((current) => ({ ...current, category: event.target.value }))}><option>Ring</option><option>Chain</option><option>Bangle</option><option>Earrings</option><option>Coin</option><option>Other</option></select></label>
            <label>Metal <select value={stockForm.metal} onChange={(event) => setStockForm((current) => ({ ...current, metal: event.target.value }))}><option>Gold</option><option>Silver</option><option>Diamond</option><option>Platinum</option><option>Other</option></select></label>
          </div>
          <div className="field-row">
            <label>Weight (g) <input type="number" step="0.01" min="0" value={stockForm.weight} onChange={(event) => setStockForm((current) => ({ ...current, weight: event.target.value }))} required /></label>
            <label>Cost Price <input type="number" min="0" value={stockForm.costPrice} onChange={(event) => setStockForm((current) => ({ ...current, costPrice: event.target.value }))} required /></label>
          </div>
          <div className="field-row">
            <label>Selling Price <input type="number" min="0" value={stockForm.sellingPrice} onChange={(event) => setStockForm((current) => ({ ...current, sellingPrice: event.target.value }))} required /></label>
            <label>SKU/Tag <input value={stockForm.sku} onChange={(event) => setStockForm((current) => ({ ...current, sku: event.target.value }))} placeholder="Auto if blank" /></label>
          </div>
          <button type="submit">Add stock</button>
        </form>
        <section className="panel table-panel">
          <div className="panel-head"><h2>Available Stock</h2><input className="search" placeholder="Search stock" value={stockSearch} onChange={(event) => setStockSearch(event.target.value)} /></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Item</th><th>Metal</th><th>Weight</th><th>Cost</th><th>Selling</th><th>Status</th></tr></thead>
              <tbody>
                {rows.length ? rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}<br />{item.category}</td>
                    <td>{item.metal}</td>
                    <td>{item.weight}g</td>
                    <td>{item.costPrice}</td>
                    <td>{item.sellingPrice}</td>
                    <td><span className={`badge ${item.status === 'Sold' ? 'sold' : 'open'}`}>{item.status}</span></td>
                  </tr>
                )) : <tr><td colSpan="7">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
