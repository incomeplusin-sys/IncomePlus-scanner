// IncomePlus - Fixed Mobile Menu & Scanner Functions

// 1. FIXED MOBILE MENU (Works on all pages)
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    
    // Find the menu button
    const buttons = document.querySelectorAll('[onclick*="toggleMobileMenu"]');
    const button = buttons[0];
    
    if (menu.classList.contains('hidden')) {
        // Show menu
        menu.classList.remove('hidden');
        // Change icon to X
        if (button) {
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fas fa-times text-2xl';
        }
    } else {
        // Hide menu
        menu.classList.add('hidden');
        // Change icon back to bars
        if (button) {
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fas fa-bars text-2xl';
        }
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobileMenu');
    if (!menu || menu.classList.contains('hidden')) return;
    
    // Find all menu buttons
    const buttons = document.querySelectorAll('[onclick*="toggleMobileMenu"]');
    let isMenuButton = false;
    
    buttons.forEach(button => {
        if (button.contains(e.target)) isMenuButton = true;
    });
    
    // If click is outside menu and not on menu button
    if (!menu.contains(e.target) && !isMenuButton) {
        menu.classList.add('hidden');
        // Reset all menu button icons
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fas fa-bars text-2xl';
        });
    }
});

// 2. SCANNER FUNCTIONS (Add your Python scanner here)
window.startLiveScan = function() {
    // Replace this with your Python scanner integration
    console.log("Connect your Python scanner here");
    
    // Show loading state
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
        resultsDiv.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-sync-alt fa-spin text-blue-600 text-3xl mb-4"></i>
                <h4 class="font-bold mb-2">Connecting to your scanner...</h4>
                <p class="text-gray-600">Add your Python scanner code to this function</p>
            </div>
        `;
    }
};

// 3. TRIAL MANAGEMENT
window.startTrial = function(email) {
    // Save trial info (in production: send to backend)
    localStorage.setItem('incomeplus_trial', JSON.stringify({
        email: email,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        active: true
    }));
    
    alert("Free trial started! You have 7 days of full access.");
    window.location.href = "/";
};

// 4. CHECK TRIAL STATUS ON PAGE LOAD
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on trial
    const trialData = localStorage.getItem('incomeplus_trial');
    if (trialData) {
        const trial = JSON.parse(trialData);
        const endDate = new Date(trial.endDate);
        const today = new Date();
        
        if (endDate > today) {
            // Trial is active
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            console.log(`Trial active: ${daysLeft} days remaining`);
        } else {
            // Trial expired
            console.log("Trial expired");
        }
    }
    
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(el => {
        el.addEventListener('mouseenter', function() {
            // Add tooltip logic if needed
        });
    });
});