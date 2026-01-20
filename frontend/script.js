// Main JavaScript file for Logic Links

document.addEventListener('DOMContentLoaded', function() {
    console.log('Logic Links loaded');
    
    // Hamburger Menu Functionality
    const hamburger = document.getElementById('hamburger');
    const navMobile = document.getElementById('navMobile');
    const navOverlay = document.getElementById('navOverlay');
    
    if (hamburger && navMobile && navOverlay) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMobile.classList.toggle('active');
            navOverlay.classList.toggle('active');
        });
        
        navOverlay.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMobile.classList.remove('active');
            navOverlay.classList.remove('active');
        });
        
        // Close menu when a link is clicked
        const navLinks = navMobile.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMobile.classList.remove('active');
                navOverlay.classList.remove('active');
            });
        });
    }
    
    // Tab Switching for Upload Page
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const activeTab = document.getElementById(tabName + '-tab');
            if (activeTab) {
                activeTab.classList.add('active');
            }
        });
    });
    
    // File upload drag and drop
    const fileUploads = document.querySelectorAll('.file-upload');
    
    fileUploads.forEach(uploadArea => {
        const fileInput = uploadArea.querySelector('.file-input');
        
        if (!fileInput) return;
        
        // Drag over
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.background = 'rgba(95, 196, 184, 0.1)';
        });
        
        // Drag leave
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.style.background = '';
        });
        
        // Drop
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.background = '';
            const files = e.dataTransfer.files;
            fileInput.files = files;
        });
    });
    
    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Subject card click functionality (if needed for dynamic loading)
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('a')) {
                // If clicked on card but not a link, navigate
                const href = this.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            }
        });
    });
});
