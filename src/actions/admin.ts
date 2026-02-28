/**
 * actions/admin.ts - RE-EXPORT BRIDGE (transitional)
 * All functions have been migrated to their respective feature modules.
 * This file will be removed once all imports are updated.
 */
"use server";

// Rewards
export { createReward, updateReward, deleteReward, getRewards } from "@/features/admin/rewards/actions/admin-rewards";

// Codes
export { generateCodes, deleteBatch, getCodes, getCodeBatches } from "@/features/admin/codes/actions/admin-codes";

// Clients
export { getClients, getClientById, deleteClient, blockClient, unblockClient, searchRedemptionTicket, getClientMovements } from "@/features/admin/clients/actions/admin-clients";

// Settings
export { getSettings, updateSetting, dangerZoneReset } from "@/features/admin/settings/actions/admin-settings";

// Integrations
export { getWebhookEvents, updateWebhookEvent } from "@/features/admin/integrations/actions";

// Notifications
export { sendCustomNotification, getAdminNotifications, getAdminUnreadCount, markAdminNotificationsAsRead } from "@/features/admin/notifications/actions/admin-notifications";

// Redemptions
export { getPendingRedemptions, approveRedemption, rejectRedemption } from "@/features/admin/redemptions/actions/admin-redemptions";

// Profile
export { updateAdminProfile, getAdminProfile } from "@/features/admin/profile/actions/admin-profile";
