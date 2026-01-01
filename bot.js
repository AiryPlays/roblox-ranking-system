const noblox = require('noblox.js');
const fetch = require('node-fetch');

/**
 * ========================================
 * CORPORATE AUTOMATED RANKING SYSTEM
 * ========================================
 * Enterprise-grade automated ranking solution
 * for Roblox group management with Discord integration
 * 
 * @version 1.0.0
 * @author Your Organization
 */

// ==================== CONFIGURATION ====================

const SYSTEM_CONFIG = {
    // Bot Authentication
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE || '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhADIhsKBGR1aWQSEzgzMzY5Njk4NzUyMjM1MjE2OTEoAw.nLRhJ9pOh3g34Z8LdHkzjNsJCXyTeSuo9WrCJRySrxQsZ6OfiVXFXaOyqtcBhW1UhOvVRNyZm9EAj_pR6n0rYDuLvOyaat1Yd8KiWPbJ1JA3ZhLMck5OALg8CYoxTRkPCIgZnGLuOXrPJDpUbGprY6sXV1nFPEycG0zf8lNyaV-cdhIMKsCSHerPwMmhfCYsB8row1uancbBZO5I5-h0ln9CaUoqnjMVrN_AbmqQ51eoiZmvoxDfAVhbEWD4cFI2qkmWU5TfYn883Onczthpsk28MeI0-rQgbgxW7sV5JyX8siA3b-3392unVlTygj0tHsgvWp4BQwfCfzgcG0dEVw56BfpPDs1MZWrim9-H8DwFc7BESxSHjCkL0wiHxJfT7bqsXFwfiWxQ_yIrZVVLaZ98zq8AIEto4q-2Kcot4DzP8LUriIw7YGLyAPY5jObX5NaEHfKBgebqwvMUxYjRSiJsIxbD-p_BKWSYR6yuUKiErHp6cT2ekwIkKZRgHbZwriuyIhs_eih63WAf8godJZon03fzxT2gVtti_XNd68PRMORjO-z0Czv5FBWGu5CwxukULbrWCIIKrJCR_dPZTJgxhqrVCndWmyvxj5YOYh0J8J34LyYjYx2JrbcJ6v4ipiyqQV1LQqW33s4L2-QPgk9jZp8GTlAncMwfpLLYV0GlgJuouaYJxwzUDzAPTPcsZOoQbn7Yctthr5khDqZY2DRwFzHqWFDUSGzc1mcTLzrGvax1kXBd1_6vFJDCOEK7TTXC7rfGTnPNpVqdy13hI-pYTIDZYgwwpHaM240H3iw6gCpY',
    
    // Group Configuration
    GROUP_ID: parseInt(process.env.GROUP_ID) || 32409210,
    
    // Discord Integration
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK || 'https://discord.com/api/webhooks/1456420026138624031/q1zjZ_dbPstCNERdl2SEja6Dj6K9yMNiSkgEmbsrbMave91BxICuEZMGYnJCP1xY_s_t',
    
    // System Parameters
    POLLING_INTERVAL: 60000, // Transaction monitoring interval (ms)
    TRANSACTION_CACHE_LIMIT: 2000
};

// ==================== PRODUCT CATALOG ====================

/**
 * Product Catalog Configuration
 * 
 * Add products here. Products with a 'rank' property will trigger auto-ranking.
 * Products without a 'rank' will only be logged to Discord.
 * 
 * Structure:
 * {
 *   id: number,           // Product Asset ID
 *   name: string,         // Product display name
 *   type: string,         // 'GamePass' | 'Asset' | 'Badge'
 *   rank?: number,        // Optional: Target rank for auto-ranking
 *   color?: string        // Optional: Hex color for Discord embed
 * }
 */

const PRODUCT_CATALOG = [
    // Auto-Ranking Products
    {
        id: 130464502709529,
        name: 'RYANAIR LLC || Plus',
        type: 'Asset',
        rank: 2,
        color: '#CD7F32'
    },
    {
        id: 111348983052312,
        name: 'Ryanair LLC || Flexi Plus',
        type: 'Asset',
        rank: 3,
        color: '#C0C0C0'
    },
    {
        id: 33333333,
        name: 'Gold Tier Access',
        type: 'GamePass',
        rank: 15,
        color: '#FFD700'
    },
    
    // Tracking-Only Products (no rank assignment)
    {
        id: 44444444,
        name: 'Premium T-Shirt',
        type: 'Asset',
        color: '#3498db'
    },
    {
        id: 55555555,
        name: 'VIP Badge',
        type: 'Badge',
        color: '#9b59b6'
    },
    {
        id: 66666666,
        name: 'Donation - Small',
        type: 'GamePass',
        color: '#2ecc71'
    }
    // Add more products as needed...
];

// ==================== SYSTEM STATE ====================

let processedTransactions = new Set();
let systemMetrics = {
    transactionsProcessed: 0,
    rankingsExecuted: 0,
    notificationsSent: 0,
    errors: 0
};

// ==================== CORE FUNCTIONS ====================

/**
 * Initialize bot authentication
 * @returns {Promise<Object|null>} Authenticated user object or null on failure
 */
async function initializeAuthentication() {
    try {
        const authenticatedUser = await noblox.setCookie(SYSTEM_CONFIG.ROBLOX_COOKIE);
        console.log(`[AUTH] ✅ Successfully authenticated as: ${authenticatedUser.UserName} (ID: ${authenticatedUser.UserID})`);
        return authenticatedUser;
    } catch (error) {
        console.error(`[AUTH] ❌ Authentication failed: ${error.message}`);
        return null;
    }
}

/**
 * Retrieve user profile information
 * @param {number} userId - Target user ID
 * @returns {Promise<Object>} User profile data
 */
async function getUserProfile(userId) {
    try {
        const userInfo = await noblox.getPlayerInfo(userId);
        const thumbnails = await noblox.getPlayerThumbnail(userId, 420, 'png', false, 'Headshot');
        
        return {
            username: userInfo.username,
            displayName: userInfo.displayName,
            userId: userId,
            accountAge: userInfo.age,
            joinDate: userInfo.joinDate,
            avatarUrl: thumbnails[0]?.imageUrl || 'https://www.roblox.com/headshot-thumbnail/image?userId=' + userId
        };
    } catch (error) {
        console.error(`[PROFILE] ❌ Failed to retrieve profile for user ${userId}: ${error.message}`);
        return {
            username: 'Unknown User',
            displayName: 'Unknown',
            userId: userId,
            accountAge: 0,
            joinDate: new Date(),
            avatarUrl: 'https://www.roblox.com/headshot-thumbnail/image?userId=' + userId
        };
    }
}

/**
 * Send Discord webhook notification
 * @param {Object} transactionData - Transaction information
 * @param {Object} userProfile - User profile data
 * @param {Object} product - Product configuration
 */
async function sendDiscordNotification(transactionData, userProfile, product) {
    try {
        const purchaseTimestamp = new Date(transactionData.created);
        const accountCreationDate = new Date(userProfile.joinDate);
        
        const embed = {
            title: '🛒 New Transaction Detected',
            color: parseInt(product.color?.replace('#', '0x') || '0x5865F2'),
            thumbnail: {
                url: userProfile.avatarUrl
            },
            fields: [
                {
                    name: '👤 Customer Information',
                    value: `**Username:** ${userProfile.username}\n**Display Name:** ${userProfile.displayName}\n**User ID:** ${userProfile.userId}`,
                    inline: true
                },
                {
                    name: '📦 Purchase Details',
                    value: `**Product:** ${product.name}\n**Type:** ${product.type}\n**Product ID:** ${product.id}`,
                    inline: true
                },
                {
                    name: '📅 Account Information',
                    value: `**Account Created:** ${accountCreationDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}\n**Account Age:** ${userProfile.accountAge} days`,
                    inline: false
                },
                {
                    name: '🕒 Transaction Time',
                    value: `<t:${Math.floor(purchaseTimestamp.getTime() / 1000)}:F>`,
                    inline: false
                }
            ],
            footer: {
                text: `Transaction ID: ${transactionData.userId}-${product.id}`,
                icon_url: 'https://cdn.discordapp.com/emojis/1234567890.png'
            },
            timestamp: purchaseTimestamp.toISOString()
        };

        // Add ranking information if applicable
        if (product.rank) {
            embed.fields.push({
                name: '⚡ Auto-Ranking Status',
                value: `**Target Rank:** ${product.rank}\n**Status:** Processing...`,
                inline: false
            });
        }

        const payload = {
            embeds: [embed],
            username: 'Transaction Monitor',
            avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        };

        const response = await fetch(SYSTEM_CONFIG.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`[DISCORD] ✅ Notification sent for transaction: ${product.name} - User ${userProfile.username}`);
            systemMetrics.notificationsSent++;
        } else {
            console.error(`[DISCORD] ❌ Webhook failed with status: ${response.status}`);
            systemMetrics.errors++;
        }
    } catch (error) {
        console.error(`[DISCORD] ❌ Notification failed: ${error.message}`);
        systemMetrics.errors++;
    }
}

/**
 * Execute rank assignment for user
 * @param {number} userId - Target user ID
 * @param {number} targetRank - Rank to assign
 * @param {string} productName - Product name for logging
 * @returns {Promise<boolean>} Success status
 */
async function executeRankAssignment(userId, targetRank, productName) {
    try {
        const currentRank = await noblox.getRankInGroup(SYSTEM_CONFIG.GROUP_ID, userId);
        
        if (currentRank === targetRank) {
            console.log(`[RANKING] ℹ️  User ${userId} already holds rank ${targetRank}`);
            return true;
        }

        await noblox.setRank(SYSTEM_CONFIG.GROUP_ID, userId, targetRank);
        console.log(`[RANKING] ✅ Successfully ranked user ${userId} to rank ${targetRank} via ${productName}`);
        systemMetrics.rankingsExecuted++;
        return true;
    } catch (error) {
        console.error(`[RANKING] ❌ Failed to rank user ${userId}: ${error.message}`);
        systemMetrics.errors++;
        return false;
    }
}

/**
 * Determine highest eligible rank for user
 * @param {number} userId - Target user ID
 * @returns {Promise<number>} Highest rank or 0
 */
async function calculateHighestEligibleRank(userId) {
    try {
        const inventory = await noblox.getInventory({
            userId: userId,
            assetTypes: ['GamePass'],
            sortOrder: 'Desc',
            limit: 100
        });
        
        const ownedGamepassIds = inventory.data.map(item => item.assetId);
        let highestRank = 0;

        for (const product of PRODUCT_CATALOG) {
            if (product.rank && ownedGamepassIds.includes(product.id)) {
                highestRank = Math.max(highestRank, product.rank);
            }
        }

        return highestRank;
    } catch (error) {
        console.error(`[CALCULATION] ❌ Failed to calculate rank for user ${userId}: ${error.message}`);
        return 0;
    }
}

/**
 * Process individual transaction
 * @param {Object} transaction - Transaction data
 */
async function processTransaction(transaction) {
    const transactionId = `${transaction.userId}-${transaction.item.id}-${transaction.created}`;
    
    if (processedTransactions.has(transactionId)) {
        return; // Already processed
    }

    const product = PRODUCT_CATALOG.find(p => p.id === transaction.item.id);
    
    if (!product) {
        return; // Product not in catalog
    }

    console.log(`[TRANSACTION] 💰 New transaction detected: ${product.name} - User ${transaction.userId}`);
    
    const userProfile = await getUserProfile(transaction.userId);
    await sendDiscordNotification(transaction, userProfile, product);

    if (product.rank) {
        const eligibleRank = await calculateHighestEligibleRank(transaction.userId);
        if (eligibleRank > 0) {
            await executeRankAssignment(transaction.userId, eligibleRank, product.name);
        }
    }

    processedTransactions.add(transactionId);
    systemMetrics.transactionsProcessed++;

    // Maintain cache size
    if (processedTransactions.size > SYSTEM_CONFIG.TRANSACTION_CACHE_LIMIT) {
        const cacheArray = Array.from(processedTransactions);
        processedTransactions = new Set(cacheArray.slice(-SYSTEM_CONFIG.TRANSACTION_CACHE_LIMIT));
    }
}

/**
 * Poll group revenue for new transactions
 */
async function pollGroupRevenue() {
    try {
        // Check GamePass sales
        const gamepassSales = await noblox.getGroupRevenueSummary(SYSTEM_CONFIG.GROUP_ID, 'GamePass');
        for (const sale of gamepassSales) {
            if (sale.item) {
                await processTransaction(sale);
            }
        }

        // Check Asset sales
        const assetSales = await noblox.getGroupRevenueSummary(SYSTEM_CONFIG.GROUP_ID, 'Asset');
        for (const sale of assetSales) {
            if (sale.item) {
                await processTransaction(sale);
            }
        }
    } catch (error) {
        console.error(`[POLLING] ❌ Revenue polling error: ${error.message}`);
        systemMetrics.errors++;
    }
}

/**
 * Perform initial group member scan
 */
async function performInitialScan() {
    try {
        console.log('[SCAN] 🔍 Initiating comprehensive group member scan...');
        
        const members = await noblox.getPlayers(SYSTEM_CONFIG.GROUP_ID);
        let processedCount = 0;

        for (const member of members) {
            const eligibleRank = await calculateHighestEligibleRank(member.userId);
            
            if (eligibleRank > 0) {
                const currentRank = await noblox.getRankInGroup(SYSTEM_CONFIG.GROUP_ID, member.userId);
                
                if (currentRank !== eligibleRank) {
                    await executeRankAssignment(member.userId, eligibleRank, 'Initial Scan');
                    processedCount++;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        }

        console.log(`[SCAN] ✅ Initial scan complete. Processed ${processedCount} rank adjustments.`);
    } catch (error) {
        console.error(`[SCAN] ❌ Initial scan failed: ${error.message}`);
        systemMetrics.errors++;
    }
}

/**
 * Display system metrics
 */
function displaySystemMetrics() {
    console.log('\n========================================');
    console.log('📊 SYSTEM METRICS');
    console.log('========================================');
    console.log(`Transactions Processed: ${systemMetrics.transactionsProcessed}`);
    console.log(`Rankings Executed: ${systemMetrics.rankingsExecuted}`);
    console.log(`Notifications Sent: ${systemMetrics.notificationsSent}`);
    console.log(`Errors Encountered: ${systemMetrics.errors}`);
    console.log('========================================\n');
}

// ==================== MAIN EXECUTION ====================

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  CORPORATE AUTOMATED RANKING SYSTEM    ║');
    console.log('║  Version 1.0.0                         ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Validate configuration
    if (SYSTEM_CONFIG.ROBLOX_COOKIE === 'YOUR_BOT_COOKIE_HERE' && !process.env.ROBLOX_COOKIE) {
        console.error('[ERROR] ❌ ROBLOX_COOKIE not configured. System cannot start.');
        process.exit(1);
    }

    if (SYSTEM_CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE' && !process.env.DISCORD_WEBHOOK) {
        console.error('[ERROR] ❌ DISCORD_WEBHOOK not configured. System cannot start.');
        process.exit(1);
    }

    // Initialize authentication
    const authenticatedUser = await initializeAuthentication();
    if (!authenticatedUser) {
        console.error('[ERROR] ❌ Authentication failed. System cannot start.');
        process.exit(1);
    }

    // Display configuration
    console.log('[CONFIG] 📋 System Configuration:');
    console.log(`         Group ID: ${SYSTEM_CONFIG.GROUP_ID}`);
    console.log(`         Products Monitored: ${PRODUCT_CATALOG.length}`);
    console.log(`         Polling Interval: ${SYSTEM_CONFIG.POLLING_INTERVAL / 1000}s`);
    console.log(`         Webhook Configured: ✅\n`);

    // Display product catalog
    console.log('[CATALOG] 📦 Product Catalog:');
    PRODUCT_CATALOG.forEach(product => {
        const rankInfo = product.rank ? ` → Rank ${product.rank}` : ' (Tracking Only)';
        console.log(`          - ${product.name} (${product.type})${rankInfo}`);
    });
    console.log('');

    // Perform initial scan
    await performInitialScan();

    // Start polling
    console.log('[SYSTEM] 🚀 Transaction monitoring active...\n');
    pollGroupRevenue(); // Initial poll
    setInterval(pollGroupRevenue, SYSTEM_CONFIG.POLLING_INTERVAL);

    // Display metrics every 10 minutes
    setInterval(displaySystemMetrics, 600000);
}

// ==================== ERROR HANDLING ====================

process.on('unhandledRejection', (error) => {
    console.error('[SYSTEM] ❌ Unhandled rejection:', error);
    systemMetrics.errors++;
});

process.on('SIGINT', () => {
    console.log('\n[SYSTEM] 🛑 Shutdown signal received...');
    displaySystemMetrics();
    console.log('[SYSTEM] 👋 System terminated gracefully.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[SYSTEM] 🛑 Termination signal received...');
    displaySystemMetrics();
    console.log('[SYSTEM] 👋 System terminated gracefully.');
    process.exit(0);
});

// ==================== START SYSTEM ====================

main().catch(error => {
    console.error('[FATAL] ❌ System initialization failed:', error);
    process.exit(1);
});
