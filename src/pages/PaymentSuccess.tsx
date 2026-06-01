import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Printer } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Payment Successful!</h1>
          <p className="text-slate-500">
            Your transaction has been completed successfully.
          </p>
          {orderId && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
              <span className="text-slate-500">Order ID: </span>
              <span className="font-semibold text-slate-700">{orderId}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsReceiptOpen(true)}
            disabled={!orderId}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm border border-slate-200 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-blue-100"
          >
            Return to POS
          </button>
        </div>
      </div>

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        transactionIdOrInvoice={orderId || ''} 
      />
    </div>
  );
}
