// Main JavaScript file for Logic Links

// API Configuration
const API_BASE_URL = 'https://enwise-backend.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Logic Links loaded');
    console.log('API Base URL:', API_BASE_URL);
    
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

// Backend API Constants
const BACKEND_URL = "https://enwise-backend.onrender.com";

// Quiz Generation Function
async function generateQuiz() {
    // 1. Get the user's input from the HTML text box
    const topicInput = document.getElementById("userTopic").value; 
    
    // Validate input
    if (!topicInput.trim()) {
        alert("Please enter a topic to generate a quiz.");
        return;
    }
    
    console.log("🚀 Sending request to backend for:", topicInput);

    try {
        // 2. The Handshake: Talking to your Python Backend
        const response = await fetch(`${BACKEND_URL}/generate-quiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // 3. The Parcel: Sending the data exactly how Python expects it
            body: JSON.stringify({
                topic: topicInput,
                difficulty: "medium" // You can make this dynamic later if you want
            })
        });

        // 4. Check if the backend said "OK"
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        // 5. Open the package (Parse JSON)
        const data = await response.json();
        console.log("✅ Quiz Received:", data);

        // 6. NOW you can use 'data.questions' to show the quiz on screen
        alert("✅ Quiz Generated Successfully! Check the Console (F12) to see the questions.");
        
        // Example: Display the quiz data (you can customize this)
        if (data.questions && data.questions.length > 0) {
            console.log("Quiz Questions:", data.questions);
            // You can display the quiz on the page here
            displayQuiz(data.questions);
        }

    } catch (error) {
        console.error("❌ Connection Failed:", error);
        alert("Could not connect to the backend. Is the AI Backend server running at " + BACKEND_URL + "?");
    }
}

// Helper function to display quiz on the page
function displayQuiz(questions) {
    let quizHTML = '<div class="quiz-display"><h3>Generated Quiz</h3>';
    
    questions.forEach((q, index) => {
        quizHTML += `
            <div class="quiz-question">
                <p><strong>Q${index + 1}: ${q.text || q.question}</strong></p>
                ${q.options ? `<ul>${q.options.map(opt => `<li>${opt}</li>`).join('')}</ul>` : ''}
            </div>
        `;
    });
    
    quizHTML += '</div>';
    console.log(quizHTML);
    // Optional: You can display this in a modal or on the page
}

// AI Chat Message Handler
function sendChatMessage() {
    const chatInput = document.querySelector('.chat-input');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (!chatInput || !chatMessages) return;
    
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;
    
    // Add user message to chat
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.innerHTML = `<p>${userMessage}</p>`;
    chatMessages.appendChild(userMessageDiv);
    
    // Clear input
    chatInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate AI response (replace with actual backend call if available)
    setTimeout(() => {
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai-message';
        aiMessageDiv.innerHTML = `<p>Thanks for your question! I'm here to help you learn better.</p>`;
        chatMessages.appendChild(aiMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);
}

// Add event listener for chat send button
document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.querySelector('.send-btn');
    const chatInput = document.querySelector('.chat-input');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});
