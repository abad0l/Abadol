// Sound variables
let soundEnabled = true;
const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');
const successSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
const flipSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3');

// Global variable to hold course data after fetching
let courses;

// App state variables
let currentCourse = null;
let currentLecture = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizScore = 0;
let wrongAnswers = [];

// DOM elements (declared here, assigned after DOM is loaded)
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
    soundToggle, darkModeToggle, feedbackBtn,
    coursesGrid; // Added coursesGrid

// Wait until the HTML content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Assign all DOM Elements
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
    coursesGrid = document.querySelector('.courses-grid'); // Assign coursesGrid

    // 2. Fetch data from JSON file
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Parse JSON response
        })
        .then(data => {
            courses = data; // 3. Store data in the global variable

            // 4. Initialize the application only after data is loaded
            init();
        })
        .catch(error => {
            console.error("Could not load course data:", error);
            // Display a user-friendly error message
            coursesGrid.innerHTML = `<p style="color: red; text-align: center; grid-column: 1 / -1;">
                Failed to load course data.<br>
                Ensure you are running this from a web server.<br>
                (${error.message})
                </p>`;
        });
});


// Initialize the app (called only after DOM is loaded and data is fetched)
function init() {
    console.log("Initializing application...");
    // Load course cards onto the home page
    loadCourseCards();
    // Show home section by default
    showSection('home');
    // Set up event listeners for buttons etc.
    setupEventListeners();
    // Check for user's saved preferences (dark mode, sound)
    checkPreferences();
    console.log("Application initialized.");
}

// Load course cards dynamically onto the home page
function loadCourseCards() {
    if (!courses || !coursesGrid) {
        console.error("Courses data or grid container not available for loading cards.");
        if (coursesGrid) coursesGrid.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1;">Error: Cannot display courses.</p>';
        return;
    }

    coursesGrid.innerHTML = ''; // Clear loading message or previous cards
    let delay = 0.1; // Initial animation delay

    for (const courseId in courses) {
        const course = courses[courseId];
        // Ensure course is an object and has a title
        if (typeof course === 'object' && course !== null && course.title) {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.dataset.courseId = courseId;
            courseCard.setAttribute('onclick', `loadCourse('${courseId}')`);
            courseCard.style.animationDelay = `${delay}s`;

            const title = course.title;
            const description = course.description || 'No description available.';
            const iconClass = course.icon || 'fas fa-book'; // Default icon

            courseCard.innerHTML = `
                <div class="course-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="course-title">${title}</div>
                <div class="course-desc">${description}</div>
            `;
            coursesGrid.appendChild(courseCard);
            delay += 0.1;
        } else {
             console.warn(`Skipping invalid course data for ID: ${courseId}`);
        }
    }
}


// Set up event listeners for global controls
function setupEventListeners() {
    if (!soundToggle || !darkModeToggle || !feedbackForm || !feedbackBtn || !feedbackModal) {
        console.error("One or more required elements for event listeners not found.");
        return;
    }
    // Sound toggle
    soundToggle.addEventListener('click', toggleSound);
    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Feedback form submission
    feedbackForm.addEventListener('submit', handleFeedbackSubmitCorrectly); 

    // Feedback button to open modal
    feedbackBtn.addEventListener('click', openFeedbackForm);
    // Close modal when clicking outside its content area
    feedbackModal.addEventListener('click', function(e) {
        if (e.target === feedbackModal) {
            closeFeedbackForm();
        }
    });

     // Add listeners for navigation buttons inside lecture content
     const contentNavButtons = document.querySelectorAll('.content-nav .content-btn');
     contentNavButtons.forEach(button => {
         button.addEventListener('click', (event) => {
             const targetButton = event.target.closest('.content-btn');
             if (targetButton && targetButton.dataset.content) {
                 showContent(targetButton.dataset.content);
             }
         });
     });
}

// Check for saved user preferences in localStorage
function checkPreferences() {
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        if(darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
         if(darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    // Check for sound preference
    if (localStorage.getItem('soundEnabled') === 'false') {
        soundEnabled = false;
        if(soundToggle) {
            soundToggle.classList.add('active');
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    } else {
         soundEnabled = true; // Ensure it's true if not explicitly false
         if(soundToggle) {
             soundToggle.classList.remove('active');
             soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
         }
    }
}

// Toggle sound on/off and update button/localStorage
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    if (soundToggle) { // Check if element exists
        if (soundEnabled) {
            soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundToggle.classList.remove('active');
        } else {
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundToggle.classList.add('active');
        }
    }
}

// Toggle dark mode on/off and update button/localStorage
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (darkModeToggle) { // Check if element exists
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

// Show specific section (home, lectures, lecture-content, result)
function showSection(sectionId) {
    // Hide all main sections first
    [homeSection, lecturesSection, lectureContentSection, resultSection].forEach(section => {
        if (section) section.style.display = 'none';
    });

    // Show the requested section
    const sectionToShow = document.getElementById(sectionId + '-section');
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
        console.log(`Showing section: ${sectionId}-section`);
    } else {
        console.error(`Section with ID ${sectionId}-section not found.`);
        if (homeSection) homeSection.style.display = 'block';
    }
     window.scrollTo(0, 0);
}

// Load lectures for a specific course
function loadCourse(courseId) {
    if (!courses || !courses[courseId]) {
        console.error(`Course data not found for ID: ${courseId}`);
        return;
    }
    currentCourse = courses[courseId];
    if(courseTitleElement) courseTitleElement.textContent = currentCourse.title || 'Course Title';

    if(lecturesContainer) lecturesContainer.innerHTML = '';
    else {
        console.error("Lectures container not found.");
        return;
    }

    let lectureCount = 0;
    if (currentCourse.lectures && typeof currentCourse.lectures === 'object') {
        for (const lectureId in currentCourse.lectures) {
            const lecture = currentCourse.lectures[lectureId];
             if (typeof lecture === 'object' && lecture !== null && lecture.title) { 
                const lectureCard = document.createElement('div');
                lectureCard.className = 'lecture-card';
                lectureCard.setAttribute('onclick', `loadLecture('${lectureId}')`);

                const icon = lecture.icon || 'fas fa-chalkboard-teacher'; // Default icon
                const title = lecture.title;
                const description = lecture.description || 'No description.';

                lectureCard.innerHTML = `
                    <div class="lecture-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="lecture-title">${title}</div>
                    <div class="lecture-desc">${description}</div>
                `;
                lecturesContainer.appendChild(lectureCard);
                lectureCount++;
            } else {
                 console.warn(`Invalid lecture data found for lecture ID ${lectureId} in course ${courseId}`);
            }
        }
    } else {
         console.warn(`No lectures object found for course ID: ${courseId}`);
    }


    if (lectureCount === 0) {
        lecturesContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--medium-gray);">No lectures currently available for this course.</p>';
    }

    showSection('lectures');
}

// Load content (quiz, explanation, flip cards) for a specific lecture
function loadLecture(lectureId) {
    if (!currentCourse || !currentCourse.lectures || !currentCourse.lectures[lectureId]) {
        console.error(`Lecture data not found for ID: ${lectureId} in course ${currentCourse?.title}`);
        showSection('lectures'); 
        return;
    }
    currentLecture = currentCourse.lectures[lectureId];
    if(lectureTitleElement) lectureTitleElement.textContent = currentLecture.title || 'Lecture Title';

    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];

    // --- Load content for each section ---
    
    // Reset quiz content container in case it was modified
    if (quizContent) {
        quizContent.innerHTML = `
            <div class="question-counter">
                Question <span id="current-question">1</span>/<span id="total-questions">?</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <div class="question-container">
                <div id="category" class="category">Lecture Title</div>
                <h2 id="question-text">Question text will appear here...</h2>
                <div class="options" id="options-container"></div>
                <div class="feedback" id="feedback" style="display: none;"></div>
                <div class="buttons-container">
                    <button id="prev-btn" class="btn btn-outline" onclick="prevQuestion()" disabled>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    <div>
                        <button class="hint-btn" onclick="showHint()" id="hint-btn" title="Show Explanation">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                        <button class="save-btn" onclick="saveQuestionAsImage()" title="Save Question as Image">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <button id="next-btn" class="btn" onclick="nextQuestion()" disabled>
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        // Re-assign DOM elements inside the quiz container
        questionTextElement = document.getElementById('question-text');
        optionsContainer = document.getElementById('options-container');
        feedbackElement = document.getElementById('feedback');
        currentQuestionElement = document.getElementById('current-question');
        totalQuestionsElement = document.getElementById('total-questions');
        progressBar = document.getElementById('progress-bar');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
    }

    // Quiz (Load first question)
    if (currentLecture.quiz && Array.isArray(currentLecture.quiz) && currentLecture.quiz.length > 0) {
        loadQuestion(); 
    } else {
        console.warn(`No quiz questions found for lecture: ${lectureId}`);
        if(quizContent) {
            quizContent.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--medium-gray);">No quiz available for this lecture.</p>';
        }
         if(currentQuestionElement) currentQuestionElement.textContent = '0';
         if(totalQuestionsElement) totalQuestionsElement.textContent = '0';
         if(progressBar) progressBar.style.width = '0%';
    }

    // Explanation
    if (lectureExplanationElement) {
        lectureExplanationElement.innerHTML = currentLecture.explanation || '<p style="color: var(--medium-gray);">No explanation available for this lecture.</p>';
    } else {
         console.error("Explanation container element not found.");
    }

    // Flip Cards
    if (flipCardsContainer) {
        loadFlipCards(); 
    } else {
        console.error("Flip cards container element not found.");
    }
    // --- End loading content ---

    showSection('lecture-content');
    setupContentTabs(); 
}

// Setup the initial state of content tabs
function setupContentTabs() {
    const quizAvailable = currentLecture?.quiz && Array.isArray(currentLecture.quiz) && currentLecture.quiz.length > 0;
    const explanationAvailable = currentLecture?.explanation && currentLecture.explanation.trim() !== '<p>Explanation currently unavailable.</p>' && currentLecture.explanation.trim() !== '';
    const cardsAvailable = currentLecture?.flipCards && Array.isArray(currentLecture.flipCards) && currentLecture.flipCards.length > 0;
    
    // Determine the first available tab
    let initialTab = 'quiz'; // Default to quiz
    if (!quizAvailable) {
        initialTab = 'explanation'; // If no quiz, try explanation
        if (!explanationAvailable) {
            initialTab = 'flip-cards'; // If no explanation, try cards
        }
    }
     
    showContent(initialTab);
}


// Show specific content section within the lecture page (quiz, explanation, flip-cards)
function showContent(contentId) {
     if (!lectureContentSection) return; 

    // Update active button state
    const buttons = lectureContentSection.querySelectorAll('.content-nav .content-btn');
    buttons.forEach(btn => {
        if (btn.dataset.content === contentId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Hide all content sections first
    const sections = lectureContentSection.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active'); 
    });

    // Show the selected content section
    const sectionToShow = document.getElementById(contentId + '-content');
    if (sectionToShow) {
        sectionToShow.classList.add('active'); 
        console.log(`Showing content section: ${contentId}-content`);
    } else {
         console.error(`Content section with ID ${contentId}-content not found.`);
         const fallbackSection = document.getElementById('explanation-content') || document.getElementById('quiz-content');
         if(fallbackSection) fallbackSection.classList.add('active');
    }
}

// Load the current question based on currentQuestionIndex
function loadQuestion() {
     if (!currentLecture || !currentLecture.quiz || currentLecture.quiz.length === 0 || !questionTextElement || !optionsContainer || !currentQuestionElement || !totalQuestionsElement || !progressBar || !prevBtn || !nextBtn || !feedbackElement) {
         console.error("Cannot load question: Missing data or essential DOM elements.");
         if (optionsContainer) optionsContainer.innerHTML = '<p style="color: red;">Error loading question.</p>';
         return;
     }

    const question = currentLecture.quiz[currentQuestionIndex];
     if (!question || typeof question !== 'object' || !question.question || !question.options) {
         console.error(`Invalid question data at index ${currentQuestionIndex}`);
         if (optionsContainer) optionsContainer.innerHTML = '<p style="color: red;">Invalid question data.</p>';
         return;
     }

    // Update question counter
    currentQuestionElement.textContent = currentQuestionIndex + 1;
    totalQuestionsElement.textContent = currentLecture.quiz.length;

    // Update progress bar
    progressBar.style.width = `${((currentQuestionIndex + 1) / currentLecture.quiz.length) * 100}%`; 

    // Set question text
    questionTextElement.textContent = question.question;

    // Set category (Lecture title)
    const categoryElement = document.getElementById('category');
    if(categoryElement) categoryElement.textContent = currentLecture.title || '';

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Add options dynamically
    for (const optionKey in question.options) {
        if (Object.hasOwnProperty.call(question.options, optionKey)) {
            const optionText = question.options[optionKey];
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.dataset.optionKey = optionKey;
            optionElement.addEventListener('click', () => selectOption(optionKey));

            optionElement.innerHTML = `
                <div class="option-letter">${optionKey}</div>
                <div class="option-text">${optionText}</div>
            `;
            optionsContainer.appendChild(optionElement);
        }
    }

    // Update navigation buttons enabled/disabled state
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = true; // Disable next until an answer is selected (or if already answered)

    // Hide feedback area
    feedbackElement.style.display = 'none';
    feedbackElement.className = 'feedback'; 

    // If user already answered this question (navigating back/forward)
    if (userAnswers[currentQuestionIndex] !== undefined) {
        highlightPreviousAnswer(userAnswers[currentQuestionIndex]);
    }
}

// Highlight the previously selected answer and the correct answer
function highlightPreviousAnswer(selectedOptionKey) {
     if (!currentLecture || !currentLecture.quiz) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const options = optionsContainer.querySelectorAll('.option');

    options.forEach(opt => {
        const optKey = opt.dataset.optionKey;
        opt.classList.remove('selected', 'correct', 'incorrect'); 

        if (optKey === question.correctAnswer) {
            opt.classList.add('correct');
        }

        if (optKey === selectedOptionKey) {
            opt.classList.add('selected'); 
            if (selectedOptionKey !== question.correctAnswer) {
                opt.classList.add('incorrect');
            }
        }
         opt.style.pointerEvents = 'none';
         opt.style.cursor = 'default';
    });

     feedbackElement.innerHTML = `
        <i class="fas fa-info-circle feedback-icon"></i> 
        ${question.explanation || 'No explanation available.'}
    `;
     feedbackElement.className = 'feedback explanation-only'; 
     feedbackElement.style.display = 'block';
     feedbackElement.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
     feedbackElement.style.color = 'var(--dark-color)';
     feedbackElement.style.borderLeftColor = 'var(--primary-color)';

    if(nextBtn) nextBtn.disabled = false;
}


// Handle user selecting an option
function selectOption(selectedOptionKey) {
     if (!currentLecture || !currentLecture.quiz) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const options = optionsContainer.querySelectorAll('.option');

    if (userAnswers[currentQuestionIndex] !== undefined) {
         console.log("Question already answered.");
        return;
    }

    userAnswers[currentQuestionIndex] = selectedOptionKey;
    const isCorrect = selectedOptionKey === question.correctAnswer;

    options.forEach(opt => {
        const optKey = opt.dataset.optionKey;
        if (optKey === selectedOptionKey) {
            opt.classList.add('selected');
            if (!isCorrect) {
                opt.classList.add('incorrect');
            }
        }
        if (optKey === question.correctAnswer) {
            opt.classList.add('correct');
        }
        opt.style.pointerEvents = 'none';
        opt.style.cursor = 'default';
    });

    showFeedback(isCorrect, question.explanation);

    if (soundEnabled) {
        if (isCorrect) {
            correctSound.play().catch(e => console.error("Error playing correct sound:", e));
        } else {
            wrongSound.play().catch(e => console.error("Error playing wrong sound:", e));
        }
    }

     if(nextBtn) nextBtn.disabled = false;
}


// Show feedback message and explanation, then auto-advance or finish
function showFeedback(isCorrect, explanation) {
    if (!feedbackElement || !nextBtn) {
         console.error("Feedback element or next button not found.");
         return;
    }

    feedbackElement.style.display = 'block';
    feedbackElement.innerHTML = `
        <i class="fas fa-${isCorrect ? 'check' : 'times'} feedback-icon"></i>
        ${isCorrect ? 'Correct!' : 'Incorrect!'} ${explanation || ''}
    `;
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;

    // Enable the next button after showing feedback
    nextBtn.disabled = false;

    // --- *** START: RE-ENABLED AUTO-ADVANCE *** ---
    const delay = isCorrect ? 1500 : 3000; // 1.5s for correct, 3s for incorrect
    setTimeout(() => {
        // Check if we are still on the same question index before advancing
        if (userAnswers[currentQuestionIndex] !== undefined) {
             if (currentQuestionIndex < currentLecture.quiz.length - 1) {
                 nextQuestion(); // Go to next question
             } else {
                 calculateResults(); // All questions answered, go to results
                 showSection('result');
             }
        }
    }, delay);
    // --- *** END: RE-ENABLED AUTO-ADVANCE *** ---
}

// Show hint (explanation) for the current question
function showHint() {
     if (!currentLecture || !currentLecture.quiz || !feedbackElement) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const explanation = question.explanation;

    feedbackElement.style.display = 'block';
    feedbackElement.innerHTML = `
        <i class="fas fa-lightbulb feedback-icon"></i>
        <strong>Hint/Explanation:</strong> ${explanation || 'No additional explanation available.'}
    `;
     feedbackElement.className = 'feedback hint';
     feedbackElement.style.backgroundColor = 'rgba(255, 193, 7, 0.1)'; 
     feedbackElement.style.color = '#856404';
     feedbackElement.style.borderLeftColor = 'var(--warning-color)';
}

// Save the current question container as a PNG image
function saveQuestionAsImage() {
    const questionContainer = document.querySelector('#quiz-content .question-container');
    if (questionContainer && typeof html2canvas === 'function') {
        html2canvas(questionContainer, {
             backgroundColor: document.body.classList.contains('dark-mode') ? '#2b2d42' : '#ffffff', 
             scale: 2 
        }).then(canvas => {
            const link = document.createElement('a');
            const courseTitleSafe = currentCourse?.title?.replace(/[^a-z0-9]/gi, '_') || 'course';
            const lectureTitleSafe = currentLecture?.title?.replace(/[^a-z0-9]/gi, '_') || 'lecture';
            const questionNum = currentQuestionIndex + 1;
            link.download = `MrNursawy_${courseTitleSafe}_${lectureTitleSafe}_Q${questionNum}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
             console.error('Error generating image with html2canvas:', err);
             alert('Sorry, an error occurred while saving the image.');
        });
    } else {
         console.error('html2canvas function not found or question container missing.');
         alert('Unable to save image at this time.');
    }
}


// Go to the next question or results page
function nextQuestion() {
     if (!currentLecture || !currentLecture.quiz) return;
    if (currentQuestionIndex < currentLecture.quiz.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        calculateResults();
        showSection('result');
    }
}

// Go to the previous question
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Load flip cards for the current lecture
function loadFlipCards() {
    if (!flipCardsContainer) {
         console.error("Flip cards container element not found for loading.");
         return; 
    }

    flipCardsContainer.innerHTML = ''; 

    if (!currentLecture || !currentLecture.flipCards || !Array.isArray(currentLecture.flipCards) || currentLecture.flipCards.length === 0) {
        console.warn(`No flip cards found for lecture: ${currentLecture?.title}`);
        flipCardsContainer.innerHTML = '<p style="text-align: center; color: var(--medium-gray);">No flip cards available for this lecture.</p>';
        return;
    }

    currentLecture.flipCards.forEach((card, index) => {
         if (typeof card === 'object' && card.front && card.back) { 
            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card';
            flipCard.setAttribute('tabindex', '0');
             flipCard.addEventListener('click', () => {
                 flipCard.classList.toggle('flipped'); 
                 if (soundEnabled) flipSound.play().catch(e => console.error("Error playing flip sound:", e));
             });
             flipCard.addEventListener('keypress', (e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault(); // Prevent spacebar from scrolling
                     flipCard.classList.toggle('flipped');
                     if (soundEnabled) flipSound.play().catch(e => console.error("Error playing flip sound:", e));
                 }
             });


            flipCard.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <div class="flip-card-icon">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <div class="flip-card-title">Card ${index + 1}</div>
                        <div class="flip-card-text">${card.front}</div>
                        <div class="flip-card-hint">(Click to see answer)</div>
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-card-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="flip-card-title">Answer</div>
                        <div class="flip-card-text">${card.back}</div>
                         ${card.details ? `<div class="flip-card-details"><span class="detail-label">Details:</span> ${card.details}</div>` : ''}
                    </div>
                </div>
            `;
            flipCardsContainer.appendChild(flipCard);
        } else {
             console.warn(`Invalid flip card data at index ${index} for lecture ${currentLecture.title}`);
        }
    });
}
// Calculate and display quiz results
function calculateResults() {
     if (!currentLecture || !currentLecture.quiz || !resultScoreElement || !resultCorrectElement || !resultIncorrectElement || !resultPercentageElement || !resultTotalElement || !meterFill || !resultContainer) {
         console.error("Cannot calculate results: Missing data or essential result DOM elements.");
         if (resultContainer) resultContainer.innerHTML = '<p style="color:red; text-align:center;">An error occurred while calculating results.</p>';
         return;
     }

    quizScore = 0;
    wrongAnswers = []; 

    currentLecture.quiz.forEach((question, index) => {
        const userAnswer = userAnswers[index]; 
        const correctAnswer = question.correctAnswer;

        if (userAnswer === correctAnswer) {
            quizScore++;
        } else if (userAnswer !== undefined) { 
             const userAnswerText = question.options && question.options[userAnswer] ? question.options[userAnswer] : 'Not Answered';
             const correctAnswerText = question.options && question.options[correctAnswer] ? question.options[correctAnswer] : 'Correct answer not specified';

            wrongAnswers.push({
                question: question.question || 'Question text missing',
                userAnswer: userAnswerText,
                correctAnswer: correctAnswerText,
                explanation: question.explanation || 'No explanation available.'
            });
        }
    });

    const totalQuestions = currentLecture.quiz.length;
    const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0; 

    // Update result elements on the page
    resultScoreElement.textContent = `${percentage}%`;
    resultCorrectElement.textContent = quizScore;
    resultIncorrectElement.textContent = wrongAnswers.length; 
    resultPercentageElement.textContent = `${percentage}%`;
    resultTotalElement.textContent = totalQuestions;

    // Update result meter width
    meterFill.style.width = `${percentage}%`;

    // Set result title, icon, and container class based on performance
    const resultTitleElement = document.getElementById('result-title');
    const resultIconElement = resultContainer.querySelector('.result-icon i');

     resultContainer.classList.remove('success', 'average', 'poor');

    if (percentage >= 80) {
        resultContainer.classList.add('success');
        if (resultIconElement) resultIconElement.className = 'fas fa-trophy';
        if (resultTitleElement) resultTitleElement.textContent = 'Excellent Work!';
        createConfetti(); 
    } else if (percentage >= 50) {
        resultContainer.classList.add('average');
        if (resultIconElement) resultIconElement.className = 'fas fa-star';
        if (resultTitleElement) resultTitleElement.textContent = 'Good Job!';
    } else {
        resultContainer.classList.add('poor');
        if (resultIconElement) resultIconElement.className = 'fas fa-redo';
        if (resultTitleElement) resultTitleElement.textContent = 'Keep Practicing!';
    }

    if (soundEnabled) {
        successSound.play().catch(e => console.error("Error playing success sound:", e));
    }

     if(wrongQuestionsContainer) wrongQuestionsContainer.style.display = 'none';
}

// Create confetti animation effect
function createConfetti() {
     if (typeof document === 'undefined') return; 
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = getRandomColor();
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        const duration = Math.random() * 3 + 2;
        confetti.style.animationDuration = `${duration}s`;
        confetti.style.animationDelay = `${Math.random() * 1}s`;
        document.body.appendChild(confetti);
        
        confetti.addEventListener('animationend', () => {
             confetti.remove();
        });
         setTimeout(() => {
             if (confetti.parentNode) {
                 confetti.remove();
             }
         }, (duration + 1.5) * 1000); 
    }
}

// Get a random color from the predefined theme colors
function getRandomColor() {
    const colors = [
        'var(--primary-color)', 'var(--secondary-color)', 'var(--medical-blue)', 'var(--medical-green)',
        'var(--medical-purple)', 'var(--medical-pink)', '#b5179e', '#560bad',
        '#3a0ca3', 'var(--primary-light)' 
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Show the section displaying incorrectly answered questions
function showWrongQuestions() {
     if (!wrongQuestionsList || !wrongQuestionsContainer) {
          console.error("Wrong questions list or container element not found.");
          return;
     }

    wrongQuestionsList.innerHTML = ''; 

    if (wrongAnswers.length === 0) {
        wrongQuestionsList.innerHTML = '<p style="text-align: center; color: var(--medium-gray);">No incorrect answers to show!</p>';
    } else {
        wrongAnswers.forEach((item, index) => {
            const wrongQuestionElement = document.createElement('div');
            wrongQuestionElement.className = 'wrong-question';
            wrongQuestionElement.innerHTML = `
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
            wrongQuestionsList.appendChild(wrongQuestionElement);
        });
    }

    wrongQuestionsContainer.style.display = 'block';
     wrongQuestionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Hide the wrong questions section
function closeWrongQuestions() {
    if (wrongQuestionsContainer) wrongQuestionsContainer.style.display = 'none';
}

// Restart the current quiz
function restartQuiz() {
    if (!currentLecture) {
        console.error("Cannot restart quiz, current lecture is not set.");
        goBackToCourses(); 
        return;
    }
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];
    
    // We must restore the quiz content if it was replaced (e.g., by "No quiz")
    if (quizContent && !quizContent.querySelector('.question-container')) {
         quizContent.innerHTML = `
            <div class="question-counter">
                Question <span id="current-question">1</span>/<span id="total-questions">?</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <div class="question-container">
                <div id="category" class="category">Lecture Title</div>
                <h2 id="question-text">Question text will appear here...</h2>
                <div class="options" id="options-container"></div>
                <div class="feedback" id="feedback" style="display: none;"></div>
                <div class="buttons-container">
                    <button id="prev-btn" class="btn btn-outline" onclick="prevQuestion()" disabled>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    <div>
                        <button class="hint-btn" onclick="showHint()" id="hint-btn" title="Show Explanation">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                        <button class="save-btn" onclick="saveQuestionAsImage()" title="Save Question as Image">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <button id="next-btn" class="btn" onclick="nextQuestion()" disabled>
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        // Re-assign DOM elements
        questionTextElement = document.getElementById('question-text');
        optionsContainer = document.getElementById('options-container');
        feedbackElement = document.getElementById('feedback');
        currentQuestionElement = document.getElementById('current-question');
        totalQuestionsElement = document.getElementById('total-questions');
        progressBar = document.getElementById('progress-bar');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
    }

    loadQuestion();
    showSection('lecture-content');
    showContent('quiz');
}

// Navigate back to the courses list (home page)
function goBackToCourses() {
    showSection('home');
    currentCourse = null;
    currentLecture = null;
}

// Navigate back to the lectures list for the current course
function goBackToLectures() {
    if (!currentCourse) {
         console.warn("Cannot go back to lectures, current course not set. Going home.");
         goBackToCourses(); 
         return;
    }
    showSection('lectures');
    currentLecture = null;
}

// Navigate back from the results page to the lecture content page
function goBackToLectureContent() {
     if (!currentLecture || !currentCourse) {
          console.warn("Cannot go back to lecture content, context lost. Going home.");
          goBackToCourses();
          return;
     }
    showSection('lecture-content');
    showContent('quiz');
}

// Open the feedback modal dialog
function openFeedbackForm() {
    if (feedbackModal) {
         feedbackModal.style.display = 'flex';
         if(successMessage) successMessage.style.display = 'none';
    } else {
         console.error("Feedback modal element not found.");
    }
}

// Close the feedback modal dialog
function closeFeedbackForm() {
    if (feedbackModal) feedbackModal.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none'; 
}

// *** CORRECTED FUNCTION TO ALLOW BROWSER SUBMISSION ***
function handleFeedbackSubmitCorrectly(e) {
    // DO NOT prevent default submission
    // e.preventDefault(); 

    console.log("Feedback form submitted. Allowing default browser submission.");

    const submitButton = feedbackForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true; 
    }
}