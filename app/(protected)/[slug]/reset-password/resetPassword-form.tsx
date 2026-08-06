"use client"
import { cn } from "@/lib/utils"
import {Field,FieldGroup} from "@/components/ui/field"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/reusables/inputs/FormInput" 
import { useForm, SubmitHandler, FormProvider } from "react-hook-form"
// import Link from "next/link"
import { passwordSchema, PasswordSchema } from "@/types/schema/auth.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/store/useAuthStore"
import CustomButton from "@/components/reusables/CustomButton"
import { SquareAsterisk } from "lucide-react";
import Link from "next/link"
import { SignUpResponse } from "@/types/auth/auth"



export function ResetPasswordForm({className,...props}: React.ComponentProps<"form">) {
  const resetPassword  = useAuthStore((state)=> state.resetPassword);
  const router = useRouter();
  const forms = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema)
  });
  const {
    handleSubmit, 
    setError, 
    formState:{isSubmitting, errors}
    } = forms
  const onSubmit: SubmitHandler<PasswordSchema> = async(data) => {
      const response = await resetPassword(data) as SignUpResponse;
    //If success, redirect user to login 
       if (response.success && response.redirectTo){
        router.push(response.redirectTo)
       }
  
    //Handle errors
      if(response.error) {
        setError("root", {message: response.error})
      }
  }

  return (
    <FormProvider {...forms} >
    <form  onSubmit={handleSubmit(onSubmit)}  className={cn("flex flex-col gap-6", className)} {...props} >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome To MultiPOS</h1>
          <p className="text-sm text-balance text-muted-foreground">
             Reset your password to proceed
          </p>
        </div>
        <FormInput name="newPassword" type="password" placeholder="Enter new password"/>
        <FormInput name="confirmPassword" type="password" placeholder="Enter confirm password"/>
        <Field>
          <CustomButton 
            type="submit" 
            text="Reset Password" 
            isLoading={isSubmitting} 
            className="w-full"
            icon={<SquareAsterisk className="w-4 h-4" />}
          />
        </Field>
        {errors.root && <p className="text-red-500">{errors.root.message}</p>}
        <Link href="/login" className="underline text-center text-blue-900">Back to Login</Link>
      </FieldGroup>
    </form>
    </FormProvider>
  )
}
