// Clear localStorage to regenerate data with UK settings
localStorage.removeItem('hospital_inventory_assets');
localStorage.removeItem('hospital_inventory_users');
console.log('Storage cleared - UK-based data will be generated on next load');
