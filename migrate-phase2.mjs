/**
 * migrate-phase2.mjs
 * Fase 2: Desmantelar los archivos monolíticos actions/admin.ts y actions/client/index.ts
 *
 * Estrategia:
 * 1. Los módulos destino en features/ ya tienen sus funciones ACTUALIZADAS (V2).
 *    Solo necesitamos crear los módulos NUEVOS que no existen.
 * 2. Reemplazar los monolíticos con archivos de re-export puente.
 * 3. Actualizar TODOS los imports directos al módulo correspondiente.
 * 4. Eliminar los re-exports puente (ya innecesarios).
 *
 * Uso: node migrate-phase2.mjs
 */

import { readFile, writeFile, readdir, mkdir, stat, unlink, rmdir } from "fs/promises";
import { join, resolve, relative } from "path";

const SRC = resolve("src");

// ============================================================
// STEP 1: Create NEW module files that don't exist yet
// (Functions extracted from the monolithic files)
// ============================================================

const NEW_FILES = [
    // ─── admin/codes/actions ───
    {
        path: "features/admin/codes/actions/admin-codes.ts",
        extractFrom: "actions/admin.ts",
        functions: ["generateCodes", "deleteBatch", "getCodes", "getCodeBatches"],
        lineRanges: [[218, 266], [268, 313], [315, 342], [344, 355]],
    },
    // ─── admin/profile/actions ───
    {
        path: "features/admin/profile/actions/admin-profile.ts",
        extractFrom: "actions/admin.ts",
        functions: ["updateAdminProfile", "getAdminProfile"],
        lineRanges: [[809, 832], [834, 842]],
    },
    // ─── admin/notifications (ADD to existing) ───
    {
        path: "features/admin/notifications/actions/admin-notifications.ts",
        appendTo: true,
        extractFrom: "actions/admin.ts",
        functions: ["getAdminNotifications", "getAdminUnreadCount", "markAdminNotificationsAsRead"],
        lineRanges: [[848, 856], [858, 870], [872, 884]],
    },
    // ─── client auth ───
    {
        path: "features/auth/actions/client-auth.ts",
        extractFrom: "actions/client/index.ts",
        functions: ["checkFieldAvailability", "getPublicSettings", "requestOtp", "verifyOtp", "loginClient", "registerClient", "getAvailableAvatars"],
        // Includes OTP stores + constants (lines 82-98) before requestOtp
        lineRanges: [[28, 72], [79, 81], [83, 347], [348, 408], [409, 621], [1326, 1339]],
    },
    // ─── client profile ───
    {
        path: "features/client/profile/actions/client-profile.ts",
        extractFrom: "actions/client/index.ts",
        functions: ["applyReferralCode", "getClientProfile", "updateClientProfile", "logoutClient", "deleteMyAccount"],
        lineRanges: [[623, 672], [675, 760], [762, 858], [924, 930], [932, 976]],
    },
    // ─── client notifications ───
    {
        path: "features/client/notifications/actions/client-notifications.ts",
        extractFrom: "actions/client/index.ts",
        functions: ["getUnreadNotificationsCount", "getAppNotifications", "markNotificationsAsRead"],
        lineRanges: [[860, 884], [886, 900], [902, 922]],
    },
    // ─── client scan ───
    {
        path: "features/client/scan/actions/client-scan.ts",
        extractFrom: "actions/client/index.ts",
        functions: ["validateCode", "redeemCode"],
        lineRanges: [[978, 1016], [1018, 1177]],
    },
    // ─── client rewards ───
    {
        path: "features/client/rewards/actions/client-rewards.ts",
        extractFrom: "actions/client/index.ts",
        functions: ["getAvailableRewards", "requestRedemption", "getMyRedemptions"],
        lineRanges: [[1179, 1194], [1196, 1296], [1298, 1324]],
    },
];

async function extractFunctions() {
    console.log("\n📝 Creating new module files...\n");

    // Read monolithic sources
    const adminSrc = await readFile(join(SRC, "actions/admin.ts"), "utf-8");
    const clientSrc = await readFile(join(SRC, "actions/client/index.ts"), "utf-8");

    const adminLines = adminSrc.split("\n");
    const clientLines = clientSrc.split("\n");

    for (const entry of NEW_FILES) {
        const targetPath = join(SRC, entry.path);
        const sourceLines = entry.extractFrom.includes("admin") ? adminLines : clientLines;

        // Extract the function bodies
        let extractedCode = "";
        for (const [start, end] of entry.lineRanges) {
            const chunk = sourceLines.slice(start - 1, end).join("\n");
            extractedCode += chunk + "\n\n";
        }

        // Detect needed imports by scanning the extracted code
        const imports = detectImports(extractedCode, entry.extractFrom);

        if (entry.appendTo) {
            // Append to existing file
            const existing = await readFile(targetPath, "utf-8");
            // Add new imports that aren't already in the file
            const newImports = filterExistingImports(imports, existing);
            let appendContent = "\n// ============================================\n";
            appendContent += "// ADMIN NOTIFICATIONS (migrated from monolithic)\n";
            appendContent += "// ============================================\n\n";
            appendContent += extractedCode;

            // Add missing imports to the top
            if (newImports.length > 0) {
                const importInsertions = newImports.join("\n");
                // Find the last import line in the existing file
                const existingLines = existing.split("\n");
                let lastImportIdx = 0;
                for (let i = 0; i < existingLines.length; i++) {
                    if (existingLines[i].startsWith("import ")) {
                        lastImportIdx = i;
                    }
                }
                existingLines.splice(lastImportIdx + 1, 0, importInsertions);
                await writeFile(targetPath, existingLines.join("\n") + appendContent, "utf-8");
            } else {
                await writeFile(targetPath, existing + appendContent, "utf-8");
            }

            console.log(`  📎 APPENDED to ${entry.path} (+${entry.functions.length} functions)`);
        } else {
            // Create new file
            await mkdir(join(SRC, entry.path, ".."), { recursive: true });

            const fileContent = `"use server";\n\n${imports.join("\n")}\n\n${extractedCode}`;
            await writeFile(targetPath, fileContent, "utf-8");
            console.log(`  ✅ CREATED ${entry.path} (${entry.functions.length} functions)`);
        }
    }
}

function detectImports(code, source) {
    const imports = new Set();

    // DB
    if (code.includes("db.") || code.includes("db\n") || code.includes("await db")) {
        imports.add('import { db } from "@/db";');
    }

    // Schema tables
    const schemaItems = [];
    const tables = [
        "clients", "codes", "rewards", "redemptions", "nameChangesHistory",
        "appNotifications", "adminNotifications", "webhookEvents", "admins",
        "referralHistory", "pointTransactions"
    ];
    for (const table of tables) {
        // Check for table usage: table.field or from(table)
        const regex = new RegExp(`\\b${table}\\b`);
        if (regex.test(code)) {
            schemaItems.push(table);
        }
    }
    if (schemaItems.length > 0) {
        imports.add(`import { ${schemaItems.join(", ")} } from "@/db/schema";`);
    }

    // drizzle-orm operators
    const ormOps = [];
    const opsToCheck = ["eq", "sql", "and", "like", "notLike", "inArray", "isNull", "gte", "lte", "desc"];
    for (const op of opsToCheck) {
        const regex = new RegExp(`\\b${op}\\b\\(`);
        if (regex.test(code)) {
            ormOps.push(op);
        }
    }
    if (ormOps.length > 0) {
        imports.add(`import { ${ormOps.join(", ")} } from "drizzle-orm";`);
    }

    // next/cache
    if (code.includes("revalidatePath")) {
        imports.add('import { revalidatePath } from "next/cache";');
    }

    // Auth
    if (code.includes("requireAdminSession")) {
        imports.add('import { requireAdminSession } from "@/lib/auth/require-admin";');
    }
    if (code.includes("getClientSession") || code.includes("destroyClientSession") || code.includes("createClientSession")) {
        const sessionFns = [];
        if (code.includes("createClientSession")) sessionFns.push("createClientSession");
        if (code.includes("getClientSession")) sessionFns.push("getClientSession");
        if (code.includes("destroyClientSession")) sessionFns.push("destroyClientSession");
        if (code.includes("createRegistrationToken")) sessionFns.push("createRegistrationToken");
        if (code.includes("verifyRegistrationToken")) sessionFns.push("verifyRegistrationToken");
        if (code.includes("destroyRegistrationToken")) sessionFns.push("destroyRegistrationToken");
        imports.add(`import { ${sessionFns.join(", ")} } from "@/lib/auth/client-jwt";`);
    }

    // Utilities
    if (code.includes("triggerWebhook")) {
        imports.add('import { triggerWebhook } from "@/lib/webhook";');
    }
    if (code.includes("eventBus")) {
        imports.add('import { eventBus } from "@/lib/events";');
    }
    if (code.includes("randomBytes")) {
        imports.add('import { randomBytes } from "crypto";');
    }
    if (code.includes("randomUUID")) {
        imports.add('import { randomUUID } from "crypto";');
    }
    if (code.includes("bcrypt")) {
        imports.add('import bcrypt from "bcryptjs";');
    }
    if (code.includes("readdir")) {
        imports.add('import { readdir } from "fs/promises";');
    }
    if (code.includes("join(")) {
        imports.add('import { join } from "path";');
    }
    if (code.includes("processReferral")) {
        imports.add('import { processReferral } from "@/features/client/referrals/actions/client-referrals-logic";');
    }

    return Array.from(imports);
}

function filterExistingImports(newImports, existingContent) {
    return newImports.filter(imp => {
        // Check if the main module is already imported
        const moduleMatch = imp.match(/from ["']([^"']+)["']/);
        if (moduleMatch && existingContent.includes(moduleMatch[1])) {
            return false;
        }
        return true;
    });
}

// ============================================================
// STEP 2: Replace monolithics with re-export bridges
// ============================================================

const ADMIN_REEXPORT = `/**
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
`;

const CLIENT_REEXPORT = `/**
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
`;

// ============================================================
// STEP 3: Import rewrite map (from @/actions/* → direct module)
// ============================================================

// Each entry: [old import source, function name, new import source]
const IMPORT_REWRITES = [
    // ── @/actions/admin → specific modules ──
    // Rewards
    { fn: "createReward", old: "@/actions/admin", new: "@/features/admin/rewards/actions/admin-rewards" },
    { fn: "updateReward", old: "@/actions/admin", new: "@/features/admin/rewards/actions/admin-rewards" },
    { fn: "deleteReward", old: "@/actions/admin", new: "@/features/admin/rewards/actions/admin-rewards" },
    { fn: "getRewards", old: "@/actions/admin", new: "@/features/admin/rewards/actions/admin-rewards" },
    // Codes
    { fn: "generateCodes", old: "@/actions/admin", new: "@/features/admin/codes/actions/admin-codes" },
    { fn: "deleteBatch", old: "@/actions/admin", new: "@/features/admin/codes/actions/admin-codes" },
    { fn: "getCodes", old: "@/actions/admin", new: "@/features/admin/codes/actions/admin-codes" },
    { fn: "getCodeBatches", old: "@/actions/admin", new: "@/features/admin/codes/actions/admin-codes" },
    // Clients
    { fn: "getClients", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "getClientById", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "deleteClient", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "blockClient", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "unblockClient", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "searchRedemptionTicket", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    { fn: "getClientMovements", old: "@/actions/admin", new: "@/features/admin/clients/actions/admin-clients" },
    // Settings
    { fn: "getSettings", old: "@/actions/admin", new: "@/features/admin/settings/actions/admin-settings" },
    { fn: "updateSetting", old: "@/actions/admin", new: "@/features/admin/settings/actions/admin-settings" },
    { fn: "dangerZoneReset", old: "@/actions/admin", new: "@/features/admin/settings/actions/admin-settings" },
    // Integrations (already in module, but some files still import from monolithic)
    { fn: "getWebhookEvents", old: "@/actions/admin", new: "@/features/admin/integrations/actions" },
    { fn: "updateWebhookEvent", old: "@/actions/admin", new: "@/features/admin/integrations/actions" },
    // Notifications
    { fn: "sendCustomNotification", old: "@/actions/admin", new: "@/features/admin/notifications/actions/admin-notifications" },
    { fn: "getAdminNotifications", old: "@/actions/admin", new: "@/features/admin/notifications/actions/admin-notifications" },
    { fn: "getAdminUnreadCount", old: "@/actions/admin", new: "@/features/admin/notifications/actions/admin-notifications" },
    { fn: "markAdminNotificationsAsRead", old: "@/actions/admin", new: "@/features/admin/notifications/actions/admin-notifications" },
    // Redemptions
    { fn: "getPendingRedemptions", old: "@/actions/admin", new: "@/features/admin/redemptions/actions/admin-redemptions" },
    { fn: "approveRedemption", old: "@/actions/admin", new: "@/features/admin/redemptions/actions/admin-redemptions" },
    { fn: "rejectRedemption", old: "@/actions/admin", new: "@/features/admin/redemptions/actions/admin-redemptions" },
    // Profile
    { fn: "updateAdminProfile", old: "@/actions/admin", new: "@/features/admin/profile/actions/admin-profile" },
    { fn: "getAdminProfile", old: "@/actions/admin", new: "@/features/admin/profile/actions/admin-profile" },

    // ── @/actions/client → specific modules ──
    // Auth
    { fn: "checkFieldAvailability", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "getPublicSettings", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "requestOtp", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "verifyOtp", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "loginClient", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "registerClient", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    { fn: "getAvailableAvatars", old: "@/actions/client", new: "@/features/auth/actions/client-auth" },
    // Profile
    { fn: "applyReferralCode", old: "@/actions/client", new: "@/features/client/profile/actions/client-profile" },
    { fn: "getClientProfile", old: "@/actions/client", new: "@/features/client/profile/actions/client-profile" },
    { fn: "updateClientProfile", old: "@/actions/client", new: "@/features/client/profile/actions/client-profile" },
    { fn: "logoutClient", old: "@/actions/client", new: "@/features/client/profile/actions/client-profile" },
    { fn: "deleteMyAccount", old: "@/actions/client", new: "@/features/client/profile/actions/client-profile" },
    // Notifications
    { fn: "getUnreadNotificationsCount", old: "@/actions/client", new: "@/features/client/notifications/actions/client-notifications" },
    { fn: "getAppNotifications", old: "@/actions/client", new: "@/features/client/notifications/actions/client-notifications" },
    { fn: "markNotificationsAsRead", old: "@/actions/client", new: "@/features/client/notifications/actions/client-notifications" },
    // Scan
    { fn: "validateCode", old: "@/actions/client", new: "@/features/client/scan/actions/client-scan" },
    { fn: "redeemCode", old: "@/actions/client", new: "@/features/client/scan/actions/client-scan" },
    // Rewards
    { fn: "getAvailableRewards", old: "@/actions/client", new: "@/features/client/rewards/actions/client-rewards" },
    { fn: "requestRedemption", old: "@/actions/client", new: "@/features/client/rewards/actions/client-rewards" },
    { fn: "getMyRedemptions", old: "@/actions/client", new: "@/features/client/rewards/actions/client-rewards" },
];

// ============================================================
// STEP 3 Implementation: Rewrite all imports
// ============================================================

async function getAllSourceFiles(dir) {
    const results = [];
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return results; }
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
            results.push(...await getAllSourceFiles(fullPath));
        } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Parse an import line like:
 * import { foo, bar } from "@/actions/admin";
 * Returns { names: ["foo", "bar"], source: "@/actions/admin", fullLine: "..." }
 */
function parseImportLine(line) {
    const match = line.match(/^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']\s*;?\s*(\/\/.*)?$/);
    if (!match) return null;
    const names = match[1].split(",").map(n => n.trim()).filter(Boolean);
    return { names, source: match[2], comment: match[3] || "", fullLine: line };
}

async function rewriteImports() {
    console.log("\n🔄 Rewriting imports from monolithic to modules...\n");

    const allFiles = await getAllSourceFiles(SRC);
    let filesChanged = 0;
    let totalRewrites = 0;

    for (const filePath of allFiles) {
        // Skip the monolithic files themselves and the new module files
        const relPath = relative(SRC, filePath).replace(/\\/g, "/");
        if (relPath === "actions/admin.ts" || relPath === "actions/client/index.ts") continue;

        let content;
        try { content = await readFile(filePath, "utf-8"); } catch { continue; }

        // Check if this file imports from the monolithic sources
        if (!content.includes("@/actions/admin") && !content.includes("@/actions/client")) continue;

        const lines = content.split("\n");
        const newLines = [];
        let fileRewrites = 0;

        for (const line of lines) {
            const parsed = parseImportLine(line.trim());

            if (!parsed || (parsed.source !== "@/actions/admin" && parsed.source !== "@/actions/client")) {
                newLines.push(line);
                continue;
            }

            // Group the imported names by their new destination module
            const groups = {};
            const unknowns = [];

            for (const name of parsed.names) {
                const rewrite = IMPORT_REWRITES.find(r => r.fn === name && r.old === parsed.source);
                if (rewrite) {
                    if (!groups[rewrite.new]) groups[rewrite.new] = [];
                    groups[rewrite.new].push(name);
                } else {
                    unknowns.push(name);
                }
            }

            // Generate new import lines
            const leadingWhitespace = line.match(/^(\s*)/)[1];
            for (const [newSource, names] of Object.entries(groups)) {
                newLines.push(`${leadingWhitespace}import { ${names.join(", ")} } from "${newSource}";`);
                fileRewrites++;
            }

            // Keep any unknown imports pointing to the original source
            if (unknowns.length > 0) {
                newLines.push(`${leadingWhitespace}import { ${unknowns.join(", ")} } from "${parsed.source}"; // TODO: migrate`);
            }
        }

        if (fileRewrites > 0) {
            await writeFile(filePath, newLines.join("\n"), "utf-8");
            console.log(`  📝 ${relPath} (${fileRewrites} import(s) rewritten)`);
            filesChanged++;
            totalRewrites += fileRewrites;
        }
    }

    console.log(`\n🔄 Rewrote ${totalRewrites} imports across ${filesChanged} files.\n`);
}

// ============================================================
// STEP 4: Replace monolithic files with re-export bridges
// ============================================================
async function replaceMonolithics() {
    console.log("🔄 Replacing monolithic files with re-export bridges...\n");

    await writeFile(join(SRC, "actions/admin.ts"), ADMIN_REEXPORT, "utf-8");
    console.log("  ✅ actions/admin.ts → re-export bridge");

    await writeFile(join(SRC, "actions/client/index.ts"), CLIENT_REEXPORT, "utf-8");
    console.log("  ✅ actions/client/index.ts → re-export bridge");
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log("═══════════════════════════════════════════════");
    console.log("  Phase 2: Dismantle Monolithic Action Files   ");
    console.log("═══════════════════════════════════════════════");

    // Step 1: Extract functions into new module files
    await extractFunctions();

    // Step 2: Rewrite all imports from @/actions/* → direct modules
    await rewriteImports();

    // Step 3: Replace monolithics with bridges (safety net)
    await replaceMonolithics();

    console.log("\n═══════════════════════════════════════════════");
    console.log("  ✅ Phase 2 complete!                         ");
    console.log("  Next: run 'npm run build' to verify.         ");
    console.log("═══════════════════════════════════════════════\n");
}

main().catch(e => {
    console.error("\n❌ Phase 2 failed:", e);
    process.exit(1);
});
