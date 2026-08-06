"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";

import { NotificationService } from "@/lib/services/business/notification-service";



export async function markSingleAsReadAction(notificationId: string) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }


    // We get the current user's details from the session
    const {  businessId, employeeId } = session;

    const response = await NotificationService.markAsRead(businessId, notificationId, employeeId || "");

    if (response.success) {       
        revalidatePath(`/notifications`, 'layout');
        return {message: response.message, success:response.success, data: response.data, meta: response.meta};
    }else {
        return {error: response.error, success: response.success};
    }
}

export async function toggleReadAction(notificationId: string) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }


    // We get the current user's details from the session
    const {  businessId, employeeId } = session;

    const response = await NotificationService.toggleRead(businessId, notificationId, employeeId || "");

    if (response.success) {       
        revalidatePath(`/notifications`, 'layout');
        return {message: response.message, success:response.success, data: response.data, meta: response.meta};
    }else {
        return {error: response.error, success: response.success};
    }
}

export async function markAllAsReadAction() {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }


    // We get the current user's details from the session
    const {  businessId, employeeId } = session;

    const response = await NotificationService.markAllAsRead(businessId, employeeId || "");

    if (response.success) {       
        revalidatePath(`/notifications`, 'layout');
        return {message: response.message, success:response.success, data: response.data, meta: response.meta};
    }else {
        return {error: response.error, success: response.success};
    }
}
