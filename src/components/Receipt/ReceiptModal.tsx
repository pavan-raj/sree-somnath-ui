import './ReceiptModal.css';

type ReceiptModalProps = {
  receipt: any;
  onClose: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
  customerLookup: Map<string, { name: string; phone: string; idType: string; idNumber: string; address: string; photo?: string }>;
};

export default function ReceiptModal({ receipt, onClose, formatCurrency, formatDate, customerLookup }: ReceiptModalProps) {
  if (!receipt) return null;

  const customer = customerLookup.get(receipt.customerId) || { name: 'Walk-in', phone: '-', idType: '-', idNumber: '-', address: '-' };

  return (
    <dialog open className="receipt-dialog">
      <div className="receipt-panel">
        <div className="receipt-scroll">
          <div className="receipt">
            <div className="receipt-header receipt-header-large">
              <div>
                <h2>Sree Somnath Pawn Brokers and Jewellers</h2>
              </div>
              <div className="receipt-number receipt-number-card">
                <span>Loan No</span>
                <strong>{receipt.loanNo}</strong>
              </div>
            </div>

            <div className="receipt-summary receipt-summary-card">
          <div><span>Receipt Date</span><strong>{formatDate(receipt.createdAt?.slice(0, 10))}</strong></div>
          <div><span>Due Date</span><strong>{formatDate(receipt.dueDate)}</strong></div>
          <div><span>Loan Amount Given</span><strong>{formatCurrency(receipt.amount)}</strong></div>
          <div><span>Interest</span><strong>{receipt.rate}% per month</strong></div>
        </div>

        <div className="receipt-section">
          <h3>Customer Details</h3>
          <div className="receipt-with-photo">
            <div className="photo-box">
              <span>Customer Photo</span>
              {customer.photo ? <img src={customer.photo} alt="customer" /> : <div className="photo-empty">Photo not added</div>}
            </div>
            <div className="receipt-grid">
              <div className="receipt-line"><span>Name</span><strong>{customer.name}</strong></div>
              <div className="receipt-line"><span>Mobile</span><strong>{customer.phone}</strong></div>
              <div className="receipt-line"><span>ID Proof</span><strong>{customer.idType} {customer.idNumber}</strong></div>
              <div className="receipt-line"><span>Address</span><strong>{customer.address}</strong></div>
            </div>
          </div>
        </div>

        <div className="receipt-section">
          <h3>Ornament Details</h3>
          <div className="receipt-with-photo">
            <div className="photo-box">
              <span>Ornament Photo</span>
              {receipt.ornamentPhoto ? <img src={receipt.ornamentPhoto} alt="ornament" /> : <div className="photo-empty">Photo not added</div>}
            </div>
            <div className="receipt-grid">
              <div className="receipt-line"><span>Article Type</span><strong>{receipt.itemType}</strong></div>
              <div className="receipt-line"><span>Description</span><strong>{receipt.itemDetails}</strong></div>
              <div className="receipt-line"><span>Weight / Purity</span><strong>{receipt.weight}g / {receipt.purity || '-'}</strong></div>
              <div className="receipt-line"><span>Packet / Reference No</span><strong>{receipt.photoRef || '-'}</strong></div>
              <div className="receipt-line"><span>Estimated Value</span><strong>{formatCurrency(receipt.valuation)}</strong></div>
              <div className="receipt-line"><span>Amount Advanced</span><strong>{formatCurrency(receipt.amount)}</strong></div>
            </div>
          </div>
        </div>

        <div className="terms-box">
          <strong>Plain summary:</strong> The above ornament has been received as security for the loan amount shown. Customer must repay principal, interest and any agreed charges before or on the due date to release the ornament.
          <br /><strong>Note:</strong> After 11 months, the ornament will be dismantled as per shop policy.
        </div>

        <div className="signature-row">
          <span>Customer Signature</span>
          <span>Staff Signature</span>
        </div>
      </div>
</div>
        <div className="receipt-actions">
          <button type="button" onClick={() => window.print()}>Print</button>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
}
