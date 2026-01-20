// Main JavaScript file for Logic Links

// API Configuration
const API_BASE_URL = 'https://enwise-backend.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Logic Links loaded');
    console.log('API Base URL:', API_BASE_URL);
    
    // Scroll Animation Observer
    const scrollElements = document.querySelectorAll('.scroll-animate');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scrolled');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    scrollElements.forEach(el => scrollObserver.observe(el));
    
    // Handle bubble image fallback
    const bubbleImg = document.querySelector('.bubble-image');
    const fallbackBubble = document.getElementById('fallbackBubble');
    
    if (bubbleImg && fallbackBubble) {
        bubbleImg.addEventListener('error', function() {
            this.style.display = 'none';
            fallbackBubble.style.display = 'block';
        });
    }
    
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
        const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
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
    const quizResultsDiv = document.getElementById('quiz-results');
    if (!quizResultsDiv) return;
    
    let quizHTML = '<div class="quiz-display"><h3>Generated Quiz</h3>';
    
    questions.forEach((q, index) => {
        quizHTML += `
            <div class="quiz-question">
                <p><strong>Q${index + 1}: ${q.text || q.question || 'Question'}</strong></p>
                ${q.options ? `<ul>${q.options.map((opt, optIndex) => `<li><input type="radio" name="q${index}" value="${optIndex}"> ${opt}</li>`).join('')}</ul>` : ''}
            </div>
        `;
    });
    
    quizHTML += '<button class="submit-quiz-btn">Submit Answers</button></div>';
    quizResultsDiv.innerHTML = quizHTML;
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
    
    // Try to get AI response from backend
    (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });
            
            if (response.ok) {
                const data = await response.json();
                const aiResponse = data.response || data.message || "I'm having trouble understanding that. Could you rephrase?";
                
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'message ai-message';
                aiMessageDiv.innerHTML = `<p>${aiResponse}</p>`;
                chatMessages.appendChild(aiMessageDiv);
            } else {
                throw new Error('Backend error');
            }
        } catch (error) {
            console.log("Backend unavailable, using local response");
            
            // Fallback: Use local AI response
            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'message ai-message';
            aiMessageDiv.innerHTML = `<p>Thanks for your question! I'm here to help you learn ${userMessage.toLowerCase().includes('quiz') ? 'with quizzes' : 'better'}. How else can I assist?</p>`;
            chatMessages.appendChild(aiMessageDiv);
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    })();
}

// Add event listener for chat send button and quiz button
document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.querySelector('.send-btn');
    const chatInput = document.querySelector('.chat-input');
    const generateBtn = document.getElementById('generate-btn');
    
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
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateQuiz);
    }
});

// Upload Modal Functions
function openUploadModal(subject) {
    // Create modal HTML
    const modalHTML = `
        <div id="uploadModal" class="upload-modal-overlay" onclick="closeUploadModal()">
            <div class="upload-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📤 Upload to ${subject.replace('-', ' ').toUpperCase()}</h2>
                    <button class="modal-close" onclick="closeUploadModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="upload-form-modal">
                        <div class="form-group">
                            <label for="uploadTitle">Title/Name:</label>
                            <input type="text" id="uploadTitle" class="form-input" placeholder="e.g., Chapter 3 Notes">
                        </div>
                        
                        <div class="form-group">
                            <label for="uploadFile">Select File:</label>
                            <input type="file" id="uploadFile" class="form-input" accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg">
                        </div>
                        
                        <div class="form-group">
                            <label for="uploadDescription">Description:</label>
                            <textarea id="uploadDescription" class="form-textarea" placeholder="Describe what this file contains..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="uploadType">Type:</label>
                            <select id="uploadType" class="form-select">
                                <option value="notes">📝 Notes</option>
                                <option value="pdf">📕 PDF</option>
                                <option value="practice">✏️ Practice Questions</option>
                                <option value="resource">🎓 Learning Resource</option>
                                <option value="other">📄 Other</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="modal-btn-cancel" onclick="closeUploadModal()">Cancel</button>
                    <button class="modal-btn-upload" onclick="handleUpload('${subject}')">Upload File</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('uploadModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

function handleUpload(subject) {
    const title = document.getElementById('uploadTitle').value;
    const file = document.getElementById('uploadFile').files[0];
    const description = document.getElementById('uploadDescription').value;
    const type = document.getElementById('uploadType').value;
    
    if (!title || !file) {
        alert('Please fill in title and select a file');
        return;
    }
    
    // Show success message
    alert(`✅ File "${title}" uploaded successfully for ${subject}!`);
    
    // Close modal
    closeUploadModal();
    
    // Here you would typically send the file to backend
    console.log('Upload data:', {
        subject: subject,
        title: title,
        file: file.name,
        description: description,
        type: type,
        size: file.size
    });
}

// ==================== AI CHAT PAGE FUNCTIONS ====================

// Send AI Chat Message (Full Page)
function sendAIChatMessage() {
    const chatInput = document.getElementById('aiChatInput');
    const chatMessages = document.querySelector('.chat-messages-full');
    
    if (!chatInput || !chatMessages) return;
    
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;
    
    // Add user message to chat
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message-full';
    userMessageDiv.innerHTML = `
        <div class="message-content">
            <p>${userMessage}</p>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-avatar">👤</div>
    `;
    chatMessages.appendChild(userMessageDiv);
    
    // Clear input
    chatInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message-full typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Get AI response
    getAIResponse(userMessage, chatMessages);
}

// Get AI Response from Backend
async function getAIResponse(userMessage, chatMessages) {
    const typingIndicator = document.getElementById('typingIndicator');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: userMessage,
                context: "educational",
                allowExploration: true
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const aiResponse = data.response || data.message || generateLocalAIResponse(userMessage);
            
            // Remove typing indicator
            if (typingIndicator) typingIndicator.remove();
            
            // Add AI response
            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'message ai-message-full';
            aiMessageDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <p>${aiResponse}</p>
                    <span class="message-time">${timestamp}</span>
                </div>
            `;
            chatMessages.appendChild(aiMessageDiv);
        } else {
            throw new Error('Backend error');
        }
    } catch (error) {
        console.log("Using intelligent local response");
        
        // Remove typing indicator
        if (typingIndicator) typingIndicator.remove();
        
        // Generate intelligent local response
        const aiResponse = generateLocalAIResponse(userMessage);
        
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai-message-full';
        aiMessageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p>${aiResponse}</p>
                <span class="message-time">${timestamp}</span>
            </div>
        `;
        chatMessages.appendChild(aiMessageDiv);
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate Intelligent Local AI Response
function generateLocalAIResponse(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // DSA & Algorithms
    if (msg.includes('dsa') || msg.includes('data structure') || msg.includes('algorithm')) {
        return `Great question about Data Structures & Algorithms! 🔥

**DSA (Data Structures & Algorithms)** is the backbone of computer science and software development.

**Real-life examples:**
• **Arrays** → Your contact list on phone (ordered list of names)
• **Stack** → Stack of plates in a cafeteria (Last In, First Out)
• **Queue** → People waiting in a ticket line (First In, First Out)
• **Trees** → Your computer's folder structure (hierarchical organization)
• **Graphs** → Google Maps finding shortest route (networks & connections)
• **Hash Tables** → Dictionary looking up word meanings (fast key-value lookup)

**Why learn DSA?**
1. Crack coding interviews at top companies
2. Write efficient, optimized code
3. Solve complex problems systematically
4. Build scalable applications

Would you like me to explain any specific data structure in detail? 📚`;
    }
    
    // Time Complexity
    if (msg.includes('time complexity') || msg.includes('big o') || msg.includes('complexity')) {
        return `**Time Complexity** measures how long an algorithm takes as input grows! ⏱️

**Common complexities (best to worst):**
• **O(1)** - Constant: Accessing array[0] → instant
• **O(log n)** - Logarithmic: Binary search → very fast
• **O(n)** - Linear: Finding max in unsorted list → reasonable
• **O(n log n)** - Merge Sort, Quick Sort → efficient sorting
• **O(n²)** - Bubble Sort → gets slow with large data
• **O(2ⁿ)** - Exponential: Fibonacci recursive → very slow

**Real example:**
If n = 1,000,000:
- O(n) = 1 million operations ✅
- O(n²) = 1 trillion operations ❌

Want me to analyze the complexity of a specific algorithm? 🧠`;
    }
    
    // Recursion
    if (msg.includes('recursion') || msg.includes('recursive')) {
        return `**Recursion** is when a function calls itself! 🔄

**Key concepts:**
1. **Base Case** - When to stop (prevents infinite loop)
2. **Recursive Case** - Function calls itself with smaller input

**Classic example - Factorial:**
\`\`\`
factorial(5) = 5 × factorial(4)
            = 5 × 4 × factorial(3)
            = 5 × 4 × 3 × factorial(2)
            = 5 × 4 × 3 × 2 × factorial(1)
            = 5 × 4 × 3 × 2 × 1 = 120
\`\`\`

**Real-life examples:**
• Russian nesting dolls (each contains smaller version)
• Mirrors facing each other (infinite reflections)
• Folder navigation (folders inside folders)

Would you like practice problems on recursion? 💡`;
    }
    
    // Math related
    if (msg.includes('discrete') || msg.includes('math') || msg.includes('logic') || msg.includes('probability')) {
        return `**Discrete Mathematics** is crucial for computer science! 📐

**Key topics:**
• **Logic** - Truth tables, propositions, implications
• **Set Theory** - Unions, intersections, complements
• **Relations & Functions** - Mapping between sets
• **Graph Theory** - Networks, paths, connectivity
• **Combinatorics** - Counting, permutations, combinations
• **Probability** - Random events, expected values

**Why it matters:**
- Logic → Programming conditions (if/else)
- Graph Theory → Social networks, routing algorithms
- Probability → Machine Learning, AI decisions

What specific topic would you like to explore? 🎓`;
    }
    
    // Study tips
    if (msg.includes('study') || msg.includes('tips') || msg.includes('learn') || msg.includes('prepare')) {
        return `**Top Study Strategies for Success!** 📖✨

1. **Active Recall** - Test yourself instead of re-reading
2. **Spaced Repetition** - Review at increasing intervals
3. **Pomodoro Technique** - 25 min focus + 5 min break
4. **Teach Others** - Explaining reinforces understanding
5. **Practice Problems** - Apply theory to real questions

**For Programming:**
• Code daily, even 30 minutes helps
• Build mini-projects
• Solve LeetCode/HackerRank problems
• Read others' code on GitHub

**For Exams:**
• Start 2 weeks early
• Make summary sheets
• Practice past papers
• Get enough sleep!

Need a personalized study plan? Tell me your subject and timeline! 🗓️`;
    }
    
    // Quiz related
    if (msg.includes('quiz') || msg.includes('test') || msg.includes('practice')) {
        return `I'd be happy to help with quizzes! 📝

**Options:**
1. **Generate a Quiz** - Tell me the topic and I'll create questions
2. **Practice Problems** - Step-by-step problem solving
3. **Mock Test** - Simulate exam conditions
4. **Review Mistakes** - Learn from your errors

**Example topics I can quiz you on:**
• Data Structures & Algorithms
• Discrete Mathematics
• Programming Concepts
• Operating Systems
• Database Management

Which topic would you like to practice? 🎯`;
    }
    
    // Career/exploration
    if (msg.includes('career') || msg.includes('job') || msg.includes('future') || msg.includes('explore')) {
        return `**Exploring Tech Career Paths!** 🚀

**Popular Roles:**
• **Software Developer** - Build applications
• **Data Scientist** - Analyze data, ML models
• **DevOps Engineer** - Infrastructure & deployment
• **Cloud Architect** - AWS, Azure, GCP solutions
• **AI/ML Engineer** - Build intelligent systems
• **Cybersecurity Analyst** - Protect digital assets
• **Full Stack Developer** - Frontend + Backend

**Skills in demand (2026):**
1. AI/Machine Learning
2. Cloud Computing
3. Cybersecurity
4. Blockchain
5. Data Engineering

**Getting started:**
- Build a strong GitHub portfolio
- Contribute to open source
- Get relevant certifications
- Network on LinkedIn

What career path interests you most? I can suggest a learning roadmap! 🗺️`;
    }
    
    // Default response for any question
    return `That's a great question! I can help you with:
• Explaining concepts in detail
• Solving practice problems step-by-step
• Generating quizzes on specific topics
• Recommending study strategies

Feel free to ask follow-up questions or try one of my suggestions above! 😊`;
}

// Send predefined message
function sendPredefinedMessage(message) {
    const chatInput = document.getElementById('aiChatInput');
    if (chatInput) {
        chatInput.value = message;
        sendAIChatMessage();
    }
}

// Clear chat history
function clearChatHistory() {
    const chatMessages = document.querySelector('.chat-messages-full');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message welcome-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <h3>Chat cleared! 🗑️</h3>
                    <p>Ready for a fresh start. How can I help you today?</p>
                </div>
            </div>
        `;
    }
}

// Export chat
function exportChat() {
    const chatMessages = document.querySelector('.chat-messages-full');
    if (!chatMessages) return;
    
    const messages = chatMessages.querySelectorAll('.message');
    let exportText = "EnWise AI Chat Export\n" + "=".repeat(40) + "\n\n";
    
    messages.forEach(msg => {
        const content = msg.querySelector('.message-content p');
        const time = msg.querySelector('.message-time');
        const isUser = msg.classList.contains('user-message-full');
        
        if (content) {
            exportText += `[${isUser ? 'You' : 'AI'}] ${time ? time.textContent : ''}\n`;
            exportText += content.textContent + "\n\n";
        }
    });
    
    // Download as text file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enwise-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Add Enter key support for AI Chat input
document.addEventListener('DOMContentLoaded', function() {
    const aiChatInput = document.getElementById('aiChatInput');
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIChatMessage();
            }
        });
    }
});
