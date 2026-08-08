import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { LoginResponse, OTPResponse, SignUpResponse, User } from "@/types/auth/auth"
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
    signup: (data: SignUpFormSchema) => Promise<SignUpResponse>;
    logout: () => Promise<void>;
    logoutExpiration: () => Promise<void>;
    fetchUser: () => Promise<void>;
    verifyOtp: (data: OTPFormSchema)=> Promise<OTPResponse>;
    resendOtp: ()=> Promise<OTPResponse>;
    resetPassword: (data: PasswordSchema )=> Promise<SignUpResponse>; //This is similar to signUp response Data structure
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
            const userData = response.data?.user;
            return {
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                multipleBusinesses: response.data?.multipleBusinesses,
                businesses: response.data?.multipleBusinesses,
                businessesSlug: userData?.businessSlug,
                shopSlug: userData?.shopSlug,
            } as LoginResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as LoginResponse;   
                console.log("Login error: ", error);
                return {
                        success: response?.success || false,
                        isVerified: response?.isVerified,
                        redirectTo: response?.redirectTo,
                        error: response?.error,
                        requiresPasswordChange: response?.requiresPasswordChange,
                        status: error.response?.status || 500
                    } as LoginResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as LoginResponse;
        }
    }, 
    
    signup: async(data) => {
        try {
            const response = await apiClient.post("/auth/signup", data) ;
            return {
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                message: response.data?.message
            } as SignUpResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as SignUpResponse;   
                console.log("Registration error: ", error);
                return {
                        success: response?.success || false,
                        redirectTo: response?.redirectTo,
                        error: response?.error,
                        status: error.response?.status || 500
                    } as SignUpResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as SignUpResponse;
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
            return {
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                message: response.data?.message
            } as SignUpResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as SignUpResponse;   
                console.log("Password reset error: ", error);
                return {
                        success: response?.success || false,
                        error: response?.error,
                        status: error.response?.status || 500
                    } as SignUpResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as SignUpResponse;
        }
    },    
}));