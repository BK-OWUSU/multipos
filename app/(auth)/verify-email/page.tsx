import { Suspense } from "react";
import { InputOTPForm } from "./otp-form";
import AppLoader from "@/components/loaders/app-loader";

export default function VerifyEmail() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <Suspense fallback={<AppLoader/>}>
        <InputOTPForm/>
      </Suspense>
    </div>
  )
}