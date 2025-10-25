    // استيراد مكتبة Octokit للتفاعل مع GitHub API
    const { Octokit } = require("@octokit/rest");
    // لاستخدام المتغيرات البيئية من Netlify
    const process = require('process');

    // معلومات المستودع - **عدّل هذه القيم لتناسب مستودعك**
    const GITHUB_OWNER = 'abad0l'; // اسم المستخدم أو المنظمة على GitHub
    const GITHUB_REPO = 'Abadol';   // اسم المستودع (Repository)
    const DATA_FILE_PATH = 'data.json'; // مسار ملف البيانات داخل المستودع
    const GITHUB_BRANCH = 'main'; // أو 'master' - اسم الفرع الرئيسي

    exports.handler = async (event, context) => {
        // التحقق من أن الطلب جاء بطريقة GET
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405, // Method Not Allowed
                body: JSON.stringify({ error: 'Only GET requests are allowed' }),
            };
        }

        // --- التحقق من المصادقة (مهم للأمان!) ---
        // الحصول على معلومات المستخدم من Netlify Identity (تُرسل تلقائيًا بواسطة Netlify)
        const { user } = context.clientContext || {};

        if (!user) {
            console.log('No user context found.');
            return {
                statusCode: 401, // Unauthorized
                body: JSON.stringify({ error: 'You must be logged in to access this data.' }),
            };
        }
        console.log('User authenticated:', user.email);
        // --- نهاية التحقق من المصادقة ---


        // الحصول على توكن GitHub من متغيرات البيئة في Netlify
        const GITHUB_PAT = process.env.GITHUB_PAT;
        if (!GITHUB_PAT) {
            console.error('GitHub PAT not found in environment variables.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: GitHub token missing.' }),
            };
        }

        // تهيئة Octokit باستخدام التوكن
        const octokit = new Octokit({ auth: GITHUB_PAT });

        try {
            console.log(`Attempting to fetch ${DATA_FILE_PATH} from ${GITHUB_OWNER}/${GITHUB_REPO} on branch ${GITHUB_BRANCH}`);

            // طلب محتوى الملف من GitHub API
            const { data: fileData } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: DATA_FILE_PATH,
                ref: GITHUB_BRANCH, // تحديد الفرع
                 // طلب المحتوى الخام مباشرة بتشفير base64
                 // headers: { accept: 'application/vnd.github.v3.raw' } // لا يعمل دائما مع getContent
            });

            // البيانات تأتي مشفرة بـ Base64
            if (fileData.encoding !== 'base64') {
                throw new Error('Expected base64 encoded file content.');
            }

            // فك تشفير المحتوى من Base64 إلى نص عادي (UTF-8)
            const fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            console.log('File content fetched successfully.');

            // محاولة تحويل النص إلى كائن JSON
            const jsonData = JSON.parse(fileContent);

            // إرجاع البيانات بنجاح
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData), // إرسال البيانات كـ JSON
            };

        } catch (error) {
            console.error('Error fetching data from GitHub:', error);

             // التعامل مع خطأ الملف غير موجود (404)
             if (error.status === 404) {
                 return {
                     statusCode: 404,
                     body: JSON.stringify({ error: `Data file not found at path: ${DATA_FILE_PATH}` }),
                 };
             }

            // إرجاع خطأ عام للخادم
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Failed to fetch data from GitHub. ${error.message}` }),
            };
        }
    };
    
