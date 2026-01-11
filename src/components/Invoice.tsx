import { X, Download, Share2 } from 'lucide-react';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerNIC?: string;
  phoneModel: string;
  phoneStorage: string;
  phoneColor: string;
  imei: string;
  sellingPrice: number;
  discount: number;
  finalPrice: number;
  paymentMethod: string;
}

interface InvoiceProps {
  data: InvoiceData;
  onClose: () => void;
}

export default function Invoice({ data, onClose }: InvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `iStore Invoice - ${data.invoiceNumber}`,
          text: `Invoice for ${data.phoneModel} - Rs. ${data.finalPrice.toFixed(2)}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Sharing not supported on this device');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Invoice Generated</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div id="invoice-content">
              <div className="border-2 border-slate-200 rounded-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">iStore</h1>
                  <p className="text-slate-600">Premium iPhone Retailer</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">INVOICE</p>
                    <p className="text-lg font-semibold text-slate-900">#{data.invoiceNumber}</p>
                    <p className="text-sm text-slate-600">{new Date(data.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Customer Details</h3>
                    <p className="text-slate-900 font-medium">{data.customerName}</p>
                    <p className="text-slate-600 text-sm">{data.customerPhone}</p>
                    {data.customerNIC && (
                      <p className="text-slate-600 text-sm">NIC: {data.customerNIC}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Payment Method</h3>
                    <p className="text-slate-900 font-medium capitalize">
                      {data.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Product Details</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Model:</span>
                      <span className="text-slate-900 font-medium">{data.phoneModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Storage:</span>
                      <span className="text-slate-900 font-medium">{data.phoneStorage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Color:</span>
                      <span className="text-slate-900 font-medium">{data.phoneColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">IMEI:</span>
                      <span className="text-slate-900 font-medium">{data.imei}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-slate-600">Selling Price:</span>
                      <span className="text-slate-900 font-semibold">
                        Rs. {data.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                    {data.discount > 0 && (
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-600">Discount:</span>
                        <span className="text-red-600 font-semibold">
                          - Rs. {data.discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-300 pt-3 mt-3">
                      <div className="flex justify-between text-2xl">
                        <span className="text-slate-900 font-bold">Final Amount:</span>
                        <span className="text-slate-900 font-bold">
                          Rs. {data.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                  <p className="text-sm text-slate-600">Thank you for your purchase!</p>
                  <p className="text-xs text-slate-500 mt-2">
                    This is a computer-generated invoice
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-slate-200">
            <button
              onClick={handlePrint}
              className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-content,
            #invoice-content * {
              visibility: visible;
            }
            #invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </>
  );
}
