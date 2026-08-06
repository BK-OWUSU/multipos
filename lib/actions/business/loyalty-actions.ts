"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { ConfigFormValues, RewardFormValues, TierFormValues } from "@/types/schema/loyalty.schema";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { LoyaltyService } from "@/lib/services/business/LoyaltyService";


export async function saveLoyaltyConfigurationAction(payload: ConfigFormValues) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await LoyaltyService.saveConfiguration(payload, userId, businessId, ipAddress)

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}


export async function createLoyaltyRewardAction(payload: RewardFormValues) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await LoyaltyService.createReward(payload, userId, businessId, ipAddress)

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}

export async function updateLoyaltyRewardAction(rewardId: string, payload: RewardFormValues) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await LoyaltyService.updateReward(rewardId, payload, userId, businessId, ipAddress)

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}


export async function createLoyaltyTierAction(payload: TierFormValues) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await LoyaltyService.createTier(payload, userId, businessId, ipAddress)

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}


export async function updateLoyaltyTierAction(tierId: string, payload: TierFormValues) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await LoyaltyService.updateTier(tierId, payload, userId, businessId, ipAddress)

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}

