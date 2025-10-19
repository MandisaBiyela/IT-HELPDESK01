// Dark Mode Toggle Functionality
(function() {
    // Check for saved dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply dark mode if enabled
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Create dark mode toggle button
    function createDarkModeToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'darkModeToggle';
        toggle.className = 'dark-mode-toggle';
        toggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        toggle.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        toggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--ndabase-blue);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: all 0.3s ease;
        `;
        
        toggle.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        toggle.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        toggle.addEventListener('click', toggleDarkMode);
        
        document.body.appendChild(toggle);
    }
    
    // Toggle dark mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        // Save preference
        localStorage.setItem('darkMode', isDark);
        
        // Update button icon
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            toggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDarkModeToggle);
    } else {
        createDarkModeToggle();
    }
})();
