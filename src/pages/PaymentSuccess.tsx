import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

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

        <button
          onClick={() => navigate('/pos')}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-blue-100"
        >
          Return to POS
        </button>
      </div>
    </div>
  );
}
