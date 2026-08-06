import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSaleStore } from '@/store/saleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

export default function CashRegisterInterceptor() {
       // Bind Zustand Store Hooks
       const { activeSession, loading, openCashSession } = useSaleStore();
       const {user} = useAuthStore();
       const businessSlug = user?.business.slug;
       const shopSlug = user?.currentShop?.shopSlug;
       const shopDashboardPath = `/${businessSlug}/shops/${shopSlug}/shop-dashboard`

       const router = useRouter();


    
       // Local component interactive states
       const [openingFloatInput, setOpeningFloatInput] = useState<string>("");
       const [openingNotesInput, setOpeningNotesInput] = useState<string>("");

         // Handle opening sequence submission
         const handleOpenRegister = async (e: React.SubmitEvent) => {
           e.preventDefault();
           const floatNum = parseFloat(openingFloatInput);
           if (isNaN(floatNum) || floatNum < 0) return;
       
           await openCashSession({
             startFloat: floatNum,
             notes: openingNotesInput || undefined,
           });
         }; 

         // 3. Create a clean exit routing function
    const handleDialogChange = (isOpen: boolean) => {
      // If the dialog is trying to close (isOpen is false), send them to the dashboard instead
      if (!isOpen) {
        router.push(shopDashboardPath); // Adjust this route path to match your actual dashboard link
      }
  };
  return (
      <Dialog open={!activeSession && !loading} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-106.25 bg-white rounded-2xl p-6" onInteractOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleOpenRegister}>
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Initialize Cash Register Shift</DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-400 mt-1">
                You must input a starting float balance before you can process payments or operate the terminal grid.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Starting Float (GHS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">GHS</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={openingFloatInput}
                    onChange={(e) => setOpeningFloatInput(e.target.value)}
                    className="pl-12 h-11 border-slate-200 font-bold text-sm rounded-xl focus-visible:ring-blue-600"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Opening Remarks / Notes</label>
                <textarea
                  placeholder="Optional notes regarding vault handover..."
                  value={openingNotesInput}
                  onChange={(e) => setOpeningNotesInput(e.target.value)}
                  className="w-full h-20 text-xs font-medium p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-md gap-2">
                {loading && <Loader2 className="w-3 h-3 animate-spin" />} Open Register Drawer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  )
}
