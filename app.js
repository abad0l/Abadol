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
                فشل تحميل بيانات المواد الدراسية.<br>
                تأكد من تشغيل الصفحة عبر خادم ويب (Server).<br>
                (${error.message})
                </p>`;
             // Optionally hide other sections or show a more prominent error
             // document.body.innerHTML = ... (as before, but maybe less drastic)
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
        if (coursesGrid) coursesGrid.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1;">خطأ: لا يمكن عرض المواد.</p>';
        return;
    }

    coursesGrid.innerHTML = ''; // Clear loading message or previous cards
    let delay = 0.1; // Initial animation delay

    for (const courseId in courses) {
        const course = courses[courseId];
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        // Add courseId as a data attribute for potential future use/styling
        courseCard.dataset.courseId = courseId;
        // Use setAttribute for onclick to ensure it's properly added
        courseCard.setAttribute('onclick', `loadCourse('${courseId}')`);
        // Add animation delay style
        courseCard.style.animationDelay = `${delay}s`;

        // Safely access properties, providing fallbacks
        const title = course.title || 'اسم المادة غير متوفر';
        const description = course.description || 'لا يوجد وصف متاح.';
        // Determine icon based on course data or use a default
        const iconClass = course.icon || 'fas fa-book'; // Default icon

        courseCard.innerHTML = `
            <div class="course-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="course-title">${title}</div>
            <div class="course-desc">${description}</div>
            <!-- Optional: Add a badge or other info if needed -->
        `;
        coursesGrid.appendChild(courseCard);
        delay += 0.1; // Increment delay for next card
    }
     // Apply category-specific colors using CSS rules defined in style.css
     // The ::before element styling based on onclick attribute handles this
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

    // Feedback form submission - **Crucially, call the CORRECTED handler**
    feedbackForm.addEventListener('submit', handleFeedbackSubmitCorrectly); // Renamed handler

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
             // Find the closest button element in case the icon was clicked
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
        // Optionally show the home section as a fallback
        if (homeSection) homeSection.style.display = 'block';
    }
     // Scroll to top when changing sections for better UX
     window.scrollTo(0, 0);
}

// Load lectures for a specific course
function loadCourse(courseId) {
    if (!courses || !courses[courseId]) {
        console.error(`Course data not found for ID: ${courseId}`);
        // Optionally show an error message to the user
        return;
    }
    currentCourse = courses[courseId];
    if(courseTitleElement) courseTitleElement.textContent = currentCourse.title || 'اسم المادة';

    // Clear previous lectures
    if(lecturesContainer) lecturesContainer.innerHTML = '';
    else {
        console.error("Lectures container not found.");
        return;
    }

    let lectureCount = 0;
    // Add lectures to the grid
    if (currentCourse.lectures && typeof currentCourse.lectures === 'object') {
        for (const lectureId in currentCourse.lectures) {
            const lecture = currentCourse.lectures[lectureId];
             if (typeof lecture === 'object' && lecture !== null) { // Basic validation
                const lectureCard = document.createElement('div');
                lectureCard.className = 'lecture-card';
                // Use setAttribute for reliability
                lectureCard.setAttribute('onclick', `loadLecture('${lectureId}')`);

                const icon = lecture.icon || 'fas fa-chalkboard-teacher'; // Default icon
                const title = lecture.title || 'عنوان المحاضرة';
                const description = lecture.description || 'لا يوجد وصف.';

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
        lecturesContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--medium-gray);">لا توجد محاضرات متاحة لهذه المادة حاليًا.</p>';
    }

    showSection('lectures');
}

// Load content (quiz, explanation, flip cards) for a specific lecture
function loadLecture(lectureId) {
    if (!currentCourse || !currentCourse.lectures || !currentCourse.lectures[lectureId]) {
        console.error(`Lecture data not found for ID: ${lectureId} in course ${currentCourse?.title}`);
        // Optionally go back or show error
        showSection('lectures'); // Go back if lecture data is missing
        return;
    }
    currentLecture = currentCourse.lectures[lectureId];
    if(lectureTitleElement) lectureTitleElement.textContent = currentLecture.title || 'عنوان المحاضرة';

    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];

    // --- Load content for each section ---
    // Quiz (Load first question)
    if (currentLecture.quiz && Array.isArray(currentLecture.quiz) && currentLecture.quiz.length > 0) {
        loadQuestion(); // Only load if quiz exists and has questions
    } else {
        // Handle case where there's no quiz or it's empty
        console.warn(`No quiz questions found for lecture: ${lectureId}`);
        if(quizContent) {
            quizContent.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--medium-gray);">لا يوجد اختبار لهذه المحاضرة.</p>';
             // Maybe hide quiz button? Or disable it?
             // document.querySelector('.content-btn[data-content="quiz"]').style.display = 'none';
        }
         // Clear relevant display elements if quiz isn't loaded
         if(currentQuestionElement) currentQuestionElement.textContent = '0';
         if(totalQuestionsElement) totalQuestionsElement.textContent = '0';
         if(progressBar) progressBar.style.width = '0%';
    }

    // Explanation
    if (lectureExplanationElement) {
        lectureExplanationElement.innerHTML = currentLecture.explanation || '<p style="color: var(--medium-gray);">لا يوجد شرح متاح لهذه المحاضرة.</p>';
    } else {
         console.error("Explanation container element not found.");
    }


    // Flip Cards
    if (flipCardsContainer) {
        loadFlipCards(); // This function handles empty array case internally
    } else {
        console.error("Flip cards container element not found.");
    }
    // --- End loading content ---

    // Show the lecture content section and default to the quiz tab
    showSection('lecture-content');
    // Ensure content tabs are correctly set up and show 'quiz' by default (if available)
    setupContentTabs(); // Call a function to handle tab setup
}

// Setup the initial state of content tabs
function setupContentTabs() {
     // Check if quiz exists and has questions
    const quizAvailable = currentLecture?.quiz && Array.isArray(currentLecture.quiz) && currentLecture.quiz.length > 0;
     // Select the appropriate initial tab
     const initialTab = quizAvailable ? 'quiz' : 'explanation'; // Default to explanation if no quiz
     showContent(initialTab);
}


// Show specific content section within the lecture page (quiz, explanation, flip-cards)
function showContent(contentId) {
     if (!lectureContentSection) return; // Exit if the main section isn't found

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
        section.classList.remove('active'); // Use remove('active') instead of display none directly
    });

    // Show the selected content section
    const sectionToShow = document.getElementById(contentId + '-content');
    if (sectionToShow) {
        sectionToShow.classList.add('active'); // Use add('active')
        console.log(`Showing content section: ${contentId}-content`);
    } else {
         console.error(`Content section with ID ${contentId}-content not found.`);
         // Fallback: show explanation or quiz if possible
         const fallbackSection = document.getElementById('explanation-content') || document.getElementById('quiz-content');
         if(fallbackSection) fallbackSection.classList.add('active');
    }
}

// Load the current question based on currentQuestionIndex
function loadQuestion() {
    // Ensure all required elements and data exist
     if (!currentLecture || !currentLecture.quiz || currentLecture.quiz.length === 0 || !questionTextElement || !optionsContainer || !currentQuestionElement || !totalQuestionsElement || !progressBar || !prevBtn || !feedbackElement) {
         console.error("Cannot load question: Missing data or essential DOM elements.");
         // Optionally display an error in the quiz area
         if (optionsContainer) optionsContainer.innerHTML = '<p style="color: red;">خطأ في تحميل السؤال.</p>';
         return;
     }

    const question = currentLecture.quiz[currentQuestionIndex];
     if (!question || typeof question !== 'object' || !question.question || !question.options) {
         console.error(`Invalid question data at index ${currentQuestionIndex}`);
         if (optionsContainer) optionsContainer.innerHTML = '<p style="color: red;">بيانات السؤال غير صالحة.</p>';
         return;
     }

    // Update question counter
    currentQuestionElement.textContent = currentQuestionIndex + 1;
    totalQuestionsElement.textContent = currentLecture.quiz.length;

    // Update progress bar
    progressBar.style.width = `${((currentQuestionIndex + 1) / currentLecture.quiz.length) * 100}%`; // Corrected progress calculation

    // Set question text
    questionTextElement.textContent = question.question;

    // Set category (Lecture title)
    const categoryElement = document.getElementById('category');
    if(categoryElement) categoryElement.textContent = currentLecture.title || '';

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Add options dynamically
    for (const optionKey in question.options) {
        // Ensure the key is one of A, B, C, D (or handle others if needed)
        if (Object.hasOwnProperty.call(question.options, optionKey)) {
            const optionText = question.options[optionKey];
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            // Store option key in a data attribute
            optionElement.dataset.optionKey = optionKey;
            // Add click listener
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
    // nextBtn logic handled in selectOption/showFeedback

    // Hide feedback area
    feedbackElement.style.display = 'none';
    feedbackElement.className = 'feedback'; // Reset feedback classes

    // If user already answered this question (navigating back/forward), show their selection and the result
    if (userAnswers[currentQuestionIndex] !== undefined) {
        highlightPreviousAnswer(userAnswers[currentQuestionIndex]);
    }
}

// Highlight the previously selected answer and the correct answer when navigating back/forward
function highlightPreviousAnswer(selectedOptionKey) {
     if (!currentLecture || !currentLecture.quiz) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const options = optionsContainer.querySelectorAll('.option');

    options.forEach(opt => {
        const optKey = opt.dataset.optionKey;
        opt.classList.remove('selected', 'correct', 'incorrect'); // Clear previous states

        // Highlight correct answer regardless
        if (optKey === question.correctAnswer) {
            opt.classList.add('correct');
        }

        // If this was the selected option
        if (optKey === selectedOptionKey) {
            opt.classList.add('selected'); // Mark as selected
            // If it was incorrect, mark it as incorrect too
            if (selectedOptionKey !== question.correctAnswer) {
                opt.classList.add('incorrect');
            }
        }
         // Disable clicking again
         opt.style.pointerEvents = 'none';
         opt.style.cursor = 'default';
    });

     // Show the explanation feedback immediately
     feedbackElement.innerHTML = `
        <i class="fas fa-info-circle feedback-icon"></i> <!-- Info icon for explanation -->
        ${question.explanation}
    `;
     // Use a neutral class or style for just showing explanation
     feedbackElement.className = 'feedback explanation-only'; // Add a CSS class for styling if needed
     feedbackElement.style.display = 'block';
     feedbackElement.style.backgroundColor = 'rgba(67, 97, 238, 0.05)'; // Light blueish background
     feedbackElement.style.color = 'var(--dark-color)'; // Standard text color
     feedbackElement.style.borderLeftColor = 'var(--primary-color)'; // Blue border

    // Ensure next button is enabled if viewing history
    if(nextBtn) nextBtn.disabled = false;
}


// Handle user selecting an option
function selectOption(selectedOptionKey) {
     if (!currentLecture || !currentLecture.quiz) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const options = optionsContainer.querySelectorAll('.option');

    // Prevent selecting another option if already answered for this instance
    if (userAnswers[currentQuestionIndex] !== undefined) {
         console.log("Question already answered.");
        return;
    }

    // Store user's answer
    userAnswers[currentQuestionIndex] = selectedOptionKey;

    const isCorrect = selectedOptionKey === question.correctAnswer;

    // Highlight selected, correct, and incorrect options
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

        // Disable further clicks on options for this question
        opt.style.pointerEvents = 'none';
        opt.style.cursor = 'default';
    });

    // Show feedback (correct/incorrect) and explanation
    showFeedback(isCorrect, question.explanation);

    // Play sound based on correctness
    if (soundEnabled) {
        if (isCorrect) {
            correctSound.play().catch(e => console.error("Error playing correct sound:", e));
        } else {
            wrongSound.play().catch(e => console.error("Error playing wrong sound:", e));
        }
    }

     // Enable the next button after an answer is selected
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
        ${isCorrect ? 'صحيح!' : 'غير صحيح!'} ${explanation || ''} <!-- Translated -->
    `;
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;

    // Enable the next button after showing feedback
    nextBtn.disabled = false;

    // --- Optional: Auto-advance (consider removing if manual next is preferred) ---
    /*
    const delay = isCorrect ? 1500 : 3000; // Longer delay for incorrect answers
    setTimeout(() => {
        // Check if we are still on the same question index before advancing
        // This prevents auto-advance if user quickly navigates back/forth
        if (userAnswers[currentQuestionIndex] !== undefined) {
             if (currentQuestionIndex < currentLecture.quiz.length - 1) {
                 nextQuestion(); // Go to next question
             } else {
                 calculateResults(); // All questions answered, go to results
                 showSection('result');
             }
        }
    }, delay);
    */
    // --- End Optional Auto-advance ---
}

// Show hint (explanation) for the current question
function showHint() {
     if (!currentLecture || !currentLecture.quiz || !feedbackElement) return;
    const question = currentLecture.quiz[currentQuestionIndex];
    const explanation = question.explanation;

    feedbackElement.style.display = 'block';
    feedbackElement.innerHTML = `
        <i class="fas fa-lightbulb feedback-icon"></i>
        <strong>تلميح/شرح:</strong> ${explanation || 'لا يوجد شرح إضافي لهذا السؤال.'} <!-- Translated -->
    `;
     // Use a distinct style for hints
     feedbackElement.className = 'feedback hint'; // Add CSS class for styling
     feedbackElement.style.backgroundColor = 'rgba(255, 193, 7, 0.1)'; // Light yellow background
     feedbackElement.style.color = '#856404'; // Dark yellow text
     feedbackElement.style.borderLeftColor = 'var(--warning-color)'; // Yellow border
}

// Save the current question container as a PNG image
function saveQuestionAsImage() {
    const questionContainer = document.querySelector('#quiz-content .question-container');
    if (questionContainer && typeof html2canvas === 'function') {
        html2canvas(questionContainer, {
             backgroundColor: document.body.classList.contains('dark-mode') ? '#2b2d42' : '#ffffff', // Match background
             scale: 2 // Increase scale for better resolution
        }).then(canvas => {
            const link = document.createElement('a');
            // Generate a more descriptive filename
            const courseTitleSafe = currentCourse?.title?.replace(/[^a-z0-9]/gi, '_') || 'course';
            const lectureTitleSafe = currentLecture?.title?.replace(/[^a-z0-9]/gi, '_') || 'lecture';
            const questionNum = currentQuestionIndex + 1;
            link.download = `MrNursawy_${courseTitleSafe}_${lectureTitleSafe}_Q${questionNum}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
             console.error('Error generating image with html2canvas:', err);
             alert('عذرًا، حدث خطأ أثناء محاولة حفظ السؤال كصورة.');
        });
    } else {
         console.error('html2canvas function not found or question container missing.');
         alert('لا يمكن حفظ الصورة حاليًا.');
    }
}


// Go to the next question or results page
function nextQuestion() {
     if (!currentLecture || !currentLecture.quiz) return;
    if (currentQuestionIndex < currentLecture.quiz.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        // Last question answered, calculate results
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
         return; // Exit if container doesn't exist
    }

    flipCardsContainer.innerHTML = ''; // Clear previous cards

    if (!currentLecture || !currentLecture.flipCards || !Array.isArray(currentLecture.flipCards) || currentLecture.flipCards.length === 0) {
        console.warn(`No flip cards found for lecture: ${currentLecture?.title}`);
        flipCardsContainer.innerHTML = '<p style="text-align: center; color: var(--medium-gray);">لا توجد بطاقات مراجعة لهذه المحاضرة.</p>';
        return;
    }

    currentLecture.flipCards.forEach((card, index) => {
         if (typeof card === 'object' && card.front && card.back) { // Validate card data
            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card';
            // Add tabindex for keyboard accessibility
            flipCard.setAttribute('tabindex', '0');
             // Add click and keypress listeners for flipping
             flipCard.addEventListener('click', () => {
                 flipCard.classList.toggle('flipped'); // Toggle a class to handle flip in CSS potentially
                 if (soundEnabled) flipSound.play().catch(e => console.error("Error playing flip sound:", e));
             });
             flipCard.addEventListener('keypress', (e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                     flipCard.classList.toggle('flipped');
                     if (soundEnabled) flipSound.play().catch(e => console.error("Error playing flip sound:", e));
                 }
             });


            flipCard.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <div class="flip-card-icon">
                            <i class="fas fa-question-circle"></i> <!-- More appropriate icon -->
                        </div>
                        <div class="flip-card-title">البطاقة ${index + 1}</div> <!-- Translated -->
                        <div class="flip-card-text">${card.front}</div>
                        <div class="flip-card-hint">(اضغط لترى الإجابة)</div> <!-- Translated -->
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-card-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="flip-card-title">الإجابة</div> <!-- Translated -->
                        <div class="flip-card-text">${card.back}</div>
                         <!-- Optional: Add details/source if available in data -->
                         ${card.details ? `<div class="flip-card-details"><span class="detail-label">تفاصيل:</span> ${card.details}</div>` : ''}
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
     // Ensure elements exist before proceeding
     if (!currentLecture || !currentLecture.quiz || !resultScoreElement || !resultCorrectElement || !resultIncorrectElement || !resultPercentageElement || !resultTotalElement || !meterFill || !resultContainer) {
         console.error("Cannot calculate results: Missing data or essential result DOM elements.");
         // Optionally display an error on the results page area
         if (resultContainer) resultContainer.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ أثناء حساب النتيجة.</p>';
         return;
     }

    quizScore = 0;
    wrongAnswers = []; // Reset wrong answers array

    currentLecture.quiz.forEach((question, index) => {
        const userAnswer = userAnswers[index]; // Could be undefined if not answered
        const correctAnswer = question.correctAnswer;

        if (userAnswer === correctAnswer) {
            quizScore++;
        } else if (userAnswer !== undefined) { // Only count as wrong if answered incorrectly
             // Ensure options exist before trying to access them
             const userAnswerText = question.options && question.options[userAnswer] ? question.options[userAnswer] : 'إجابة غير مسجلة';
             const correctAnswerText = question.options && question.options[correctAnswer] ? question.options[correctAnswer] : 'الإجابة الصحيحة غير محددة';

            wrongAnswers.push({
                question: question.question || 'نص السؤال غير موجود',
                userAnswer: userAnswerText,
                correctAnswer: correctAnswerText,
                explanation: question.explanation || 'لا يوجد شرح متاح.'
            });
        }
         // Note: Questions skipped (userAnswer === undefined) are not counted as correct or wrong here. Adjust if needed.
    });

    const totalQuestions = currentLecture.quiz.length;
    const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0; // Avoid division by zero

    // Update result elements on the page
    resultScoreElement.textContent = `${percentage}%`;
    resultCorrectElement.textContent = quizScore;
    resultIncorrectElement.textContent = wrongAnswers.length; // Based on actual wrong answers logged
    resultPercentageElement.textContent = `${percentage}%`;
    resultTotalElement.textContent = totalQuestions;

    // Update result meter width
    meterFill.style.width = `${percentage}%`;

    // Set result title, icon, and container class based on performance
    const resultTitleElement = document.getElementById('result-title');
    const resultIconElement = resultContainer.querySelector('.result-icon i');

     // Clear previous result classes
     resultContainer.classList.remove('success', 'average', 'poor');

    if (percentage >= 80) {
        resultContainer.classList.add('success');
        if (resultIconElement) resultIconElement.className = 'fas fa-trophy';
        if (resultTitleElement) resultTitleElement.textContent = 'عمل ممتاز!'; // Translated
        createConfetti(); // Trigger confetti for high scores
    } else if (percentage >= 50) {
        resultContainer.classList.add('average');
        if (resultIconElement) resultIconElement.className = 'fas fa-star';
        if (resultTitleElement) resultTitleElement.textContent = 'عمل جيد!'; // Translated
    } else {
        resultContainer.classList.add('poor');
        if (resultIconElement) resultIconElement.className = 'fas fa-redo';
        if (resultTitleElement) resultTitleElement.textContent = 'استمر في الممارسة!'; // Translated
    }

    // Play success sound regardless of score (or adjust logic if needed)
    if (soundEnabled) {
        successSound.play().catch(e => console.error("Error playing success sound:", e));
    }

     // Hide the wrong questions section initially when results are first shown
     if(wrongQuestionsContainer) wrongQuestionsContainer.style.display = 'none';
}

// Create confetti animation effect
function createConfetti() {
     if (typeof document === 'undefined') return; // Guard against non-browser environments
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
        // Add a random animation delay
        confetti.style.animationDelay = `${Math.random() * 1}s`;
        document.body.appendChild(confetti);
        // Remove confetti element after animation completes
        confetti.addEventListener('animationend', () => {
             confetti.remove();
        });
        // Fallback removal in case animationend doesn't fire reliably
         setTimeout(() => {
             if (confetti.parentNode) {
                 confetti.remove();
             }
         }, (duration + 1.5) * 1000); // Duration + delay + buffer
    }
}

// Get a random color from the predefined theme colors
function getRandomColor() {
    const colors = [
        'var(--primary-color)', 'var(--secondary-color)', 'var(--medical-blue)', 'var(--medical-green)',
        'var(--medical-purple)', 'var(--medical-pink)', '#b5179e', '#560bad',
        '#3a0ca3', 'var(--primary-light)' // Added more variety
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Show the section displaying incorrectly answered questions
function showWrongQuestions() {
     if (!wrongQuestionsList || !wrongQuestionsContainer) {
          console.error("Wrong questions list or container element not found.");
          return;
     }

    wrongQuestionsList.innerHTML = ''; // Clear previous list

    if (wrongAnswers.length === 0) {
        wrongQuestionsList.innerHTML = '<p style="text-align: center; color: var(--medium-gray);">لا توجد إجابات خاطئة لعرضها!</p>'; // Translated
    } else {
        wrongAnswers.forEach((item, index) => {
            const wrongQuestionElement = document.createElement('div');
            wrongQuestionElement.className = 'wrong-question';
            wrongQuestionElement.innerHTML = `
                <div class="wrong-question-title">السؤال ${index + 1}</div> <!-- Translated -->
                <p>${item.question}</p>
                <div class="wrong-answer">
                    <span class="answer-label">إجابتك:</span> <!-- Translated -->
                    <span>${item.userAnswer}</span>
                </div>
                <div class="correct-answer">
                    <span class="answer-label">الإجابة الصحيحة:</span> <!-- Translated -->
                    <span>${item.correctAnswer}</span>
                </div>
                <div class="explanation">
                    <strong>الشرح:</strong> ${item.explanation} <!-- Translated -->
                </div>
            `;
            wrongQuestionsList.appendChild(wrongQuestionElement);
        });
    }

    wrongQuestionsContainer.style.display = 'block';
    // Scroll to the wrong questions section smoothly
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
        goBackToCourses(); // Go back home if state is lost
        return;
    }
    // Reset state variables
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
    wrongAnswers = [];
    // Reload the first question
    loadQuestion();
    // Show the lecture content section, specifically the quiz tab
    showSection('lecture-content');
    showContent('quiz');
}

// Navigate back to the courses list (home page)
function goBackToCourses() {
    showSection('home');
    // Optionally reset currentCourse/Lecture if needed
    currentCourse = null;
    currentLecture = null;
}

// Navigate back to the lectures list for the current course
function goBackToLectures() {
    if (!currentCourse) {
         console.warn("Cannot go back to lectures, current course not set. Going home.");
         goBackToCourses(); // Go to home if course context is lost
         return;
    }
    showSection('lectures');
    // Optionally reset currentLecture
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
    // Decide which tab to show - maybe quiz is most logical?
    showContent('quiz');
}

// Open the feedback modal dialog
function openFeedbackForm() {
    if (feedbackModal) {
         feedbackModal.style.display = 'flex';
         // Clear previous success message if shown
         if(successMessage) successMessage.style.display = 'none';
         // Optionally reset form if needed
         // if(feedbackForm) feedbackForm.reset();
    } else {
         console.error("Feedback modal element not found.");
    }
}

// Close the feedback modal dialog
function closeFeedbackForm() {
    if (feedbackModal) feedbackModal.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none'; // Ensure success message is hidden too
}

// *** CORRECTED FUNCTION TO ALLOW BROWSER SUBMISSION ***
// Handle feedback form submission by allowing the default browser action
function handleFeedbackSubmitCorrectly(e) {
    // DO NOT prevent default submission
    // e.preventDefault();

    console.log("Feedback form submitted. Allowing default browser submission.");

    // You can optionally show a brief "Sending..." message here,
    // but the browser will navigate away soon.
    const submitButton = feedbackForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'جاري الإرسال...'; // Translated
        submitButton.disabled = true; // Prevent double clicks
    }

    // No fetch code needed here. The browser handles the POST request.
    // FormSubmit.co will then redirect the user to their thank you page.

    // No need to manually show success message or reset form,
    // as the page navigation will handle the state change.
    // No need for setTimeout to close the modal either.
}

// Make sure the init function is called after data is loaded (handled in DOMContentLoaded)

