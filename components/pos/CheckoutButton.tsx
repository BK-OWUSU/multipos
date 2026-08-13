"use client";

import { useState } from "react";
import { POSCheckoutInput } from "@/types/schema/sale.schema";
import { PaystackResponse } from "@paystack/inline-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SaleReceipt } from "@/types/types/sale.receipt.type";

interface CheckoutButtonProps {
  checkoutPayload: POSCheckoutInput;
  onSuccess: (saleId: string, saleData?: SaleReceipt) => void;
  disabled?: boolean;
}

export default function CheckoutButton({ checkoutPayload, onSuccess, disabled }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Endpoint helper to wipe or void the stale transaction record 
  const handleRollbackSale = async (saleId: string) => {
    try {
      const res = await fetch("/api/business/sales/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId }),
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error("CRITICAL_ROLLBACK_FAILURE:", err);
      return false;
    }
  };

  const executeCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/business/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const responseData = await res.json();

      if (!res.ok || !responseData.success) {
        toast.error(responseData.error || "Checkout initial tracking failed.");
        setIsProcessing(false);
        return;
      }

      const dataLayer = responseData.data || responseData.sale || responseData.order;
      
      const verifiedSaleId = 
        responseData.saleId ||
        responseData.id ||
        dataLayer?.saleId || 
        dataLayer?.id || 
        dataLayer?.sale?.id;

      const explicitPaymentMethod = 
        responseData.paymentMethod || 
        dataLayer?.paymentMethod || 
        checkoutPayload.paymentMethod;

      const paystackAccessCode = 
        dataLayer?.access_code || 
        responseData.access_code || 
        dataLayer?.paystackResponse?.data?.access_code;

      if (!verifiedSaleId) {
        toast.error("Transaction resolved, but no valid Sale ID was found.");
        setIsProcessing(false);
        return;
      }

      // Handle Instant Cash
      if (explicitPaymentMethod === "CASH") {
        // Extract the sale object returned by your backend API
        const cashSaleData = responseData.data?.sale || responseData.sale;
        onSuccess(verifiedSaleId, cashSaleData as SaleReceipt);
        setIsProcessing(false);
        return;
      }

      if (!paystackAccessCode) {
        toast.error("Could not locate payment gateway access token.");
        setIsProcessing(false);
        return;
      }
      
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();

      popup.resumeTransaction(paystackAccessCode, {
        onSuccess: (response: PaystackResponse) => {
          onSuccess(verifiedSaleId);
          setIsProcessing(false);
        },
        onCancel: () => {
          setIsProcessing(false);

          // ── SYSTEM OVERRIDE TOAST DISMISSAL DIALOGUE ──
          // Instead of instantly dropping it, let the cashier decide if they want to save or kill it
          toast.warning("Payment process was interrupted or timed out.", {
            description: "The order is currently saved as PENDING. What would you like to do?",
            duration: Infinity, // Stays until handled explicitly
            action: {
              label: "Void / Clear Order",
              onClick: async () => {
                const loadingToast = toast.loading("Cleaning up database record...");
                const success = await handleRollbackSale(verifiedSaleId);
                toast.dismiss(loadingToast);
                
                if (success) {
                  toast.success("Order cleared. You can safely modify the cart or try again.");
                } else {
                  toast.error("Failed to clean up the order. Please check your transaction history.");
                }
              },
            },
            cancel: {
              label: "Keep Pending",
              onClick: () => {
                toast.info("Order saved as PENDING on your dashboard.");
              }
            }
          });
        },
      });

    } catch (error) {
      console.error("FRONTEND_PAYMENT_TRIGGER_ERROR:", error);
      toast.error("Error initializing payment flow framework.");
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={executeCheckout}
      disabled={isProcessing || disabled}
      className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Processing Transaction...</span>
        </>
      ) : (
        <span>Complete Order & Charge</span>
      )}
    </Button>
  );
}