import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Payment Failed</h1>
          <p className="text-slate-500">
            We couldn't process your payment. Please try again or contact support if the issue persists.
          </p>
          {orderId && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
              <span className="text-slate-500">Order ID: </span>
              <span className="font-semibold text-slate-700">{orderId}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-slate-200"
        >
          Return to POS
        </button>
      </div>
    </div>
  );
}
