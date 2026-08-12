 {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900">Transaction Receipt</h3>
              <button 
                onClick={() => setCompletedSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Replace ReceiptPrintView with your actual receipt component path */}
            <ReceiptPrintView sale={completedSale} onClose={() => setCompletedSale(null)} />
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-500 text-center">Receipt ready for print or download for Sale ID: <span className="font-mono font-bold text-slate-800">{completedSale.id}</span></p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  Print Receipt
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCompletedSale(null)}
                  className="flex-1 text-xs"
                >
                  Close / Next Sale
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}




            {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Render the Receipt Component directly with an onClose handler */}
            <ReceiptPrintView 
              sale={completedSale} 
              onClose={() => setCompletedSale(null)} 
            />

          </div>
        </div>
      )}