// Main JavaScript file for Logic Links

// API Configuration
const API_BASE_URL = 'http://172.18.236.5:8000';

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
        const response = await fetch(${API_BASE_URL}/generate-quiz, {
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

    }  catch (error) {
    console.error("❌ Technical Error Details:", error);
    // This will show if it's a "Network Error" or "Refused"
    alert(Connection Failed!\n\nReason: ${error.message}\nTarget: ${API_BASE_URL});
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

async function handleUpload(subject) {
    const title = document.getElementById('uploadTitle').value;
    const file = document.getElementById('uploadFile').files[0];
    const chapter = document.getElementById('uploadDescription').value || "General Chapter";
    
    if (!title || !file) {
        alert('Please fill in title and select a file');
        return;
    }

    // Show a "Processing" state
    const uploadBtn = document.querySelector('.modal-btn-upload');
    uploadBtn.innerText = "⏳ Processing with AI...";
    uploadBtn.disabled = true;

    try {
        // 1. Create the Parcel (FormData)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);
        formData.append("chapter", chapter);

        // 2. The Handshake (API Call)
        const response = await fetch(${API_BASE_URL}/generate-offline-pack, {
            method: "POST",
            body: formData // Note: No headers needed for FormData, browser does it automatically
        });

        if (!response.ok) throw new Error('AI Generation failed');

        const data = await response.json();
        console.log("✅ Study Pack Received:", data);

        // 3. Save for Offline Use
        localStorage.setItem(offline_${subject}_${title}, JSON.stringify(data));

        alert(✅ AI has analyzed your notes! You can now access the summary and quiz offline.);
        
        // Optional: Trigger a UI update to show the summary immediately
        displayStudyPack(data); 
        closeUploadModal();

    } catch (error) {
        console.error("❌ Integration Error:", error);
        alert("Could not connect to the AI backend. Make sure the server is running.");
    } finally {
        uploadBtn.innerText = "Upload File";
        uploadBtn.disabled = false;
    }
}
function displayStudyPack(data) {
    const resultsArea = document.getElementById('quiz-results'); // Or any container
    if (!resultsArea) return;

    let html = `
        <div class="ai-pack-card">
            <h3>📖 AI Summary</h3>
            <ul>${data.summary.map(s => <li>${s}</li>).join('')}</ul>
            <hr>
            <h3>📝 Quick Practice Quiz</h3>
            ${data.quiz.map((q, i) => `
                <div class="q-block">
                    <p><strong>${i+1}. ${q.q}</strong></p>
                    ${q.options.map(opt => <button onclick="alert('${opt === q.a ? 'Correct!' : 'Try again!'}')">${opt}</button>).join('')}
                </div>
            `).join('')}
        </div>
    `;
    resultsArea.innerHTML = html;
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

// Generate Intelligent Local AI Response - Enhanced for Comprehensive Learning
function generateLocalAIResponse(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // Math & Calculus with numericals
    if (msg.includes('derivative') || msg.includes('differentiation') || msg.includes('calculus')) {
        return `**Derivatives & Calculus** 📊

**Concept:** Rate of change at any instant

**Rules:**
• Power Rule: d/dx(xⁿ) = n·xⁿ⁻¹
• Product Rule: d/dx(uv) = u'v + uv'
• Chain Rule: d/dx(f(g(x))) = f'(g(x))·g'(x)

**Example Numerical:**
Find dy/dx if y = 3x³ - 5x² + 7x - 2

**Solution:**
dy/dx = d/dx(3x³) - d/dx(5x²) + d/dx(7x) - d/dx(2)
     = 3(3x²) - 5(2x) + 7(1) - 0
     = 9x² - 10x + 7

**Real-Life Applications:**
• **Physics:** Velocity = derivative of position (speed of a car)
• **Economics:** Marginal cost = derivative of total cost
• **Medicine:** Rate of drug concentration change in blood
• **Engineering:** Optimization of rocket trajectories

Need more examples or a specific problem solved? 🚀`;
    }

    // Integration
    if (msg.includes('integrat') || msg.includes('antiderivative')) {
        return `**Integration - Finding Area & Accumulation** 📐

**Basic Formulas:**
• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1)
• ∫sin(x) dx = -cos(x) + C
• ∫cos(x) dx = sin(x) + C
• ∫eˣ dx = eˣ + C

**Numerical Example:**
Evaluate: ∫(4x³ - 6x² + 2x - 5) dx

**Solution:**
= 4∫x³dx - 6∫x²dx + 2∫xdx - 5∫dx
= 4(x⁴/4) - 6(x³/3) + 2(x²/2) - 5x + C
= x⁴ - 2x³ + x² - 5x + C

**Real-World Uses:**
• **Physics:** Distance = integral of velocity (total distance traveled)
• **Economics:** Total profit = integral of marginal profit
• **Engineering:** Volume of irregular solids
• **Statistics:** Probability distributions (area under curve)

Want a definite integral or specific application? 🎯`;
    }

    // Physics - Mechanics
    if (msg.includes('physics') || msg.includes('force') || msg.includes('motion') || msg.includes('newton')) {
        return `**Physics - Mechanics & Motion** ⚡

**Newton's Laws:**
1. F = ma (Force = mass × acceleration)
2. Action = Reaction
3. Inertia (object stays at rest/motion)

**Example Problem:**
A car of mass 1000 kg accelerates from 0 to 60 km/h in 5 seconds. Find the force applied.

**Solution:**
v₁ = 0 km/h = 0 m/s
v₂ = 60 km/h = 60/3.6 = 16.67 m/s
t = 5 s
a = (v₂ - v₁)/t = 16.67/5 = 3.33 m/s²
F = ma = 1000 × 3.33 = 3330 N

**Real-Life Applications:**
• **Automotive:** Braking systems (deceleration)
• **Sports:** Baseball trajectory calculations
• **Space:** Rocket propulsion & orbital mechanics
• **Construction:** Load-bearing capacity of structures

Need help with kinematics, energy, or projectile motion? 🚗`;
    }

    // Chemistry
    if (msg.includes('chemistry') || msg.includes('chemical') || msg.includes('reaction') || msg.includes('mole')) {
        return `**Chemistry - Reactions & Calculations** 🧪

**Basic Concepts:**
• Mole = 6.022 × 10²³ particles (Avogadro's number)
• Molarity (M) = moles/liters
• Mass = moles × molecular weight

**Numerical Example:**
Find moles in 90g of water (H₂O)

**Solution:**
Molecular weight of H₂O = 2(1) + 16 = 18 g/mol
Moles = mass/molecular weight
     = 90/18 = 5 moles

**Real-World Applications:**
• **Medicine:** Drug dosage calculations (molarity)
• **Industry:** Chemical manufacturing ratios
• **Environment:** Air quality & pollution measurement
• **Food:** Nutritional content analysis

Need help with stoichiometry, pH, or equilibrium? 🔬`;
    }

    // Algebra & Equations
    if (msg.includes('algebra') || msg.includes('equation') || msg.includes('solve') || msg.includes('quadratic')) {
        return `**Algebra - Solving Equations** 🔢

**Quadratic Formula:** x = [-b ± √(b² - 4ac)] / 2a

**Example Problem:**
Solve: 2x² + 5x - 3 = 0

**Solution:**
a = 2, b = 5, c = -3
Discriminant = b² - 4ac = 25 - 4(2)(-3) = 25 + 24 = 49
x = [-5 ± √49] / 4
x = [-5 ± 7] / 4
x₁ = 2/4 = 0.5
x₂ = -12/4 = -3

**Real-Life Applications:**
• **Business:** Profit/loss calculations (break-even point)
• **Architecture:** Parabolic arch designs
• **Sports:** Trajectory of basketball shots
• **Finance:** Compound interest optimization

Want linear equations, systems, or inequalities? 📈`;
    }

    // Statistics & Probability
    if (msg.includes('statistic') || msg.includes('probability') || msg.includes('mean') || msg.includes('standard deviation')) {
        return `**Statistics & Probability** 📊

**Key Formulas:**
• Mean (x̄) = Σx / n
• Variance (σ²) = Σ(x - x̄)² / n
• Standard Deviation (σ) = √variance
• Probability (P) = favorable outcomes / total outcomes

**Example:**
Dataset: 12, 15, 18, 20, 25. Find mean and standard deviation.

**Solution:**
Mean = (12+15+18+20+25)/5 = 90/5 = 18
Deviations: -6, -3, 0, 2, 7
Squares: 36, 9, 0, 4, 49
Variance = (36+9+0+4+49)/5 = 98/5 = 19.6
SD = √19.6 ≈ 4.43

**Real Applications:**
• **Finance:** Risk assessment & portfolio management
• **Medicine:** Clinical trial analysis
• **Marketing:** Customer behavior prediction
• **Sports:** Player performance analytics

Need help with distributions, hypothesis testing, or regression? 📉`;
    }

    // Programming & Coding
    if (msg.includes('code') || msg.includes('program') || msg.includes('python') || msg.includes('javascript')) {
        return `**Programming - Real Problem Solving** 💻

**Example: Find Fibonacci Number**

**Problem:** Generate nth Fibonacci number (0, 1, 1, 2, 3, 5, 8...)

**Solution (Python):**
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Example: 7th Fibonacci
result = fibonacci(7)  # Output: 13
\`\`\`

**Real-World Applications:**
• **Finance:** Stock market analysis patterns
• **Nature:** Flower petal arrangements, shell spirals
• **Art:** Golden ratio in design
• **Biology:** Population growth modeling

**More Complex Example:**
\`\`\`python
# Binary Search - O(log n)
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

Need help with loops, arrays, objects, or specific algorithms? 🎮`;
    }

    // Economics & Business
    if (msg.includes('econom') || msg.includes('business') || msg.includes('profit') || msg.includes('cost')) {
        return `**Economics & Business Math** 💰

**Key Concepts:**
• Profit = Revenue - Cost
• Break-even: Revenue = Cost
• ROI = (Profit / Investment) × 100%

**Example Problem:**
A business sells product at $50/unit. Fixed costs = $10,000, variable cost = $20/unit. Find break-even point.

**Solution:**
Let x = number of units
Revenue = 50x
Total Cost = 10000 + 20x
Break-even: 50x = 10000 + 20x
30x = 10000
x = 334 units (rounded up)

**Real Applications:**
• **Startups:** Investment decisions & fundraising
• **Retail:** Pricing strategies & inventory management
• **Manufacturing:** Production optimization
• **Stock Market:** Portfolio diversification

Need help with supply-demand, elasticity, or financial ratios? 📊`;
    }

    // Geometry & Trigonometry
    if (msg.includes('geometry') || msg.includes('trigonometry') || msg.includes('triangle') || msg.includes('angle')) {
        return `**Geometry & Trigonometry** 📐

**Key Formulas:**
• sin²θ + cos²θ = 1
• Area of triangle = ½ × base × height
• Pythagorean: a² + b² = c²

**Example:**
A ladder 10m long leans against a wall at 60°. How high does it reach?

**Solution:**
sin(60°) = height / 10
height = 10 × sin(60°)
height = 10 × 0.866
height ≈ 8.66 meters

**Real Applications:**
• **Architecture:** Building design & roof angles
• **Navigation:** GPS & ship positioning (triangulation)
• **Astronomy:** Calculating distances to stars
• **Gaming:** 3D graphics rendering & collision detection
• **Surveying:** Land measurement

Need help with circles, polygons, or 3D shapes? 🏗️`;
    }

    // Data Structures & Algorithms
    if (msg.includes('dsa') || msg.includes('data structure') || msg.includes('algorithm')) {
        return `**Data Structures & Algorithms** 🔥

**Real-Life Examples:**
• **Arrays** → Contact list (ordered storage)
• **Stack** → Browser back button (LIFO)
• **Queue** → Print job queue (FIFO)
• **Trees** → File system hierarchy
• **Graphs** → Social networks, Google Maps routes
• **Hash Tables** → Dictionary, database indexing

**Practical Problem:**
Find duplicates in an array [1,2,3,2,4,3,5]

**Solution (Hash Map):**
\`\`\`python
def find_duplicates(arr):
    seen = {}
    duplicates = []
    for num in arr:
        if num in seen:
            duplicates.append(num)
        else:
            seen[num] = True
    return duplicates

result = find_duplicates([1,2,3,2,4,3,5])
# Output: [2, 3]
\`\`\`

**Applications:**
• **E-commerce:** Recommendation systems
• **Social Media:** Friend suggestions
• **Finance:** Fraud detection
• **Healthcare:** Patient record management

Want sorting, searching, or graph algorithms? 🚀`;
    }

    // Biology
    if (msg.includes('biology') || msg.includes('cell') || msg.includes('dna') || msg.includes('genetics')) {
        return `**Biology - Life Sciences** 🧬

**Cell Structure:**
• Nucleus - Control center (DNA)
• Mitochondria - Energy production (ATP)
• Ribosomes - Protein synthesis

**Genetics Example:**
If a plant is heterozygous Tt (tall), what offspring ratios?

**Punnett Square:**
\`\`\`
    T    t
T  TT   Tt
t  Tt   tt
\`\`\`
Ratio: 3 Tall : 1 Short (75% : 25%)

**Real Applications:**
• **Medicine:** Gene therapy for diseases
• **Agriculture:** GMO crops for higher yield
• **Forensics:** DNA fingerprinting
• **Ecology:** Conservation of endangered species

Need help with photosynthesis, evolution, or ecosystem? 🌱`;
    }

    // Study tips
    if (msg.includes('study') || msg.includes('tips') || msg.includes('learn') || msg.includes('prepare')) {
        return `**Comprehensive Study Strategies** 📖✨

**Proven Techniques:**
1. **Active Recall** - Test yourself without looking
2. **Spaced Repetition** - Review at increasing intervals
3. **Feynman Technique** - Teach concepts in simple terms
4. **Pomodoro** - 25 min focus + 5 min break
5. **Practice Problems** - Apply concepts to real scenarios

**For STEM Subjects:**
• Solve 5-10 numerical problems daily
• Create formula sheets with examples
• Watch visualization videos (Khan Academy, 3Blue1Brown)
• Form study groups for problem-solving
• Use real-life analogies

**For Conceptual Subjects:**
• Make mind maps connecting ideas
• Write summary notes in own words
• Discuss with peers
• Find real-world applications

**Time Management:**
📅 Week 1-2: Understand concepts + easy problems
📅 Week 3-4: Medium difficulty + mixed problems
📅 Final week: Past papers + revision

Need a subject-specific study plan? 🎯`;
    }

    // General Help
    if (msg.includes('help') || msg.includes('how') || msg.includes('what') || msg.includes('explain')) {
        return `**I'm here to help with everything!** 🤝

I can assist with:

📚 **Subjects:**
• Math (Algebra, Calculus, Statistics)
• Physics (Mechanics, Electricity, Thermodynamics)
• Chemistry (Organic, Inorganic, Physical)
• Computer Science (Programming, DSA, Databases)
• Economics & Business
• Biology & Life Sciences

🔢 **Problem Solving:**
• Step-by-step numerical solutions
• Real-life application examples
• Practice problems with explanations
• Formula derivations

💡 **Conceptual Learning:**
• Simple analogies & visual explanations
• Real-world connections
• Study strategies & tips

Just ask any question - theoretical or numerical, and I'll provide detailed explanations with examples! 😊

**Examples:**
"Solve: ∫x²dx"
"Explain photosynthesis with real example"
"How to find time complexity?"`;
    }

    // Default comprehensive response
    return `**Ask me anything!** 🎓

I can help with:

**Mathematics:** Calculus, Algebra, Statistics, Geometry
**Sciences:** Physics, Chemistry, Biology
**Programming:** Python, JavaScript, DSA, Algorithms
**Business:** Economics, Finance, Accounting
**Study Skills:** Time management, exam prep, learning techniques

**I provide:**
✅ Step-by-step solutions with numericals
✅ Real-life applications & examples
✅ Conceptual explanations in simple terms
✅ Practice problems & study tips

**Try asking:**
• "Solve derivative of x³ + 2x²"
• "Explain Newton's laws with examples"
• "How to calculate compound interest?"
• "Binary search algorithm with code"

What would you like to learn today? 😊`;
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
