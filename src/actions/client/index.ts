/**
 * actions/client/index.ts - RE-EXPORT BRIDGE (transitional)
 * All functions have been migrated to their respective feature modules.
 * This file will be removed once all imports are updated.
 */
"use server";

// Auth
export { checkFieldAvailability, getPublicSettings, requestOtp, verifyOtp, loginClient, registerClient, getAvailableAvatars } from "@/features/auth/actions/client-auth";

// Profile
export { applyReferralCode, getClientProfile, updateClientProfile, logoutClient, deleteMyAccount } from "@/features/client/profile/actions/client-profile";

// Notifications
export { getUnreadNotificationsCount, getAppNotifications, markNotificationsAsRead } from "@/features/client/notifications/actions/client-notifications";

// Scan
export { validateCode, redeemCode } from "@/features/client/scan/actions/client-scan";

// Rewards
export { getAvailableRewards, requestRedemption, getMyRedemptions } from "@/features/client/rewards/actions/client-rewards";
