const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateNetflixStocks() {
  console.log('[Script] Starting Netflix stock update...');
  
  try {
    // 1. Get all Netflix accounts
    const netflixAccounts = await prisma.account.findMany({
      where: { 
        type: 'NETFLIX',
      },
      include: {
        profiles: true,
      },
    });
    
    console.log(`[Script] Found ${netflixAccounts.length} Netflix accounts.`);
    
    // 2. For each account, update stock based on available profiles
    for (const account of netflixAccounts) {
      try {
        // Count available profiles (not assigned to any order or user)
        const availableProfiles = account.profiles.filter(profile => !profile.orderId && !profile.userId).length;
        
        console.log(`[Script] Account ${account.accountEmail}: ${availableProfiles} available profiles out of ${account.profiles.length} total.`);
        
        // Update account stock
        await prisma.account.update({
          where: { id: account.id },
          data: { 
            stock: availableProfiles,
            isActive: availableProfiles > 0 // Also set active status based on stock
          },
        });
        
        console.log(`[Script] Updated account ${account.accountEmail} stock to ${availableProfiles}.`);
        
        // Add a small delay to avoid connection issues
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (accountError) {
        console.error(`[Script] Error updating account ${account.accountEmail}:`, accountError);
        // Continue with the next account
      }
    }
    
    console.log('[Script] Netflix stock update completed successfully!');
  } catch (error) {
    console.error('[Script] Error updating Netflix stocks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Let's also create a function to update Spotify accounts
async function updateSpotifyStocks() {
  console.log('[Script] Starting Spotify stock update...');
  
  try {
    // 1. Get all Spotify accounts
    const spotifyAccounts = await prisma.account.findMany({
      where: { 
        type: 'SPOTIFY',
      },
      include: {
        spotifySlots: true,
      },
    });
    
    console.log(`[Script] Found ${spotifyAccounts.length} Spotify accounts.`);
    
    // 2. For each account, update stock based on available slots
    for (const account of spotifyAccounts) {
      try {
        // Count available slots (not allocated)
        const availableSlots = account.spotifySlots.filter(slot => !slot.isAllocated).length;
        
        console.log(`[Script] Account ${account.accountEmail}: ${availableSlots} available slots out of ${account.spotifySlots.length} total.`);
        
        // Update account stock
        await prisma.account.update({
          where: { id: account.id },
          data: { 
            stock: availableSlots,
            isActive: availableSlots > 0 // Also set active status based on stock
          },
        });
        
        console.log(`[Script] Updated account ${account.accountEmail} stock to ${availableSlots}.`);
        
        // Add a small delay to avoid connection issues
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (accountError) {
        console.error(`[Script] Error updating account ${account.accountEmail}:`, accountError);
        // Continue with the next account
      }
    }
    
    console.log('[Script] Spotify stock update completed successfully!');
  } catch (error) {
    console.error('[Script] Error updating Spotify stocks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the scripts in sequence
async function main() {
  try {
    await updateNetflixStocks();
    await updateSpotifyStocks();
    console.log('[Script] All stock updates completed.');
  } catch (error) {
    console.error('[Script] Error in main execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('[Script] Script execution complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Script] Script execution failed:', error);
    process.exit(1);
  }); 