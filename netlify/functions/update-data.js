// استيراد مكتبة Octokit للتفاعل مع GitHub API
const { Octokit } = require("@octokit/rest");
// لاستخدام المتغيرات البيئية من Netlify
const process = require('process');

// معلومات المستودع - **تأكد من تعديل هذه القيم لتناسب مستودعك**
const GITHUB_OWNER = 'abad0l'; // اسم المستخدم أو المنظمة على GitHub
const GITHUB_REPO = 'Abadol';   // اسم المستودع (Repository)
const DATA_FILE_PATH = 'data.json'; // مسار ملف البيانات داخل المستودع
const GITHUB_BRANCH = 'main'; // أو 'master' - اسم الفرع الرئيسي

exports.handler = async (event, context) => {
    // 1. التحقق من أن الطلب جاء بطريقة POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: 'Only POST requests are allowed for updating data' }),
        };
    }

    // 2. التحقق من المصادقة (مهم جدًا!)
    const { user } = context.clientContext || {};
    if (!user) {
        console.log('Update attempt failed: No user context found.');
        return {
            statusCode: 401, // Unauthorized
            body: JSON.stringify({ error: 'You must be logged in to update data.' }),
        };
    }
    console.log('Update attempt by authenticated user:', user.email);

    // 3. قراءة وتحليل البيانات المرسلة من admin.js
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
        if (!requestBody || !requestBody.action || !requestBody.courseId || !requestBody.lectureId || !requestBody.payload) {
            throw new Error('Missing required fields in request body (action, courseId, lectureId, payload).');
        }
    } catch (error) {
        console.error('Error parsing request body:', error);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: `Invalid request body: ${error.message}` }),
        };
    }

    const { action, courseId, lectureId, payload } = requestBody;
    console.log(`Received action: ${action} for ${courseId}/${lectureId}`);

    // 4. الحصول على توكن GitHub من متغيرات البيئة
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
        console.error('GitHub PAT not found in environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GitHub token missing.' }),
        };
    }

    // 5. تهيئة Octokit
    const octokit = new Octokit({ auth: GITHUB_PAT });

    try {
        // 6. الحصول على محتوى الملف الحالي والـ SHA الخاص به من GitHub
        console.log(`Fetching current content and SHA for ${DATA_FILE_PATH}`);
        let currentContentBase64 = '';
        let currentSha = '';
        let currentData = {}; // سنبدأ بكائن فارغ في حال كان الملف غير موجود أو فارغًا

        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: DATA_FILE_PATH,
                ref: GITHUB_BRANCH,
            });

            if (fileData.encoding !== 'base64') {
                throw new Error('Expected base64 encoded file content from GitHub.');
            }
            currentContentBase64 = fileData.content;
            currentSha = fileData.sha; // <-- الـ SHA مهم للتحديث
            console.log(`Current file SHA: ${currentSha}`);

            // فك تشفير المحتوى الحالي
            const currentContent = Buffer.from(currentContentBase64, 'base64').toString('utf-8');
            currentData = JSON.parse(currentContent); // تحويل النص إلى كائن
            console.log('Successfully fetched and parsed current data.');

        } catch (error) {
             // إذا كان الخطأ هو 404 (الملف غير موجود)، سنتعامل معه كملف جديد
             if (error.status === 404) {
                 console.log(`Data file (${DATA_FILE_PATH}) not found. Will create a new one.`);
                 currentData = {}; // ابدأ بكائن فارغ
                 currentSha = undefined; // لا يوجد SHA لملف جديد
             } else {
                 // لأي خطأ آخر، أوقف العملية
                 throw error; // أعد إطلاق الخطأ ليتم التقاطه في الـ catch الخارجي
             }
        }


        // 7. تعديل البيانات بناءً على الـ action المطلوب
        switch (action) {
            case 'addQuestion':
                console.log('Processing action: addQuestion');
                // التحقق من وجود المادة والمحاضرة
                if (!currentData[courseId]) {
                    throw new Error(`Course with ID "${courseId}" not found.`);
                }
                if (!currentData[courseId].lectures || !currentData[courseId].lectures[lectureId]) {
                    throw new Error(`Lecture with ID "${lectureId}" not found in course "${courseId}".`);
                }
                // التأكد من أن quiz عبارة عن مصفوفة (وإنشائها إذا لم تكن موجودة)
                 if (!Array.isArray(currentData[courseId].lectures[lectureId].quiz)) {
                     console.warn(`Quiz array not found for ${courseId}/${lectureId}, creating one.`);
                     currentData[courseId].lectures[lectureId].quiz = [];
                 }

                // إضافة السؤال الجديد للمصفوفة
                currentData[courseId].lectures[lectureId].quiz.push(payload);
                console.log(`Added new question to ${courseId}/${lectureId}`);
                break;

            // --- يمكنك إضافة حالات أخرى هنا (case 'addLecture', case 'addCourse', etc.) ---
            /*
            case 'addLecture':
                // التحقق من وجود المادة
                if (!currentData[courseId]) throw new Error(`Course with ID "${courseId}" not found.`);
                // التحقق من عدم وجود المحاضرة بنفس الـ ID
                const newLectureId = payload.id; // افترض أن الـ payload يحتوي على id للمحاضرة
                if (!newLectureId) throw new Error('Lecture payload must include an id.');
                if (currentData[courseId].lectures && currentData[courseId].lectures[newLectureId]) {
                     throw new Error(`Lecture with ID "${newLectureId}" already exists in course "${courseId}".`);
                }
                 // تأكد من وجود كائن lectures
                 if (!currentData[courseId].lectures) {
                     currentData[courseId].lectures = {};
                 }
                 // إضافة المحاضرة الجديدة (بدون الـ id لأنه أصبح المفتاح)
                 const { id, ...lectureData } = payload;
                currentData[courseId].lectures[newLectureId] = lectureData;
                console.log(`Added new lecture "${newLectureId}" to ${courseId}`);
                break;
            */
            default:
                throw new Error(`Unsupported action: ${action}`);
        }

        // 8. تحويل البيانات المُعدلة إلى JSON ثم إلى Base64
        const updatedContent = JSON.stringify(currentData, null, 2); // (null, 2) للتنسيق الجميل
        const updatedContentBase64 = Buffer.from(updatedContent).toString('base64');

        // 9. إنشاء رسالة Commit (تصف التغيير)
        const commitMessage = `CMS: ${action} in ${courseId}/${lectureId} by ${user.email}`;

        // 10. تحديث الملف على GitHub
        console.log(`Attempting to update ${DATA_FILE_PATH} on GitHub...`);
        const { data: updateResult } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: DATA_FILE_PATH,
            message: commitMessage, // رسالة الـ Commit
            content: updatedContentBase64, // المحتوى الجديد المشفر
            sha: currentSha, // SHA القديم (مهم للتحديث، يكون undefined عند إنشاء ملف جديد)
            branch: GITHUB_BRANCH, // الفرع الذي سيتم التحديث فيه
            committer: { // معلومات اختيارية عن من قام بالتغيير
                name: 'Netlify CMS Bot', // اسم رمزي
                email: user.email // يمكن استخدام إيميل المستخدم
            },
            author: { // معلومات اختيارية عن مؤلف التغيير
                name: user.user_metadata?.full_name || user.email, // حاول استخدام اسم المستخدم إن وجد
                email: user.email
            }
        });

        console.log('File updated successfully on GitHub:', updateResult.commit.sha);

        // 11. إرجاع رسالة نجاح إلى admin.js
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `${action} completed successfully!`,
                commitSha: updateResult.commit.sha // إرجاع SHA للـ Commit الجديد (اختياري)
            }),
        };

    } catch (error) {
        console.error('Error processing update request:', error);
        // إرجاع رسالة خطأ مفصلة إلى admin.js
        return {
            statusCode: error.status || 500, // استخدم status الخطأ من GitHub إن وجد
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Failed to process update: ${error.message}` }),
        };
    }
};
