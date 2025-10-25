// الانتظار حتى يتم تحميل عناصر الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const adminContent = document.getElementById('admin-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const courseSelect = document.getElementById('course-select');
    const lectureSelect = document.getElementById('lecture-select');
    const addQuestionForm = document.getElementById('add-question-form');

    let currentData = null; // لتخزين البيانات التي تم جلبها

    // تهيئة Netlify Identity Widget
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                // إذا لم يكن المستخدم مسجلاً دخوله عند التهيئة
                window.netlifyIdentity.on('login', () => {
                    // بعد تسجيل الدخول، أعد تحميل الصفحة للانتقال للحالة الصحيحة
                    document.location.href = "/admin.html";
                });
            } else {
                 // إذا كان المستخدم مسجلاً دخوله بالفعل عند التهيئة
                 console.log('User already logged in:', user);
                 adminContent.classList.remove('hidden'); // أظهر محتوى الإدارة
                 loadInitialData(user); // ابدأ تحميل البيانات
            }
        });

        window.netlifyIdentity.on('login', (user) => {
            console.log('User logged in:', user);
            adminContent.classList.remove('hidden'); // أظهر محتوى الإدارة
            loadInitialData(user); // ابدأ تحميل البيانات
            netlifyIdentity.close(); // أغلق نافذة تسجيل الدخول
        });

        window.netlifyIdentity.on('logout', () => {
            console.log('User logged out');
            adminContent.classList.add('hidden'); // إخفاء محتوى الإدارة
            // يمكنك إعادة توجيه المستخدم لصفحة أخرى إذا أردت
            // document.location.href = "/";
        });

         window.netlifyIdentity.on('error', (err) => console.error('Netlify Identity Error:', err));
    } else {
        console.error('Netlify Identity Widget not found. Make sure the script is loaded.');
        errorMessage.textContent = 'خطأ في تحميل أداة تسجيل الدخول. حاول تحديث الصفحة.';
        errorMessage.classList.remove('hidden');
    }

    // --- وظائف تحميل ومعالجة البيانات ---

    // (مؤقتًا) دالة فارغة لجلب البيانات الأولية
    async function loadInitialData(user) {
        console.log('Attempting to load initial data...');
        loadingIndicator.textContent = 'جاري تحميل البيانات الحالية...';
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        try {
             // ***** الخطوة القادمة: استدعاء وظيفة Netlify هنا *****
             console.warn('TODO: Call Netlify function "get-data" here');
             // const response = await fetch('/.netlify/functions/get-data', {
             //    headers: { Authorization: `Bearer ${user.token.access_token}` }
             // });
             // if (!response.ok) throw new Error(`Function error: ${response.statusText}`);
             // currentData = await response.json();

             // ---- بيانات وهمية مؤقتة للاختبار ----
             currentData = {
                 "midwifery_theory": {
                     "title": "Midwifery Theory",
                     "lectures": {
                         "midwifery_principles": {"title": "Midwifery Principles"},
                         "ethics_midwifery": {"title": "Ethics in Midwifery"}
                     }
                 },
                 "scientific_research": {
                     "title": "Scientific Research",
                     "lectures": {
                          "research_methodology": {"title": "Research Methodology"}
                     }
                 }
             };
             // ---- نهاية البيانات الوهمية ----

            console.log('Data loaded:', currentData);
            populateCourseSelect(); // ملء قائمة المواد
            loadingIndicator.textContent = 'تم تحميل البيانات بنجاح.'; // تغيير النص
             setTimeout(() => loadingIndicator.textContent = '', 3000); // إخفاء الرسالة بعد فترة


        } catch (error) {
            console.error('Error loading initial data:', error);
            errorMessage.textContent = `فشل تحميل البيانات: ${error.message}`;
            errorMessage.classList.remove('hidden');
            loadingIndicator.textContent = ''; // إخفاء مؤشر التحميل عند الخطأ
        }
    }

     // ملء القائمة المنسدلة للمواد
    function populateCourseSelect() {
        courseSelect.innerHTML = '<option value="">-- اختر مادة --</option>'; // إعادة تعيين
        lectureSelect.innerHTML = '<option value="">-- اختر محاضرة --</option>'; // إعادة تعيين
        lectureSelect.disabled = true;

        if (!currentData) return;

        for (const courseId in currentData) {
            const option = document.createElement('option');
            option.value = courseId;
            option.textContent = currentData[courseId].title || courseId; // استخدام العنوان أو الـ ID
            courseSelect.appendChild(option);
        }
    }

    // ملء القائمة المنسدلة للمحاضرات عند اختيار مادة
    function populateLectureSelect(courseId) {
        lectureSelect.innerHTML = '<option value="">-- اختر محاضرة --</option>'; // إعادة تعيين
        lectureSelect.disabled = true;

        if (!currentData || !courseId || !currentData[courseId] || !currentData[courseId].lectures) {
             console.warn(`No lectures found for course ID: ${courseId}`);
             return; // لا توجد محاضرات لهذه المادة
        }


        const lectures = currentData[courseId].lectures;
        for (const lectureId in lectures) {
            const option = document.createElement('option');
            option.value = lectureId;
            option.textContent = lectures[lectureId].title || lectureId; // استخدام العنوان أو الـ ID
            lectureSelect.appendChild(option);
        }
        lectureSelect.disabled = false; // تفعيل القائمة
    }


    // --- مستمعو الأحداث (Event Listeners) ---

    // عند تغيير اختيار المادة
    courseSelect.addEventListener('change', (event) => {
        const selectedCourseId = event.target.value;
        populateLectureSelect(selectedCourseId);
    });

    // عند إرسال نموذج إضافة السؤال
    addQuestionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // منع الإرسال الافتراضي للصفحة
        console.log('Add question form submitted');
        loadingIndicator.textContent = 'جاري إضافة السؤال...';
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        const user = netlifyIdentity.currentUser();
        if (!user) {
             errorMessage.textContent = 'يجب أن تكون مسجلاً الدخول لإضافة سؤال.';
             errorMessage.classList.remove('hidden');
             loadingIndicator.textContent = '';
             return;
        }

        // جمع البيانات من النموذج
        const courseId = courseSelect.value;
        const lectureId = lectureSelect.value;
        const newQuestionData = {
            question: document.getElementById('question-text').value,
            options: {
                A: document.getElementById('option-a').value,
                B: document.getElementById('option-b').value,
                C: document.getElementById('option-c').value,
                D: document.getElementById('option-d').value,
            },
            correctAnswer: document.getElementById('correct-answer').value,
            explanation: document.getElementById('explanation-text').value,
        };

        console.log('New question data:', { courseId, lectureId, newQuestionData });

        try {
            // ***** الخطوة القادمة: استدعاء وظيفة Netlify هنا *****
            console.warn('TODO: Call Netlify function "update-data" here');
            // const response = await fetch('/.netlify/functions/update-data', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         Authorization: `Bearer ${user.token.access_token}` // إرسال التوكن للتحقق
            //     },
            //     body: JSON.stringify({
            //         action: 'addQuestion', // لتحديد نوع العملية للوظيفة
            //         courseId: courseId,
            //         lectureId: lectureId,
            //         payload: newQuestionData // البيانات الجديدة
            //     })
            // });

            // if (!response.ok) {
            //      const errorData = await response.json();
            //      throw new Error(errorData.error || `Function error: ${response.statusText}`);
            // }

            // const result = await response.json();
            // console.log('Update result:', result);

            // --- محاكاة نجاح مؤقتة ---
            await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية للمحاكاة
            // --- نهاية المحاكاة ---


            successMessage.textContent = 'تم إضافة السؤال بنجاح!';
            successMessage.classList.remove('hidden');
            addQuestionForm.reset(); // إعادة تعيين النموذج
            lectureSelect.disabled = true; // إعادة تعطيل قائمة المحاضرات
             setTimeout(() => successMessage.classList.add('hidden'), 5000); // إخفاء رسالة النجاح

             // تحديث البيانات المحلية (اختياري، أو يمكن إعادة تحميل الكل)
             // currentData[courseId].lectures[lectureId].quiz.push(newQuestionData);
             // أو الأفضل إعادة تحميل الكل لضمان التناسق
             loadInitialData(user); // إعادة تحميل البيانات لتعكس التغيير

        } catch (error) {
            console.error('Error adding question:', error);
            errorMessage.textContent = `فشل إضافة السؤال: ${error.message}`;
            errorMessage.classList.remove('hidden');
        } finally {
             loadingIndicator.textContent = ''; // إخفاء مؤشر التحميل
        }
    });

}); // نهاية DOMContentLoaded