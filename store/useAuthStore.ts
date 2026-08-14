import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { LoginResponse, OTPResponse, AppResponse, User } from "@/types/auth/auth"
import { LoginSchema, OTPFormSchema, PasswordSchema, SignUpFormSchema } from "@/types/schema/auth.schema";
import { AxiosError } from "axios";
import { toast } from "sonner";

type AuthStore = {
    user: User| null;
    currentSlug: string | null;
    shopSlug: string | null;
    loading: boolean;
    isLoggedIn: boolean;
    login: (data: LoginSchema)=> Promise<LoginResponse>;
    signup: (data: SignUpFormSchema) => Promise<AppResponse>;
    logout: () => Promise<void>;
    logoutExpiration: () => Promise<void>;
    fetchUser: () => Promise<void>;
    verifyOtp: (data: OTPFormSchema)=> Promise<OTPResponse>;
    resendOtp: ()=> Promise<OTPResponse>;
    resetPassword: (data: PasswordSchema )=> Promise<AppResponse>; //This is similar to signUp response Data structure
}

export const useAuthStore = create<AuthStore>((set, get)=>({
    user: null,
    loading: false,
    currentSlug: null,
    shopSlug: null,
    isLoggedIn: false,

    fetchUser: async() => {
        try {
            set({loading: true})
            const response = await apiClient.get("/auth/me");
            const userData = response.data.user as User;

            set({
                user: userData,
                currentSlug: response.data.user.business.slug || null,
                shopSlug: userData.currentShop?.shopSlug || null,
                isLoggedIn: true,
                loading: false
            });
        
        } catch (error) {
            console.log("Error fetching user: ", error);
            set({user: null, isLoggedIn: false, loading: false})
        }
    },

    login: async(data) => {
        try {
            const response = await apiClient.post("/auth/login", data);
            //Hydrate user data in the store after successful login
            await get().fetchUser();
            const res = response.data as LoginResponse;
            console.log(res)
            return res;
        } catch (error: unknown) {
            console.log("Registration error: ", error);
            const errMsg = (error as Error).message || "Network error. Please try again.";
            return {
            success: false,
            error:errMsg ,
            status: 500
        } as LoginResponse;
        }
    },  
    // login: async(data) => {
    //     try {
    //         const response = await apiClient.post("/auth/login", data);
    //         console.log("Hello")
    //         console.log(response)
    //         //Hydrate user data in the store after successful login
    //         await get().fetchUser();
    //         const userData = response.data?.user;
    //         return {
    //             success: response.data?.success,
    //             redirectTo: response.data?.redirectTo,
    //             status: response?.status,
    //             multipleBusinesses: response.data?.multipleBusinesses,
    //             businesses: response.data?.multipleBusinesses,
    //             businessesSlug: userData?.businessSlug,
    //             shopSlug: userData?.shopSlug,
    //         } as LoginResponse;
    //     } catch (error: unknown) {
    //         if(error instanceof AxiosError) {
    //             const response = error.response?.data;   
    //             const res = response?.data  as LoginResponse; 
    //             console.log("Hello - 2")
    //             console.log(res)
    //             console.log("Login error: ", error);
                
    //             return {
    //                     success: response?.success || false,
    //                     isVerified: response?.isVerified,
    //                     redirectTo: response?.redirectTo,
    //                     error: response?.error,
    //                     requiresPasswordChange: response?.requiresPasswordChange,
    //                     status: error.response?.status || 500
    //                 } as LoginResponse;
    //         }
    //         return {
    //         success: false,
    //         error: "Network error. Please try again.",
    //         status: 500
    //     } as LoginResponse;
    //     }
    // }, 
    
    signup: async(data) => {
        try {
            const response = await apiClient.post("/auth/signup", data) ;
            const res = response.data as AppResponse;
            return res;
        } catch (error: unknown) {
            console.log("Registration error: ", error);
            const errMsg = (error as Error).message || "Registration error";
            return { success: false, error: errMsg } as AppResponse
        }
    },

    logout: async() => {
        try {
            const response =  await apiClient.post("/auth/logout");
            set({user: null, isLoggedIn: false, currentSlug: null, shopSlug: null})
            if (response.data?.success) {
                toast.success("Logged out successfully!");
                window.location.href = "/login"; // Redirect to login page after logout
            }
        } catch (error) {
            console.log("Error during logout: ", error);
        }
    },

    logoutExpiration: async() => {
        try {
            const response =  await apiClient.post("/auth/logout-expiration");
            set({user: null, isLoggedIn: false, currentSlug: null, shopSlug: null})
            if (response.data?.success) {
                toast.success("Logged out successfully!");
            }
        } catch (error) {
            console.log("Error during logout: ", error);
        }
    },

    verifyOtp: async (data) => {
        try {
            const result =  await apiClient.post("/auth/verify-otp", {code: data.pin});
            const response = result.data as OTPResponse;
            console.log(response)
            if (response.message) {
                toast.success(response.message);
            }
            return {
                success: response.success,
                message: response.message,
                businessesSlug: response.businessesSlug,
                requiresPasswordChange: response.requiresPasswordChange,
                redirectTo: response.redirectTo,
                status: response.status,
            } as OTPResponse;
        } catch (error) {
             if(error instanceof AxiosError) {
                const response = error.response?.data as OTPResponse;   
                console.log("Verify OTP error: ", error);
                return {
                    success: response?.success || false,
                    error: response?.error,
                    requiresPasswordChange: response?.requiresPasswordChange,
                    status: error.response?.status || 500
                } as OTPResponse;
             }
            return {
                success: false,
                error: "Network error. Please try again.",
                status: 500
            } as OTPResponse
        }
    },

    resendOtp: async () => {
        try {
            const response =  await apiClient.post("/auth/resend-otp") ;
            return {
                success: response.data?.success,
                message: response.data?.message,
                status: response.status,
            } as OTPResponse;
        } catch (error) {
             if(error instanceof AxiosError) {
                const response = error.response?.data as OTPResponse;   
                console.log("Resend OPT error: ", error);
                return {
                    success: response?.success || false,
                    error: response?.error,
                    requiresPasswordChange: response?.requiresPasswordChange,
                    redirectTo: response?.redirectTo,
                    status: error.response?.status || 500
                } as OTPResponse;
             }
            return {
                success: false,
                error: "Network error. Please try again.",
                status: 500
            } as OTPResponse
        }
    },

 resetPassword: async(data) => {
        try {
            const response = await apiClient.post("/auth/reset-password", data) ;
            const res = response.data as AppResponse;
            return { res } as AppResponse;
        } catch (error: unknown) {
            console.log("Password reset error: ", error);
            const errMsg = (error as Error).message || "Password reset error";;   
            return {error: errMsg, success: false}
        }
    },    
}));