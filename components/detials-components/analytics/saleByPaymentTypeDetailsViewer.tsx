import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  RotateCcw, 
  BarChart3, 
  CreditCard,
  PieChart
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { PaymentTableDetailItem } from "@/types/types/sale-by-paymentType-analytics.type";

interface PaymentDetailsDrawerProps {
  payment: PaymentTableDetailItem | null;
}

export function PaymentDetailsDrawer({ payment }: PaymentDetailsDrawerProps) {
  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <CreditCard className="h-10 w-10 mb-2 stroke-1" />
        <p className="text-sm">No payment method selected.</p>
      </div>
    );
  }

  const isPositiveGrowth = payment.salesGrowth >= 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Header Banner / Title Card */}
      <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase mb-1">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Payment Channel Overview</span>
        </div>
        
        <div className="flex items-center justify-between my-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {payment.name}
            </h2>
            {payment.channelType && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <span>Channel Type: {payment.channelType}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <PieChart className="h-3.5 w-3.5" />
              {payment.percentageShare.toFixed(1)}% Share
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-700/60">
          <div>
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-400">
              <CurrencyFormatter amount={payment.totalSales} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Sales Growth</p>
            <div className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full ${
              isPositiveGrowth ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
            }`}>
              {isPositiveGrowth ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{isPositiveGrowth ? `+${payment.salesGrowth.toFixed(1)}%` : `${payment.salesGrowth.toFixed(1)}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card: Transactions */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Transactions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{payment.transactions.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Processed orders</p>
          </div>
        </div>

        {/* Card: Avg Order Value */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Order Value</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900"><CurrencyFormatter amount={payment.averageOrderValue} /></p>
            <p className="text-xs text-slate-500 mt-0.5">Per transaction</p>
          </div>
        </div>

        {/* Card: Items Sold */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Items Sold</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{payment.itemsSold.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total units moved</p>
          </div>
        </div>

        {/* Card: Percentage Share */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Market Share</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{payment.percentageShare.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Of total sales volume</p>
          </div>
        </div>
      </div>

      {/* Refunds Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <RotateCcw className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Refunds Processed</span>
          </div>
          <span className="text-sm font-bold text-rose-600"><CurrencyFormatter amount={payment.refunds} /></span>
        </div>
        <p className="text-xs text-slate-500">
          Total amount refunded through <span className="font-medium text-slate-700">{payment.name}</span> during the selected timeframe.
        </p>
      </div>

      {/* Performance Insights Note */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Channel Insights</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            {payment.name} contributed <CurrencyFormatter amount={payment.totalSales} /> ({payment.percentageShare.toFixed(1)}% of total sales) across {payment.transactions} transactions. Growth is tracking at {payment.salesGrowth.toFixed(1)}%.
          </p>
        </div>
      </div>
    </div>
  );
}