declare module "@paystack/inline-js" {
  export interface PaystackResponse {
    reference: string;
    status: "success" | "ongoing" | "failed";
    trans: string;
    transaction: string;
    message: string;
    trxref?: string;
  }

  export interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    ref?: string;
    metadata?: Record<string, never>;
    onSuccess?: (response: PaystackResponse) => void;
    onCancel?: () => void;
  }

  export interface PaystackResumeOptions {
    onSuccess?: (response: PaystackResponse) => void;
    onCancel?: () => void;
  }

  export default class PaystackPop {
    constructor();
    // Maps the creation of clean client-configured payloads
    newTransaction(options: PaystackTransactionOptions): void;
    // Maps the backend access_code resumption framework you are using now
    resumeTransaction(accessCode: string, options?: PaystackResumeOptions): void;
  }
}