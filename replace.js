const fs = require('fs');
let content = fs.readFileSync('src/actions/client/index.ts', 'utf8');

// replace chunks using regex or string literals.

// 1. requestOtp (cuenta_bloqueada)
content = content.replace(
`        // Disparar webhook de bloqueo
        await triggerWebhook("cliente.cuenta_bloqueada", {
            phone,
            razon: "Límite de envíos excedido (3/3)",
            bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
        });`,
`        // Disparar webhook de bloqueo
        const [existingClient] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
        if (existingClient?.wantsTransactional ?? true) {
            await triggerWebhook("cliente.cuenta_bloqueada", {
                phone,
                razon: "Límite de envíos excedido (3/3)",
                bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
            });
        }`
);

// 2. verifyOtp (cuenta_bloqueada)
content = content.replace(
`            // Disparar webhook de bloqueo por mala digitación
            await triggerWebhook("cliente.cuenta_bloqueada", {
                phone,
                razon: "Demasiados intentos de verificación fallidos (3/3)",
                bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
            });`,
`            // Disparar webhook de bloqueo por mala digitación
            const [existingClient] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
            if (existingClient?.wantsTransactional ?? true) {
                await triggerWebhook("cliente.cuenta_bloqueada", {
                    phone,
                    razon: "Demasiados intentos de verificación fallidos (3/3)",
                    bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
                });
            }`
);

// 3. verifyOtp (cuenta_reactivada)
content = content.replace(
`            await triggerWebhook("cliente.cuenta_reactivada", {
                clientId: existingClient.id,
                phone,
                reactivatedAt: new Date().toISOString(),
            });`,
`            if (existingClient.wantsTransactional) {
                await triggerWebhook("cliente.cuenta_reactivada", {
                    clientId: existingClient.id,
                    phone,
                    reactivatedAt: new Date().toISOString(),
                });
            }`
);

// 4. verifyOtp (sesion_iniciada)
content = content.replace(
`        // Trigger Webhook
        await triggerWebhook("cliente.sesion_iniciada", {
            clientId: existingClient.id,
            phone: existingClient.phone,
            username: existingClient.username,
            points: existingClient.points,
            avatarSvg: existingClient.avatarSvg
        });`,
`        // Trigger Webhook
        if (existingClient.wantsTransactional) {
            await triggerWebhook("cliente.sesion_iniciada", {
                clientId: existingClient.id,
                phone: existingClient.phone,
                username: existingClient.username,
                points: existingClient.points,
                avatarSvg: existingClient.avatarSvg
            });
        }`
);

// 5. registerClient (cuenta_reactivada)
content = content.replace(
`        await triggerWebhook("cliente.cuenta_reactivada", {
            clientId: existingPhone.id,
            phone: data.phone,
            username: data.username,
            avatarSvg: data.avatarSvg,
            reactivated: true,
            createdAt: new Date().toISOString()
        });`,
`        if (data.wantsTransactional ?? true) {
            await triggerWebhook("cliente.cuenta_reactivada", {
                clientId: existingPhone.id,
                phone: data.phone,
                username: data.username,
                avatarSvg: data.avatarSvg,
                reactivated: true,
                createdAt: new Date().toISOString()
            });
        }`
);

// 6. registerClient (referido)
content = content.replace(
`        await triggerWebhook("cliente.referido", {
            referrerId: referrerData.id,
            referrerUsername: referrerData.username,
            newClientId: newClient.id,
            newClientUsername: data.username,
            pointsAwardedToReferrer: pointsToAdd,
            pointsAwardedToReferred: referralBonusReferred
        });`,
`        if (referrerData.wantsTransactional) {
            await triggerWebhook("cliente.referido", {
                referrerId: referrerData.id,
                referrerUsername: referrerData.username,
                newClientId: newClient.id,
                newClientUsername: data.username,
                pointsAwardedToReferrer: pointsToAdd,
                pointsAwardedToReferred: referralBonusReferred
            });
        }`
);

// 7. registerClient (registrado)
content = content.replace(
`    // Trigger Webhook de Registro
    await triggerWebhook("cliente.registrado", {
        clientId: newClient.id,
        phone: data.phone,
        username: data.username,
        avatarSvg: data.avatarSvg,
        referredByCode: validReferrer ? data.referredByCode : null,
        bonusAwarded: referralBonusReferred,
        timestamp: new Date().toISOString()
    });`,
`    // Trigger Webhook de Registro
    if (data.wantsTransactional ?? true) {
        await triggerWebhook("cliente.registrado", {
            clientId: newClient.id,
            phone: data.phone,
            username: data.username,
            avatarSvg: data.avatarSvg,
            referredByCode: validReferrer ? data.referredByCode : null,
            bonusAwarded: referralBonusReferred,
            timestamp: new Date().toISOString()
        });
    }`
);

// 8. registerClient (sesion_iniciada)
content = content.replace(
`    // Trigger Webhook de Sesión (con flag de nuevo registro)
    await triggerWebhook("cliente.sesion_iniciada", {
        clientId: newClient.id,
        phone: data.phone,
        username: data.username,
        avatarSvg: data.avatarSvg,
        isNewRegistration: true,
        timestamp: new Date().toISOString()
    });`,
`    // Trigger Webhook de Sesión (con flag de nuevo registro)
    if (data.wantsTransactional ?? true) {
        await triggerWebhook("cliente.sesion_iniciada", {
            clientId: newClient.id,
            phone: data.phone,
            username: data.username,
            avatarSvg: data.avatarSvg,
            isNewRegistration: true,
            timestamp: new Date().toISOString()
        });
    }`
);

// 9. applyReferralCode (referido)
content = content.replace(
`            await triggerWebhook("cliente.referido", {
                referrerId,
                referrerUsername: referrer.username,
                newClientId: session.clientId,
                newClientUsername: client.username,
                pointsAwardedToReferrer: pointsForReferrer,
                pointsAwardedToReferred: bonusReferred,
                isPostRegistration: true
            });`,
`            if (referrer.wantsTransactional || client.wantsTransactional) {
                await triggerWebhook("cliente.referido", {
                    referrerId,
                    referrerUsername: referrer.username,
                    newClientId: session.clientId,
                    newClientUsername: client.username,
                    pointsAwardedToReferrer: pointsForReferrer,
                    pointsAwardedToReferred: bonusReferred,
                    isPostRegistration: true
                });
            }`
);

// 10. updateClientProfile (perfil_actualizado)
content = content.replace(
`    await triggerWebhook("cliente.perfil_actualizado", {
        clientId: session.clientId,
        username: data.username || currentClient.username,
        avatarSvg: data.avatarSvg || currentClient.avatarSvg,
        phone: session.phone,
        wantsMarketing: data.wantsMarketing !== undefined ? data.wantsMarketing : currentClient.wantsMarketing,
        wantsTransactional: data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional
    });`,
`    if (data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional) {
        await triggerWebhook("cliente.perfil_actualizado", {
            clientId: session.clientId,
            username: data.username || currentClient.username,
            avatarSvg: data.avatarSvg || currentClient.avatarSvg,
            phone: session.phone,
            wantsMarketing: data.wantsMarketing !== undefined ? data.wantsMarketing : currentClient.wantsMarketing,
            wantsTransactional: data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional
        });
    }`
);

// 11. deleteMyAccount
content = content.replace(
`    // Anonimizar username para liberarlo (otros pueden elegirlo)
    const deletedUsername = \`deleted_\${session.clientId}_\${Date.now()}\`;

    await db.update(clients).set({
        username: deletedUsername,
        points: 0,
        avatarSvg: "default.svg",
        wantsMarketing: false,
        wantsTransactional: false,
        wantsInAppNotifs: false,
        deletedAt: new Date(),
    }).where(eq(clients.id, session.clientId));

    await triggerWebhook("cliente.cuenta_eliminada", {
        clientId: session.clientId,
        phone: session.phone,
        username: session.username,
        deletedAt: new Date().toISOString(),
    });`,
`    // Anonimizar username para liberarlo (otros pueden elegirlo)
    const deletedUsername = \`deleted_\${session.clientId}_\${Date.now()}\`;

    const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);

    await db.update(clients).set({
        username: deletedUsername,
        points: 0,
        avatarSvg: "default.svg",
        wantsMarketing: false,
        wantsTransactional: false,
        wantsInAppNotifs: false,
        deletedAt: new Date(),
    }).where(eq(clients.id, session.clientId));

    if (c?.wantsTransactional) {
        await triggerWebhook("cliente.cuenta_eliminada", {
            clientId: session.clientId,
            phone: session.phone,
            username: session.username,
            deletedAt: new Date().toISOString(),
        });
    }`
);

// 12. Redeem code error 1
content = content.replace(
`    if (!result.length) {
        await triggerWebhook("cliente.error_codigo_invalido", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            code: codeStr,
            error: "Codigo no encontrado"
        });
        return { success: false, error: "Codigo no encontrado" };
    }`,
`    if (!result.length) {
        const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
        if (c?.wantsTransactional) {
            await triggerWebhook("cliente.error_codigo_invalido", {
                clientId: session.clientId,
                username: session.username,
                phone: session.phone,
                code: codeStr,
                error: "Codigo no encontrado"
            });
        }
        return { success: false, error: "Codigo no encontrado" };
    }`
);

// 13. Redeem code error 2
content = content.replace(
`    if (code.status === "used") {
        await triggerWebhook("cliente.error_codigo_invalido", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            code: codeStr,
            error: "Este codigo ya ha sido utilizado"
        });
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }`,
`    if (code.status === "used") {
        const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
        if (c?.wantsTransactional) {
            await triggerWebhook("cliente.error_codigo_invalido", {
                clientId: session.clientId,
                username: session.username,
                phone: session.phone,
                code: codeStr,
                error: "Este codigo ya ha sido utilizado"
            });
        }
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }`
);

// 14. Redeem code error 3
content = content.replace(
`    if (now > code.expirationDate) {
        await triggerWebhook("cliente.error_codigo_invalido", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            code: codeStr,
            error: "Este código ya ha expirado"
        });
        return { success: false, error: "Este código ya ha expirado" };
    }`,
`    if (now > code.expirationDate) {
        const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
        if (c?.wantsTransactional) {
            await triggerWebhook("cliente.error_codigo_invalido", {
                clientId: session.clientId,
                username: session.username,
                phone: session.phone,
                code: codeStr,
                error: "Este código ya ha expirado"
            });
        }
        return { success: false, error: "Este código ya ha expirado" };
    }`
);

// 15. Nivel alcanzado
content = content.replace(
`        if (oldTier !== newTier) {
            await triggerWebhook("cliente.nivel_alcanzado", {
                clientId: session.clientId,
                username: session.username,
                phone: session.phone,
                oldTier,
                newTier,
                lifetimePoints: updatedClient.lifetimePoints
            });`,
`        if (oldTier !== newTier) {
            if (updatedClient.wantsTransactional) {
                await triggerWebhook("cliente.nivel_alcanzado", {
                    clientId: session.clientId,
                    username: session.username,
                    phone: session.phone,
                    oldTier,
                    newTier,
                    lifetimePoints: updatedClient.lifetimePoints
                });
            }`
);

fs.writeFileSync('src/actions/client/index.ts', content, 'utf8');
