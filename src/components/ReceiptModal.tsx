import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, Printer, X } from 'lucide-react';
import { transactionApi } from '../api/transactions';
import { useSettingsStore, formatCurrency } from '../store/settingsStore';
import type { Transaction } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionIdOrInvoice: string | number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, transactionIdOrInvoice }) => {
  const { settings, fetchSettings } = useSettingsStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  useEffect(() => {
    if (!isOpen || !transactionIdOrInvoice) return;

    const fetchTransaction = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fallback supports numeric ID or string invoice number (starts with INV-)
        const idToFetch = typeof transactionIdOrInvoice === 'string' ? transactionIdOrInvoice : Number(transactionIdOrInvoice);
        const res = await transactionApi.getById(idToFetch as number);
        if (res.success && res.data) {
          setTransaction(res.data);
        } else {
          setError(res.message || 'Failed to load transaction data.');
        }
      } catch (err) {
        console.error('Error fetching receipt data:', err);
        setError('Error fetching transaction details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [isOpen, transactionIdOrInvoice]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!transaction) return;

    // The server falls back to the customer on file, so only ask when the sale
    // has no customer attached -- most counter sales do not.
    let phone = transaction.customer?.phone || '';
    if (!phone) {
      const entered = window.prompt('Nomor WhatsApp pelanggan (contoh: 081234567890)');
      if (!entered) return;
      phone = entered;
    }

    setWaStatus('sending');
    setWaError(null);
    try {
      const res = await transactionApi.sendReceiptWhatsApp(transaction.id, phone);
      if (res.success) {
        setWaStatus('sent');
      } else {
        setWaStatus('error');
        setWaError(res.message || 'Gagal mengirim struk.');
      }
    } catch (err) {
      setWaStatus('error');
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setWaError(message || 'Gagal mengirim struk. Periksa koneksi WhatsApp gateway.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:border-none print:max-h-full print:w-auto print:bg-white print:rounded-none">
        
        {/* Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden shrink-0">
          <h3 className="text-lg font-bold text-slate-900">Receipt</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin print:overflow-visible print:p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-slate-500 text-sm font-medium">Fetching receipt data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : transaction ? (
            <div className="printable-receipt border border-slate-200 bg-slate-50 p-6 rounded-xl mx-auto max-w-[320px] font-mono text-xs text-slate-800 shadow-inner print:border-none print:bg-white print:shadow-none print:p-0 print:mx-0">
              
              {/* Receipt Shop Title */}
              <div className="text-center space-y-1 mb-4">
                <h4 className="font-extrabold text-base uppercase text-slate-950 tracking-wide">{settings?.shop_name || 'POS STORE'}</h4>
                {settings?.receipt_header && (
                  <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight uppercase print:text-slate-700">{settings.receipt_header}</p>
                )}
                <p className="text-[10px] text-slate-400 tracking-tighter uppercase print:text-slate-500">
                  --------------------------------
                </p>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-1 mb-4 leading-normal">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold text-slate-950">{transaction.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(transaction.created_at).toLocaleString('id-ID', { hour12: false })}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="uppercase">{transaction.user?.name || 'Staff'}</span>
                </div>
                {transaction.customer && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="uppercase font-bold text-slate-900">{transaction.customer.name}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 tracking-tighter uppercase pt-1 print:text-slate-500">
                  --------------------------------
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-4 leading-normal">
                {transaction.items && transaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900 uppercase">
                      <span className="truncate max-w-[180px]">{item.product?.name || `Product #${item.product_id}`}</span>
                      <span>{formatCurrency(item.subtotal, settings)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 print:text-slate-600">
                      <span>
                        {item.quantity} x {formatCurrency(item.price, settings)}
                      </span>
                      {item.order_type && (
                        <span className="uppercase text-[9px] bg-slate-200/60 px-1 rounded print:bg-transparent print:border print:border-slate-300">
                          {item.order_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 tracking-tighter uppercase pt-1 print:text-slate-500">
                  --------------------------------
                </p>
              </div>

              {/* Financial Breakdowns */}
              <div className="space-y-1 mb-4 leading-normal">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(transaction.subtotal, settings)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium print:text-slate-700">
                    <span>DISCOUNT:</span>
                    <span>-{formatCurrency(transaction.discount, settings)}</span>
                  </div>
                )}
                {transaction.points_redeemed > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium print:text-slate-700">
                    <span>POINTS REDEEMED ({transaction.points_redeemed}):</span>
                    <span>-{formatCurrency(transaction.points_discount, settings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TAX ({settings?.tax_rate || 11}%):</span>
                  <span>{formatCurrency(transaction.tax, settings)}</span>
                </div>
                
                {/* Shipping Fee check */}
                {transaction.items?.some(i => i.order_type?.includes('delivery')) && (
                  <div className="flex justify-between">
                    <span>SHIPPING FEE:</span>
                    <span>{formatCurrency(25000, settings)}</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 tracking-tighter uppercase pt-1 print:text-slate-500">
                  ================================
                </p>
                <div className="flex justify-between font-extrabold text-sm text-slate-950 py-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(transaction.total, settings)}</span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-tighter uppercase print:text-slate-500">
                  ================================
                </p>
              </div>

              {/* Payment Details */}
              <div className="space-y-1 mb-4 leading-normal">
                <div className="flex justify-between">
                  <span>PAYMENT METHOD:</span>
                  <span className="uppercase font-bold">{transaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAYMENT STATUS:</span>
                  <span className="uppercase font-bold text-slate-900">{transaction.payment_status}</span>
                </div>
                {transaction.loyalty_points_earned > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold print:text-slate-800">
                    <span>POINTS EARNED:</span>
                    <span>+{transaction.loyalty_points_earned} pts</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 tracking-tighter uppercase pt-1 print:text-slate-500">
                  --------------------------------
                </p>
              </div>

              {/* Footer */}
              {settings?.receipt_footer && (
                <div className="text-center text-[10px] text-slate-500 leading-tight uppercase whitespace-pre-line print:text-slate-700">
                  {settings.receipt_footer}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="px-6 py-4 border-t border-slate-100 print:hidden shrink-0 space-y-3">
          {waStatus === 'sent' && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Struk terkirim via WhatsApp.
            </p>
          )}
          {waStatus === 'error' && waError && (
            <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {waError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm active:scale-95"
            >
              Close
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={!transaction || waStatus === 'sending'}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm active:scale-95 shadow-lg shadow-emerald-100"
            >
              {waStatus === 'sending' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              disabled={!transaction}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm active:scale-95 shadow-lg shadow-blue-100"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
