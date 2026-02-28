/**
 * migrate-architecture.mjs
 * Script de migración automática de la arquitectura del proyecto.
 * 
 * MOVER archivos a la nueva estructura features/admin/ y features/client/
 * y actualizar TODAS las referencias de importación automáticamente.
 * 
 * Uso: node migrate-architecture.mjs
 * 
 * NOTA: Hacer git push ANTES de ejecutar.
 */

import { readdir, readFile, writeFile, mkdir, rename, stat, cp } from "fs/promises";
import { join, dirname, relative, resolve, sep, posix } from "path";

const SRC = resolve("src");

// ============================================================
// 1. MAPA DE MOVIMIENTOS
//    Formato: [ruta vieja relativa a src/, ruta nueva relativa a src/]
//    NO se elimina nada, solo se mueve.
// ============================================================
const MOVES = [
    // --------------------------------------------------------
    // A. features/clients/ → separar en admin vs client
    // --------------------------------------------------------

    // Admin-only components (quedan en features/admin/clients/)
    ["features/clients/components/stats-cards.tsx", "features/admin/clients/components/stats-cards.tsx"],
    ["features/clients/components/directory-tab.tsx", "features/admin/clients/components/directory-tab.tsx"],
    ["features/clients/components/pending-tab.tsx", "features/admin/clients/components/pending-tab.tsx"],
    ["features/clients/components/checker-tab.tsx", "features/admin/clients/components/checker-tab.tsx"],
    ["features/clients/components/client-detail-modal.tsx", "features/admin/clients/components/client-detail-modal.tsx"],
    ["features/clients/components/clients-directory-modal.tsx", "features/admin/clients/components/clients-directory-modal.tsx"],
    ["features/clients/components/pending-modal.tsx", "features/admin/clients/components/pending-modal.tsx"],
    ["features/clients/components/checker-modal.tsx", "features/admin/clients/components/checker-modal.tsx"],
    ["features/clients/components/block-client-alert.tsx", "features/admin/clients/components/block-client-alert.tsx"],
    ["features/clients/components/delete-client-alert.tsx", "features/admin/clients/components/delete-client-alert.tsx"],
    ["features/clients/components/reject-redemption-modal.tsx", "features/admin/clients/components/reject-redemption-modal.tsx"],

    // Admin-only actions (quedan en features/admin/clients/)
    ["features/clients/actions/admin-clients.ts", "features/admin/clients/actions/admin-clients.ts"],

    // Client-side components (van a features/client/)
    ["features/clients/components/home/client-auth-notice.tsx", "features/client/home/components/client-auth-notice.tsx"],
    ["features/clients/components/home/client-loyalty-card.tsx", "features/client/home/components/client-loyalty-card.tsx"],
    ["features/clients/components/home/client-pending-redemptions.tsx", "features/client/home/components/client-pending-redemptions.tsx"],
    ["features/clients/components/home/client-quick-actions.tsx", "features/client/home/components/client-quick-actions.tsx"],
    ["features/clients/components/notifications/notifications-client.tsx", "features/client/notifications/components/notifications-client.tsx"],
    ["features/clients/components/profile/profile-client.tsx", "features/client/profile/components/profile-client.tsx"],
    ["features/clients/components/rewards/rewards-page-client.tsx", "features/client/rewards/components/rewards-page-client.tsx"],
    ["features/clients/components/rewards/rewards-view.tsx", "features/client/rewards/components/rewards-view.tsx"],
    ["features/clients/components/scan/scan-client.tsx", "features/client/scan/components/scan-client.tsx"],

    // --------------------------------------------------------
    // B. features/* que son puramente admin → features/admin/*
    // --------------------------------------------------------

    // campaigns (admin-only)
    ["features/campaigns/actions/admin-campaigns.ts", "features/admin/campaigns/actions/admin-campaigns.ts"],
    ["features/campaigns/components/assign-group-modal.tsx", "features/admin/campaigns/components/assign-group-modal.tsx"],
    ["features/campaigns/components/audience-tab.tsx", "features/admin/campaigns/components/audience-tab.tsx"],
    ["features/campaigns/components/campaign-creator-modal.tsx", "features/admin/campaigns/components/campaign-creator-modal.tsx"],
    ["features/campaigns/components/client-detail-drawer.tsx", "features/admin/campaigns/components/client-detail-drawer.tsx"],
    ["features/campaigns/components/groups-modal.tsx", "features/admin/campaigns/components/groups-modal.tsx"],
    ["features/campaigns/components/history-tab.tsx", "features/admin/campaigns/components/history-tab.tsx"],
    ["features/campaigns/components/stats-cards.tsx", "features/admin/campaigns/components/stats-cards.tsx"],

    // codes (admin-only)
    ["features/codes/components/batch-card.tsx", "features/admin/codes/components/batch-card.tsx"],
    ["features/codes/components/delete-batch-alert.tsx", "features/admin/codes/components/delete-batch-alert.tsx"],
    ["features/codes/components/generate-codes-modal.tsx", "features/admin/codes/components/generate-codes-modal.tsx"],
    ["features/codes/components/view-batch-modal.tsx", "features/admin/codes/components/view-batch-modal.tsx"],

    // dashboard (admin-only)
    ["features/dashboard/actions.ts", "features/admin/dashboard/actions.ts"],

    // integrations (mixed: admin components + 1 client component)
    ["features/integrations/actions.ts", "features/admin/integrations/actions.ts"],
    ["features/integrations/components/typebot-section.tsx", "features/admin/integrations/components/typebot-section.tsx"],
    ["features/integrations/components/webhook-docs-modal.tsx", "features/admin/integrations/components/webhook-docs-modal.tsx"],
    ["features/integrations/components/webhook-events-list.tsx", "features/admin/integrations/components/webhook-events-list.tsx"],
    ["features/integrations/components/webhook-urls-section.tsx", "features/admin/integrations/components/webhook-urls-section.tsx"],
    // client-typebot goes to client
    ["features/integrations/components/client-typebot.tsx", "features/client/integrations/components/client-typebot.tsx"],

    // notifications (admin action only; client component → client)
    ["features/notifications/actions/admin-notifications.ts", "features/admin/notifications/actions/admin-notifications.ts"],
    ["features/notifications/components/client-notification-bell.tsx", "features/client/notifications/components/client-notification-bell.tsx"],

    // redemptions (admin-only)
    ["features/redemptions/actions/admin-redemptions.ts", "features/admin/redemptions/actions/admin-redemptions.ts"],

    // referrals (admin actions + components, plus 1 client action)
    ["features/referrals/actions/admin-referrals.ts", "features/admin/referrals/actions/admin-referrals.ts"],
    ["features/referrals/components/referral-config-tab.tsx", "features/admin/referrals/components/referral-config-tab.tsx"],
    ["features/referrals/components/referral-history-tab.tsx", "features/admin/referrals/components/referral-history-tab.tsx"],
    ["features/referrals/components/referral-message-tab.tsx", "features/admin/referrals/components/referral-message-tab.tsx"],
    // client referral logic
    ["features/referrals/actions/client-referrals-logic.ts", "features/client/referrals/actions/client-referrals-logic.ts"],

    // rewards (admin-only)
    ["features/rewards/actions/admin-rewards.ts", "features/admin/rewards/actions/admin-rewards.ts"],
    ["features/rewards/components/reward-card.tsx", "features/admin/rewards/components/reward-card.tsx"],
    ["features/rewards/components/reward-delete-alert.tsx", "features/admin/rewards/components/reward-delete-alert.tsx"],
    ["features/rewards/components/reward-modal.tsx", "features/admin/rewards/components/reward-modal.tsx"],

    // settings (admin-only)
    ["features/settings/actions/admin-settings.ts", "features/admin/settings/actions/admin-settings.ts"],
    ["features/settings/components/settings-alerts-tab.tsx", "features/admin/settings/components/settings-alerts-tab.tsx"],
    ["features/settings/components/settings-general-tab.tsx", "features/admin/settings/components/settings-general-tab.tsx"],

    // auth (shared — stays under features/auth/, no move needed)
    // features/auth/ is shared between admin and client, keeping it at features/auth/

    // --------------------------------------------------------
    // C. components/ → move layout components into components/layouts/
    // --------------------------------------------------------
    ["components/app-sidebar.tsx", "components/layouts/app-sidebar.tsx"],
    ["components/site-header.tsx", "components/layouts/site-header.tsx"],
    ["components/nav-main.tsx", "components/layouts/nav-main.tsx"],
    ["components/nav-secondary.tsx", "components/layouts/nav-secondary.tsx"],
    ["components/nav-user.tsx", "components/layouts/nav-user.tsx"],

    // D. Dashboard demo components → features/admin/dashboard/components/
    ["components/chart-area-interactive.tsx", "features/admin/dashboard/components/chart-area-interactive.tsx"],
    ["components/data-table.tsx", "features/admin/dashboard/components/data-table.tsx"],
    ["components/section-cards.tsx", "features/admin/dashboard/components/section-cards.tsx"],

    // E. Orphaned dashboard page → move to app/admin/(dashboard)/demo/
    ["app/dashboard/page.tsx", "app/admin/(dashboard)/demo/page.tsx"],
    ["app/dashboard/data.json", "app/admin/(dashboard)/demo/data.json"],
];

// ============================================================
// 2. BUILD IMPORT REWRITE MAP
//    From old @/path (without extension) → new @/path (without extension)
// ============================================================
function buildImportMap() {
    const map = {};
    for (const [oldPath, newPath] of MOVES) {
        // Strip extensions for import paths
        const oldImport = "@/" + oldPath.replace(/\.(tsx?|json)$/, "").replace(/\\/g, "/");
        const newImport = "@/" + newPath.replace(/\.(tsx?|json)$/, "").replace(/\\/g, "/");
        if (oldImport !== newImport) {
            map[oldImport] = newImport;
        }
    }
    return map;
}

// ============================================================
// 3. MOVE FILES
// ============================================================
async function moveFiles() {
    console.log("\n📦 Moving files...\n");
    let moved = 0;

    for (const [oldRel, newRel] of MOVES) {
        const oldAbs = join(SRC, oldRel);
        const newAbs = join(SRC, newRel);

        try {
            await stat(oldAbs);
        } catch {
            console.log(`  ⏭  SKIP (not found): ${oldRel}`);
            continue;
        }

        // Create target directory
        await mkdir(dirname(newAbs), { recursive: true });

        // Move file
        try {
            await rename(oldAbs, newAbs);
            console.log(`  ✅ ${oldRel} → ${newRel}`);
            moved++;
        } catch (e) {
            // Cross-device rename fallback: copy + delete
            try {
                await cp(oldAbs, newAbs);
                const { unlink } = await import("fs/promises");
                await unlink(oldAbs);
                console.log(`  ✅ ${oldRel} → ${newRel} (copy+delete)`);
                moved++;
            } catch (e2) {
                console.log(`  ❌ FAILED: ${oldRel} → ${e2.message}`);
            }
        }
    }

    console.log(`\n📦 Moved ${moved}/${MOVES.length} files.\n`);
}

// ============================================================
// 4. UPDATE IMPORTS IN ALL SOURCE FILES
// ============================================================
async function getAllSourceFiles(dir) {
    const results = [];
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return results;
    }

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
            results.push(...await getAllSourceFiles(fullPath));
        } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

async function updateImports(importMap) {
    console.log("🔄 Updating import references...\n");

    const allFiles = await getAllSourceFiles(SRC);
    let filesChanged = 0;
    let totalReplacements = 0;

    // Sort keys longest-first to avoid partial matches
    const sortedOldPaths = Object.keys(importMap).sort((a, b) => b.length - a.length);

    for (const filePath of allFiles) {
        let content;
        try {
            content = await readFile(filePath, "utf-8");
        } catch {
            continue;
        }

        let newContent = content;
        let fileReplacements = 0;

        for (const oldImport of sortedOldPaths) {
            const newImport = importMap[oldImport];

            // Match: from "OLD_PATH" or from 'OLD_PATH'
            // Also handle cases where the import might have /index at the end or not
            const escapedOld = oldImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Pattern: match the exact import path in quotes
            const regex = new RegExp(`(from\\s+["'])${escapedOld}(["'])`, "g");
            const replaced = newContent.replace(regex, `$1${newImport}$2`);

            if (replaced !== newContent) {
                const matches = (newContent.match(regex) || []).length;
                fileReplacements += matches;
                newContent = replaced;
            }
        }

        if (fileReplacements > 0) {
            await writeFile(filePath, newContent, "utf-8");
            const relPath = relative(SRC, filePath).replace(/\\/g, "/");
            console.log(`  📝 ${relPath} (${fileReplacements} import(s) updated)`);
            filesChanged++;
            totalReplacements += fileReplacements;
        }
    }

    console.log(`\n🔄 Updated ${totalReplacements} imports across ${filesChanged} files.\n`);
}

// ============================================================
// 5. CLEANUP: Remove empty directories left behind
// ============================================================
async function cleanEmptyDirs(dir) {
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            await cleanEmptyDirs(join(dir, entry.name));
        }
    }

    // Re-read after potential sub-cleanup
    try {
        entries = await readdir(dir);
        if (entries.length === 0 && dir !== SRC) {
            const { rmdir } = await import("fs/promises");
            await rmdir(dir);
            console.log(`  🗑  Removed empty: ${relative(SRC, dir).replace(/\\/g, "/")}/`);
        }
    } catch {
        // ignore
    }
}

// ============================================================
// 6. ALSO UPDATE THE JSON DATA IMPORT IN THE DEMO PAGE
// ============================================================
async function fixDemoDataImport() {
    const demoPage = join(SRC, "app/admin/(dashboard)/demo/page.tsx");
    try {
        let content = await readFile(demoPage, "utf-8");
        // The import "./data.json" stays relative, so it should still work in the same folder
        // But we need to update the @/components imports that were specific to dashboard/
        // These were already handled by the import map, but let's also handle the data.json import
        // Original: import data from "./data.json" — this is fine since both files moved together
        console.log("  ✅ Demo page data import is relative — no change needed.");
    } catch {
        // File might not exist
    }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log("═══════════════════════════════════════════════");
    console.log("  Crew Zingy — Architecture Migration Script  ");
    console.log("═══════════════════════════════════════════════");

    const importMap = buildImportMap();

    console.log(`\n📋 Migration plan: ${MOVES.length} files to move.`);
    console.log(`📋 Import rewrites: ${Object.keys(importMap).length} paths to update.\n`);

    // Step 1: Move all files
    await moveFiles();

    // Step 2: Update all imports
    await updateImports(importMap);

    // Step 3: Fix demo page specifics
    await fixDemoDataImport();

    // Step 4: Clean up empty directories
    console.log("🧹 Cleaning empty directories...\n");
    await cleanEmptyDirs(join(SRC, "features"));
    await cleanEmptyDirs(join(SRC, "components"));
    await cleanEmptyDirs(join(SRC, "app/dashboard"));

    console.log("\n═══════════════════════════════════════════════");
    console.log("  ✅ Migration complete!                       ");
    console.log("  Next: run 'npm run build' to verify.         ");
    console.log("═══════════════════════════════════════════════\n");
}

main().catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
});
