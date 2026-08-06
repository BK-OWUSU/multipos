"use client"
import Image from "next/image"
import Link from "next/link"
import { ResetPasswordForm } from "./resetPassword-form"

<Image
  src="/pos-1.png"
  alt="Image"
  fill
  className="object-cover dark:brightness-[0.2] dark:grayscale"
/>


export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
       <div className="relative hidden bg-muted lg:block">
        <Image
          src="/pos-1.jpg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          // className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div> 
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Image src="/logo-trans.png" alt="Logo" width={20} height={20} />
            </div>
            multiPOS
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ResetPasswordForm/>
          </div>
        </div>
      </div>
    </div>
  )
}
