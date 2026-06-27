import './BillingView.css';
import type { Dispatch, SetStateAction } from 'react';

type BillingViewProps = {
  billingForm: any;
  setBillingForm: Dispatch<SetStateAction<any>>;
  billLines: any[];
  onAddToBill: () => void;
  onPrintBill: () => void;
  customers: any[];
  stock: any[];
  formatCurrency: (value: number) => string;
};

export default function BillingView({ billingForm, setBillingForm, billLines, onAddToBill, onPrintBill, customers, stock, formatCurrency }: BillingViewProps) {
  return (
    <section className="view active">
      <div className="workspace single">
        <section className="panel billing-panel">
          <div className="panel-head">
            <h2>Sales Bill</h2>
            <button type="button" className="secondary" onClick={onPrintBill}>Print bill</button>
          </div>
          <div className="field-row">
            <label>Customer <select value={billingForm.customerId} onChange={(event) => setBillingForm((current) => ({ ...current, customerId: event.target.value }))}>
              <option value="">Walk-in / Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select></label>
            <label>Stock Item <select value={billingForm.itemId} onChange={(event) => setBillingForm((current) => ({ ...current, itemId: event.target.value }))}>
              <option value="">Select stock item</option>
              {stock.map((item) => <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>)}
            </select></label>
          </div>
          <div className="field-row">
            <label>Making Charges <input type="number" min="0" value={billingForm.makingCharges} onChange={(event) => setBillingForm((current) => ({ ...current, makingCharges: event.target.value }))} /></label>
            <label>Discount <input type="number" min="0" value={billingForm.discount} onChange={(event) => setBillingForm((current) => ({ ...current, discount: event.target.value }))} /></label>
          </div>
          <button type="button" onClick={onAddToBill}>Add item to bill</button>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Item</th><th>Price</th><th>Making</th><th>Discount</th><th>Total</th></tr></thead>
              <tbody>
                {billLines.length ? billLines.map((line) => (
                  <tr key={`${line.id}-${line.total}`}>
                    <td>{line.sku}</td>
                    <td>{line.name}</td>
                    <td>{formatCurrency(line.price)}</td>
                    <td>{formatCurrency(line.making)}</td>
                    <td>{formatCurrency(line.discount)}</td>
                    <td>{formatCurrency(line.total)}</td>
                  </tr>
                )) : <tr><td colSpan="6">No records found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="bill-total">Total: <strong>{formatCurrency(billLines.reduce((sum, line) => sum + line.total, 0))}</strong></div>
        </section>
      </div>
    </section>
  );
}
