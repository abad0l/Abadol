// Sound variables
let soundEnabled = true;
const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');
const successSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
const flipSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3');

// --- (كان كائن courses هنا وتم حذفه) ---

// متغير عام ليحمل البيانات بعد تحميلها
let courses;

// App state variables
let currentCourse = null;
let currentLecture = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizScore = 0;
let wrongAnswers = [];

// DOM elements (نعلن عنها هنا، ونقوم بتعيينها بعد تحميل الصفحة)
let homeSection, lecturesSection, lectureContentSection, resultSection,
    courseTitleElement, lectureTitleElement, lecturesContainer,
    quizContent, explanationContent, flipCardsContent,
    questionTextElement, optionsContainer, feedbackElement,
    currentQuestionElement, totalQuestionsElement, progressBar,
    prevBtn, nextBtn, lectureExplanationElement, flipCardsContainer,
    resultContainer, resultScoreElement, resultCorrectElement,
    resultIncorrectElement, resultPercentageElement, resultTotalElement,
    meterFill, wrongQuestionsContainer, wrongQuestionsList,
    feedbackModal, feedbackForm, successMessage,
    soundToggle, darkModeToggle, feedbackBtn;

// انتظر حتى يتم تحميل محتوى الصفحة بالكامل
document.addEventListener('DOMContentLoaded', () => {
    // 1. قم بتعيين كل عناصر الصفحة (DOM Elements)
    homeSection = document.getElementById('home-section');
    lecturesSection = document.getElementById('lectures-section');
    lectureContentSection = document.getElementById('lecture-content-section');
    resultSection = document.getElementById('result-section');
    courseTitleElement = document.getElementById('course-title');
    lectureTitleElement = document.getElementById('lecture-title');
    lecturesContainer = document.getElementById('lectures-container');
    quizContent = document.getElementById('quiz-content');
    explanationContent = document.getElementById('explanation-content');
    flipCardsContent = document.getElementById('flip-cards-content');
    questionTextElement = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    feedbackElement = document.getElementById('feedback');
    currentQuestionElement = document.getElementById('current-question');
    totalQuestionsElement = document.getElementById('total-questions');
    progressBar = document.getElementById('progress-bar');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    lectureExplanationElement = document.getElementById('lecture-explanation');
    flipCardsContainer = document.getElementById('flip-cards-container');
    resultContainer = document.getElementById('result-container');
    resultScoreElement = document.getElementById('result-score');
    resultCorrectElement = document.getElementById('result-correct');
    resultIncorrectElement = document.getElementById('result-incorrect');
    resultPercentageElement = document.getElementById('result-percentage');
    resultTotalElement = document.getElementById('result-total');
    meterFill = document.getElementById('meter-fill');
    wrongQuestionsContainer = document.getElementById('wrong-questions-container');
    wrongQuestionsList = document.getElementById('wrong-questions-list');
    feedbackModal = document.getElementById('feedback-modal');
    feedbackForm = document.getElementById('feedback-form');
    successMessage = document.getElementById('success-message');
    soundToggle = document.getElementById('sound-toggle');
    darkModeToggle = document.getElementById('dark-mode-toggle');
    feedbackBtn = document.getElementById('feedback-btn');

    // 2. قم بجلب البيانات من ملف JSON
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            courses = data; // 3. قم بتخزين البيانات في المتغير العام

            // 4. الآن فقط، قم ببدء تشغيل التطبيق
            init();
        })
        .catch(error => {
            console.error("Could not load course data:", error);
            // اعرض رسالة خطأ للمستخدم
            document.body.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">
                Error: Could not load data.
                <br><small style="color: #333;">(This app must be run on a server. You cannot open index.html directly.)</small>
                </h1>`;
        });
});


// Initialize the app (لا يتم استدعاؤها إلا بعد تحميل الصفحة والبيانات)
function init() {
    // Show home section by default
    showSection('home');
    // Set up event listeners
    setupEventListeners();
    // Check for saved preferences
    checkPreferences();
}

// Set up event listeners
function setupEventListeners() {
    // Sound toggle
    soundToggle.addEventListener('click', toggleSound);
    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // Feedback form submission
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    // Feedback button
    feedbackBtn.addEventListener('click', openFeedbackForm);
    // Close modal when clicking outside
    feedbackModal.addEventListener('click', function(e) {
        if (e.target === feedbackModal) {
            closeFeedbackForm();
        }
    });
}
// Check for saved preferences
function checkPreferences() {
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    // Check for sound preference
    if (localStorage.getItem('soundEnabled') === 'false') {
        soundEnabled = false;
        soundToggle.classList.add('active');
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
}
// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    if (soundEnabled) {
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundToggle.classList.remove('active');
    } else {
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundToggle.classList.add('active');
    }
}
// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}
// Show specific section
function showSection(section) {
    homeSection.style.display = 'none';
    lecturesSection.style.display = 'none';
    lectureContentSection.style.display = 'none';
    resultSection.style.display = 'none';
    switch(section) {
        case 'home':
            homeSection.style.display = 'block';
            break;
        case 'lectures':
            lecturesSection.style.display = 'block';
            break;
        case 'lecture-content':
            lectureContentSection.style.display = 'block';
            break;
        case 'result':
            resultSection.style.display = 'block';
            break;
    }
}
// Load course lectures
function loadCourse(courseId) {
    currentCourse = courses[courseId];
    courseTitleElement.textContent = currentCourse.title;
    // Clear previous lectures
    lecturesContainer.innerHTML = '';
    // Add lectures to the grid
    for (const lectureId in currentCourse.lectures) {
        const lecture = currentCourse.lectures[lectureId];
        const lectureCard = document.createElement('div');
        lectureCard.className = 'lecture-card';
        lectureCard.onclick = () => loadLecture(lectureId);
        lectureCard.innerHTML = `
            <div class="lecture-icon">
                <i class="${lecture.icon}"></i>
            </div>
            <div class="lecture-title">${lecture.title}</div>
            <div class="lecture-desc">${lecture.description}</div>
        `;
        lecturesContainer.appendChild(lectureCard);
    }
    showSection('lectures');
}
// Load lecture content
function loadLecture(lectureId) {
    currentLecture = currentCourse.lectures[lectureId];
    lectureTitleElement.textContent = currentLecture.title;
    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];
    // Load quiz content
    loadQuestion();
    // Load explanation content
    lectureExplanationElement.innerHTML = currentLecture.explanation;
    // Load flip cards
    loadFlipCards();
    showSection('lecture-content');
    showContent('quiz');
}
// Show specific content section
function showContent(content) {
    // Update active button
    const buttons = document.querySelectorAll('.content-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    // Hide all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    // Show selected content
    switch(content) {
        case 'quiz':
            document.querySelector('.content-btn[onclick="showContent(\'quiz\')"]').classList.add('active');
            quizContent.classList.add('active');
            break;
        case 'explanation':
            document.querySelector('.content-btn[onclick="showContent(\'explanation\')"]').classList.add('active');
            explanationContent.classList.add('active');
            break;
        case 'flip-cards':
            document.querySelector('.content-btn[onclick="showContent(\'flip-cards\')"]').classList.add('active');
            flipCardsContent.classList.add('active');
            break;
    }
}
// Load current question
function loadQuestion() {
    const question = currentLecture.quiz[currentQuestionIndex];
    // Update question counter
    currentQuestionElement.textContent = currentQuestionIndex + 1;
    totalQuestionsElement.textContent = currentLecture.quiz.length;
    // Update progress bar
    progressBar.style.width = `${((currentQuestionIndex) / currentLecture.quiz.length) * 100}%`;
    // Set question text
    questionTextElement.textContent = question.question;
    // Set category
    document.getElementById('category').textContent = currentLecture.title;
    // Clear previous options
    optionsContainer.innerHTML = '';
    // Add options
    for (const option in question.options) {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.onclick = () => selectOption(option);
        optionElement.innerHTML = `
            <div class="option-letter">${option}</div>
            <div class="option-text">${question.options[option]}</div>
        `;
        optionsContainer.appendChild(optionElement);
    }
    // Update navigation buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    // Hide feedback
    feedbackElement.style.display = 'none';
    feedbackElement.className = 'feedback';
    // If user already answered this question, show their answer
    if (userAnswers[currentQuestionIndex] !== undefined) {
        selectOption(userAnswers[currentQuestionIndex], true);
    }
}
// Select an option
function selectOption(option, fromHistory = false) {
    const question = currentLecture.quiz[currentQuestionIndex];
    const options = document.querySelectorAll('.option');
    // If already answered, don't allow changes
    if (userAnswers[currentQuestionIndex] !== undefined && !fromHistory) {
        return;
    }
    // Store answer if not from history
    if (!fromHistory) {
        userAnswers[currentQuestionIndex] = option;
    }
    // Highlight selected option
    options.forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect');
        const optLetter = opt.querySelector('.option-letter').textContent;
        if (optLetter === option) {
            opt.classList.add('selected');
        }
        if (optLetter === question.correctAnswer) {
            opt.classList.add('correct');
        }
    });
    // Show feedback if answer was selected now (not from history)
    if (!fromHistory) {
        const isCorrect = option === question.correctAnswer;
        showFeedback(isCorrect, question.explanation);
        // Play sound
        if (soundEnabled) {
            if (isCorrect) {
                correctSound.play();
            } else {
                wrongSound.play();
            }
        }
    }
}
// Show feedback for answer
function showFeedback(isCorrect, explanation) {
    feedbackElement.style.display = 'block';
    feedbackElement.innerHTML = `
        <i class="fas fa-${isCorrect ? 'check' : 'times'} feedback-icon"></i>
        ${isCorrect ? 'Correct!' : 'Incorrect!'} ${explanation}
    `;
    feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect');
    // Auto-advance based on answer correctness
    const delay = isCorrect ? 500 : 2000; // 0.5s for correct, 2s for incorrect
    setTimeout(() => {
        if (currentQuestionIndex < currentLecture.quiz.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            calculateResults();
            showSection('result');
        }
    }, delay);
}
// Show hint for current question
function showHint() {
    const question = currentLecture.quiz[currentQuestionIndex];
    const correctOption = question.correctAnswer;
    feedbackElement.style.display = 'block';
    feedbackElement.innerHTML = `
        <i class="fas fa-lightbulb feedback-icon"></i>
        Hint: The correct answer is ${correctOption}.
    `;
    feedbackElement.className = 'feedback';
}
// Save question as image
function saveQuestionAsImage() {
    const questionContainer = document.querySelector('.question-container');
    html2canvas(questionContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = `nursing-question-${currentCourse.title}-${currentLecture.title}-${currentQuestionIndex+1}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}
// Go to next question
function nextQuestion() {
    if (currentQuestionIndex < currentLecture.quiz.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        calculateResults();
        showSection('result');
    }
}
// Go to previous question
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}
// Load flip cards
function loadFlipCards() {
    flipCardsContainer.innerHTML = '';
    currentLecture.flipCards.forEach((card, index) => {
        const flipCard = document.createElement('div');
        flipCard.className = 'flip-card';
        flipCard.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="flip-card-icon">
                        <i class="fas fa-question"></i>
                    </div>
                    <div class="flip-card-title">Card ${index + 1}</div>
                    <div class="flip-card-text">${card.front}</div>
                </div>
                <div class="flip-card-back">
                    <div class="flip-card-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="flip-card-title">Answer</div>
                    <div class="flip-card-text">${card.back}</div>
                </div>
            </div>
        `;
        flipCardsContainer.appendChild(flipCard);
    });
}
// Calculate quiz results
function calculateResults() {
    quizScore = 0;
    wrongAnswers = [];
    currentLecture.quiz.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            quizScore++;
        } else {
            wrongAnswers.push({
                question: question.question,
                userAnswer: question.options[userAnswers[index]] || 'Not answered',
                correctAnswer: question.options[question.correctAnswer],
                explanation: question.explanation
            });
        }
    });
    const percentage = Math.round((quizScore / currentLecture.quiz.length) * 100);
    // Update result elements
    resultScoreElement.textContent = `${percentage}%`;
    resultCorrectElement.textContent = quizScore;
    resultIncorrectElement.textContent = wrongAnswers.length;
    resultPercentageElement.textContent = `${percentage}%`;
    resultTotalElement.textContent = currentLecture.quiz.length;
    // Update meter
    meterFill.style.width = `${percentage}%`;
    // Set result title and icon based on performance
    const resultIcon = document.querySelector('.result-icon i');
    if (percentage >= 80) {
        resultContainer.className = 'result-container success';
        resultIcon.className = 'fas fa-trophy';
        document.getElementById('result-title').textContent = 'Excellent Work!';
        // Create confetti effect
        createConfetti();
    } else if (percentage >= 50) {
        resultContainer.className = 'result-container average';
        resultIcon.className = 'fas fa-star';
        document.getElementById('result-title').textContent = 'Good Job!';
    } else {
        resultContainer.className = 'result-container poor';
        resultIcon.className = 'fas fa-redo';
        document.getElementById('result-title').textContent = 'Keep Practicing!';
    }
    // Play success sound
    if (soundEnabled) {
        successSound.play();
    }
}
// Create confetti effect
function createConfetti() {
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        // Random position and color
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = getRandomColor();
        // Random size
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        // Random animation duration
        const duration = Math.random() * 3 + 2;
        confetti.style.animationDuration = `${duration}s`;
        document.body.appendChild(confetti);
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}
// Get random color for confetti
function getRandomColor() {
    const colors = [
        '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', 
        '#7209b7', '#f72585', '#b5179e', '#560bad',
        '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
// Show wrong questions
function showWrongQuestions() {
    wrongQuestionsList.innerHTML = '';
    if (wrongAnswers.length === 0) {
        wrongQuestionsList.innerHTML = '<p style="text-align: center; color: var(--medium-gray);">No wrong answers to show!</p>';
    } else {
        wrongAnswers.forEach((item, index) => {
            const wrongQuestion = document.createElement('div');
            wrongQuestion.className = 'wrong-question';
            wrongQuestion.innerHTML = `
                <div class="wrong-question-title">Question ${index + 1}</div>
                <p>${item.question}</p>
                <div class="wrong-answer">
                    <span class="answer-label">Your Answer:</span>
                    <span>${item.userAnswer}</span>
                </div>
                <div class="correct-answer">
                    <span class="answer-label">Correct Answer:</span>
                    <span>${item.correctAnswer}</span>
                </div>
                <div class="explanation">
                    <strong>Explanation:</strong> ${item.explanation}
                </div>
            `;
            wrongQuestionsList.appendChild(wrongQuestion);
        });
    }
    wrongQuestionsContainer.style.display = 'block';
    window.scrollTo(0, document.body.scrollHeight);
}
// Close wrong questions section
function closeWrongQuestions() {
    wrongQuestionsContainer.style.display = 'none';
}
// Restart the quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];
    loadQuestion();
    showSection('lecture-content');
    showContent('quiz');
}
// Go back to courses
function goBackToCourses() {
    showSection('home');
}
// Go back to lectures
function goBackToLectures() {
    showSection('lectures');
}
// Go back to lecture content from results
function goBackToLectureContent() {
    showSection('lecture-content');
    showContent('quiz');
}
// Open feedback form
function openFeedbackForm() {
    feedbackModal.style.display = 'flex';
}
// Close feedback form
function closeFeedbackForm() {
    feedbackModal.style.display = 'none';
    successMessage.style.display = 'none';
}
// Handle feedback form submission
function handleFeedbackSubmit(e) {
    e.preventDefault();
    // Show success message
    successMessage.style.display = 'block';
    // Reset form
    feedbackForm.reset();
    // Submit form data
    const formData = new FormData(feedbackForm);
    fetch(feedbackForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    });
    // Hide form after 3 seconds
    setTimeout(() => {
        closeFeedbackForm();
    }, 3000);
}

// (الدالة init() يتم استدعاؤها الآن فقط بعد تحميل البيانات بنجاح)