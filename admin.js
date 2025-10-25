// الانتظار حتى يتم تحميل عناصر الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // --- تعريف عناصر الصفحة (DOM Elements) ---
    const adminContent = document.getElementById('admin-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const courseSelect = document.getElementById('course-select');
    const lectureSelect = document.getElementById('lecture-select');
    const addQuestionForm = document.getElementById('add-question-form');

    // --- متغيرات الحالة ---
    let currentData = null; // لتخزين البيانات التي تم جلبها (الكورسات والمحاضرات)
    let appInitialized = false; // لمنع إعادة تهيئة بعض الأمور

    // --- تهيئة Netlify Identity Widget ---
    if (window.netlifyIdentity) {
        // عند تهيئة الويدجت لأول مرة
        window.netlifyIdentity.on('init', user => {
            console.log('Netlify Identity Initialized. User:', user);
            if (!user) {
                // إذا لم يكن المستخدم مسجلاً دخوله عند التهيئة، استمع لحدث الدخول التالي
                window.netlifyIdentity.on('login', (loggedInUser) => {
                    console.log('User logged in after init:', loggedInUser);
                    // أعد تحميل الصفحة لضمان تحميل البيانات الصحيحة للمستخدم
                    document.location.href = "/admin.html";
                });
            } else {
                 // إذا كان المستخدم مسجلاً دخوله بالفعل عند التهيئة
                 console.log('User already logged in on init:', user);
                 adminContent.classList.remove('hidden'); // أظهر محتوى الإدارة
                 if (!appInitialized) {
                    loadInitialData(user); // ابدأ تحميل البيانات إذا لم يتم تحميلها بعد
                 }
            }
        });

        // عند تسجيل الدخول بنجاح
        window.netlifyIdentity.on('login', (user) => {
            console.log('User logged in event:', user);
            adminContent.classList.remove('hidden'); // أظهر محتوى الإدارة
             if (!appInitialized) {
                loadInitialData(user); // ابدأ تحميل البيانات
             }
            netlifyIdentity.close(); // أغلق نافذة تسجيل الدخول المنبثقة
        });

        // عند تسجيل الخروج
        window.netlifyIdentity.on('logout', () => {
            console.log('User logged out');
            adminContent.classList.add('hidden'); // إخفاء محتوى الإدارة
            currentData = null; // مسح البيانات الحالية
            appInitialized = false; // إعادة تعيين حالة التهيئة
            // يمكنك إعادة توجيه المستخدم لصفحة أخرى إذا أردت
            // document.location.href = "/";
        });

         // عند حدوث خطأ في Netlify Identity
         window.netlifyIdentity.on('error', (err) => {
            console.error('Netlify Identity Error:', err);
            errorMessage.textContent = `خطأ في نظام الدخول: ${err.message || err}`;
            errorMessage.classList.remove('hidden');
         });

         // تهيئة الويدجت (مهم!)
         netlifyIdentity.init();

    } else {
        // إذا لم يتم تحميل مكتبة Netlify Identity بشكل صحيح
        console.error('Netlify Identity Widget not found. Make sure the script is loaded in admin.html.');
        errorMessage.textContent = 'خطأ في تحميل أداة تسجيل الدخول. تأكد من وجود السكربت الخاص بها في admin.html وحاول تحديث الصفحة.';
        errorMessage.classList.remove('hidden');
    }

    // --- وظائف تحميل ومعالجة البيانات ---

    /**
     * تحميل البيانات الأولية (الكورسات والمحاضرات) من وظيفة Netlify.
     * @param {object} user - كائن المستخدم من Netlify Identity.
     */
    async function loadInitialData(user) {
        console.log('Attempting to load initial data via Netlify function...');
        appInitialized = true; // ضع علامة أن التهيئة بدأت
        loadingIndicator.textContent = 'جاري تحميل البيانات الحالية...';
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        courseSelect.innerHTML = '<option value="">-- تحميل --</option>'; // إظهار رسالة تحميل
        lectureSelect.innerHTML = '<option value="">--</option>';
        lectureSelect.disabled = true;

        // التحقق من وجود كائن المستخدم والتوكن
        if (!user || !user.token || !user.token.access_token) {
             console.error('User or access token is missing in loadInitialData.');
             errorMessage.textContent = 'خطأ في المصادقة. حاول تسجيل الخروج والدخول مرة أخرى.';
             errorMessage.classList.remove('hidden');
             loadingIndicator.textContent = '';
             courseSelect.innerHTML = '<option value="">-- خطأ مصادقة --</option>';
             return; // إيقاف التحميل
        }

        try {
            // استدعاء وظيفة Netlify 'get-data'
            const response = await fetch('/.netlify/functions/get-data', {
                 method: 'GET', // تحديد الطريقة (افتراضي ولكن للتوضيح)
                 headers: {
                      // إرسال توكن Netlify Identity للتحقق من المصادقة في الوظيفة
                      'Authorization': `Bearer ${user.token.access_token}`
                 }
            });

            // التحقق من نجاح الاستدعاء (Status code 2xx)
            if (!response.ok) {
                 // محاولة قراءة رسالة الخطأ من الوظيفة (إذا كانت JSON)
                 let errorMsg = `Function error: ${response.statusText} (Status: ${response.status})`;
                 try {
                      const errorData = await response.json();
                      // استخدم رسالة الخطأ من الوظيفة إن وجدت، وإلا استخدم رسالة الحالة
                      errorMsg = errorData.error || errorMsg;
                 } catch (e) {
                    console.warn("Response from function was not JSON:", await response.text());
                 }
                 throw new Error(errorMsg); // إطلاق الخطأ لإيقاف التنفيذ والذهاب إلى catch
            }

            // تحويل الاستجابة الناجحة إلى JSON وتخزينها في المتغير العام
            currentData = await response.json();

            console.log('Data loaded successfully via function:', currentData);

            // التحقق من أن البيانات ليست فارغة أو غير متوقعة
            if (!currentData || typeof currentData !== 'object' || Object.keys(currentData).length === 0) {
                console.warn('Loaded data is empty or not in the expected format.');
                errorMessage.textContent = 'تم تحميل البيانات ولكنها فارغة أو بتنسيق غير متوقع.';
                errorMessage.classList.remove('hidden');
                courseSelect.innerHTML = '<option value="">-- بيانات فارغة --</option>';
            } else {
                 populateCourseSelect(); // ملء قائمة المواد بالبيانات الحقيقية
                 loadingIndicator.textContent = 'تم تحميل البيانات بنجاح.';
                 setTimeout(() => loadingIndicator.textContent = '', 3000); // إخفاء الرسالة بعد فترة
            }

        } catch (error) {
            // معالجة أي خطأ يحدث أثناء fetch أو تحويل JSON
            console.error('Error loading initial data:', error);
            errorMessage.textContent = `فشل تحميل البيانات: ${error.message}`;
            errorMessage.classList.remove('hidden');
            loadingIndicator.textContent = ''; // إخفاء مؤشر التحميل عند الخطأ
            courseSelect.innerHTML = '<option value="">-- فشل التحميل --</option>'; // تغيير رسالة القائمة
        }
    }

    /**
     * ملء القائمة المنسدلة للمواد بناءً على البيانات المحملة.
     */
    function populateCourseSelect() {
        courseSelect.innerHTML = '<option value="">-- اختر مادة --</option>'; // إعادة تعيين مع خيار افتراضي
        lectureSelect.innerHTML = '<option value="">-- اختر محاضرة --</option>'; // إعادة تعيين قائمة المحاضرات
        lectureSelect.disabled = true; // تعطيل قائمة المحاضرات

        if (!currentData) {
            console.warn('Cannot populate courses, currentData is null.');
            return;
        }

        // المرور على كل مفتاح (ID) للمادة في البيانات
        for (const courseId in currentData) {
            // التأكد من أن العنصر هو كائن ويحتوي على عنوان
            if (typeof currentData[courseId] === 'object' && currentData[courseId].title) {
                const option = document.createElement('option');
                option.value = courseId; // قيمة الخيار هي ID المادة
                option.textContent = currentData[courseId].title; // النص الظاهر هو عنوان المادة
                courseSelect.appendChild(option);
            } else {
                console.warn(`Skipping invalid course data for ID: ${courseId}`);
            }
        }
    }

    /**
     * ملء القائمة المنسدلة للمحاضرات عند اختيار مادة.
     * @param {string} courseId - الـ ID الخاص بالمادة المختارة.
     */
    function populateLectureSelect(courseId) {
        lectureSelect.innerHTML = '<option value="">-- اختر محاضرة --</option>'; // إعادة تعيين
        lectureSelect.disabled = true; // البدء معطلاً

        // التحقق من وجود البيانات اللازمة
        if (!currentData || !courseId || !currentData[courseId] || !currentData[courseId].lectures || typeof currentData[courseId].lectures !== 'object') {
             console.warn(`No valid lectures found for course ID: ${courseId}`);
             lectureSelect.innerHTML = '<option value="">-- لا توجد محاضرات --</option>'; // رسالة توضيحية
             return; // لا توجد محاضرات لهذه المادة أو البيانات غير صحيحة
        }

        const lectures = currentData[courseId].lectures;
        let lectureCount = 0;
        // المرور على كل مفتاح (ID) للمحاضرة
        for (const lectureId in lectures) {
             // التأكد من أن العنصر هو كائن ويحتوي على عنوان
             if (typeof lectures[lectureId] === 'object' && lectures[lectureId].title) {
                const option = document.createElement('option');
                option.value = lectureId; // قيمة الخيار هي ID المحاضرة
                option.textContent = lectures[lectureId].title; // النص الظاهر هو عنوان المحاضرة
                lectureSelect.appendChild(option);
                lectureCount++;
             } else {
                 console.warn(`Skipping invalid lecture data for ID: ${lectureId} in course ${courseId}`);
             }
        }

        // تفعيل القائمة فقط إذا كان هناك محاضرات متاحة
        if (lectureCount > 0) {
            lectureSelect.disabled = false;
        } else {
             lectureSelect.innerHTML = '<option value="">-- لا توجد محاضرات --</option>';
        }
    }


    // --- مستمعو الأحداث (Event Listeners) ---

    // عند تغيير اختيار المادة في القائمة المنسدلة
    courseSelect.addEventListener('change', (event) => {
        const selectedCourseId = event.target.value;
        // قم بملء قائمة المحاضرات بناءً على المادة المختارة
        populateLectureSelect(selectedCourseId);
    });

    // عند إرسال نموذج إضافة السؤال
    addQuestionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // منع الإرسال الافتراضي للصفحة وإعادة تحميلها

        console.log('Add question form submitted');
        // إظهار مؤشر التحميل وإخفاء الرسائل السابقة
        loadingIndicator.textContent = 'جاري إضافة السؤال...';
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        // الحصول على المستخدم الحالي للتحقق من المصادقة وإرسال التوكن
        const user = netlifyIdentity.currentUser();
        if (!user || !user.token || !user.token.access_token) {
             errorMessage.textContent = 'خطأ في المصادقة. يجب أن تكون مسجلاً الدخول لإضافة سؤال.';
             errorMessage.classList.remove('hidden');
             loadingIndicator.textContent = '';
             return; // إيقاف العملية
        }

        // جمع البيانات من حقول النموذج
        const courseId = courseSelect.value;
        const lectureId = lectureSelect.value;

        // التحقق من اختيار المادة والمحاضرة
        if (!courseId || !lectureId) {
             errorMessage.textContent = 'الرجاء اختيار المادة والمحاضرة أولاً.';
             errorMessage.classList.remove('hidden');
             loadingIndicator.textContent = '';
             return;
        }

        const newQuestionData = {
            question: document.getElementById('question-text').value.trim(),
            options: {
                A: document.getElementById('option-a').value.trim(),
                B: document.getElementById('option-b').value.trim(),
                C: document.getElementById('option-c').value.trim(),
                D: document.getElementById('option-d').value.trim(),
            },
            correctAnswer: document.getElementById('correct-answer').value,
            explanation: document.getElementById('explanation-text').value.trim(),
        };

        // التحقق الأساسي من أن الحقول ليست فارغة (يمكن إضافة تحقق أكثر تفصيلاً)
        if (!newQuestionData.question || !newQuestionData.options.A || !newQuestionData.options.B || !newQuestionData.options.C || !newQuestionData.options.D || !newQuestionData.correctAnswer || !newQuestionData.explanation) {
             errorMessage.textContent = 'الرجاء ملء جميع حقول السؤال.';
             errorMessage.classList.remove('hidden');
             loadingIndicator.textContent = '';
             return;
        }

        console.log('Submitting new question data:', { courseId, lectureId, newQuestionData });

        try {
            // ***** استدعاء وظيفة Netlify 'update-data' *****
            console.log('Calling Netlify function: /.netlify/functions/update-data');

            // --- الكود الفعلي لاستدعاء وظيفة التحديث ---
            const response = await fetch('/.netlify/functions/update-data', {
                method: 'POST', // استخدام POST لإرسال بيانات جديدة
                headers: {
                    'Content-Type': 'application/json', // تحديد نوع المحتوى المرسل
                    'Authorization': `Bearer ${user.token.access_token}` // إرسال التوكن للتحقق
                },
                body: JSON.stringify({ // تحويل البيانات إلى نص JSON
                    action: 'addQuestion', // لتحديد نوع العملية للوظيفة
                    courseId: courseId,
                    lectureId: lectureId,
                    payload: newQuestionData // بيانات السؤال الجديد
                })
            });

            // التحقق من نجاح الاستدعاء
            if (!response.ok) {
                 let errorMsg = `Function error: ${response.statusText} (Status: ${response.status})`;
                 try {
                      // محاولة قراءة رسالة الخطأ المحددة من الوظيفة
                      const errorData = await response.json();
                      errorMsg = errorData.error || errorMsg;
                 } catch (e) {
                      console.warn("Update function error response was not JSON:", await response.text());
                 }
                 throw new Error(errorMsg); // إطلاق الخطأ للانتقال إلى catch
            }

            const result = await response.json(); // قراءة رسالة النجاح من الوظيفة
            console.log('Update result:', result);
            // --- نهاية الكود الفعلي ---

            // عرض رسالة النجاح وإعادة تعيين النموذج
            successMessage.textContent = result.message || 'تم إضافة السؤال بنجاح!'; // استخدم الرسالة من الوظيفة
            successMessage.classList.remove('hidden');
            addQuestionForm.reset(); // مسح حقول النموذج
            // إعادة تعيين القوائم المنسدلة للحالة الأولية
            courseSelect.value = '';
            lectureSelect.innerHTML = '<option value="">-- اختر محاضرة --</option>';
            lectureSelect.disabled = true;

             // إخفاء رسالة النجاح بعد 5 ثواني
             setTimeout(() => successMessage.classList.add('hidden'), 5000);

             // تحديث البيانات المحلية لإظهار التغيير فوراً (أو إعادة تحميل الكل)
             // الطريقة الأسهل هي إعادة تحميل الكل لضمان التناسق
             console.log("Reloading data after successful update...");
             // أعد تحميل البيانات بعد فترة قصيرة للسماح لـ GitHub بالتحديث (قد تحتاج لتعديل الوقت)
             setTimeout(() => loadInitialData(user), 1000); // إعادة تحميل بعد ثانية

        } catch (error) {
            // معالجة أي خطأ يحدث أثناء استدعاء الوظيفة
            console.error('Error adding question:', error);
            errorMessage.textContent = `فشل إضافة السؤال: ${error.message}`;
            errorMessage.classList.remove('hidden');
        } finally {
             // إخفاء مؤشر التحميل في كل الحالات (نجاح أو فشل)
             loadingIndicator.textContent = '';
        }
    });

}); // نهاية DOMContentLoaded

