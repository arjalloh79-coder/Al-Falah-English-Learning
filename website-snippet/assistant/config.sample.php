<?php
// Copy this file to config.php (same folder), then edit. NEVER upload config.php to GitHub or share it.
return [
    // Which AI service answers: 'groq' (free, no card, recommended), 'gemini' (free tier) or 'openai' (paid).
    'PROVIDER' => 'groq',

    // The secret key of that service. Groq keys start with "gsk_", Gemini with "AIza", OpenAI with "sk-".
    // Groq: console.groq.com > API Keys. Gemini: aistudio.google.com > Get API key.
    'AI_API_KEY' => '',

    // Leave MODEL out to use the default of your provider (groq: llama-3.3-70b-versatile, gemini: gemini-2.5-flash,
    // openai: gpt-4o-mini). If a provider retires a model, copy the current name from its models page and uncomment:
    // 'MODEL' => 'llama-3.3-70b-versatile',

    // Websites allowed to use the assistant (exact address, no trailing slash).
    'ALLOWED_ORIGINS' => [
        'https://al-falahmarketing.com',
        'https://www.al-falahmarketing.com',
    ],

    // Spending protection. The chat stops by itself when a limit is reached.
    'PER_IP_HOUR' => 20,     // questions per visitor per hour
    'PER_IP_DAY'  => 60,     // questions per visitor per day
    'GLOBAL_DAY'  => 500,    // questions per day for the whole site (your safety net)
    'MAX_OUTPUT_TOKENS' => 350,   // maximum length of each answer

    // Any long random text (20+ characters). Used to scramble visitor addresses in the limiter.
    'SALT' => '',

    // Recommended: a folder OUTSIDE public_html for the small limiter database, for example:
    // dirname(__DIR__, 2) . '/afel-assistant-data'
    // Leave empty to use assistant/data/ (protected by .htaccess).
    'DATA_DIR' => '',

    // ───────── WhatsApp assistant (whatsapp.php). Leave empty if you only use the website chat. ─────────
    // Setup guide: WHATSAPP-SETUP.md. Never share these values.
    'WA_VERIFY_TOKEN'    => '',   // any secret word you invent; you type the same word in Meta's webhook screen
    'WA_APP_SECRET'      => '',   // Meta app > App settings > Basic > App secret
    'WA_ACCESS_TOKEN'    => '',   // permanent access token (system user)
    'WA_PHONE_NUMBER_ID' => '',   // WhatsApp > API setup > Phone number ID (digits only)

    // ───────── "Leave my details" form in the chat (lead.php) ─────────
    'LEAD_EMAIL' => '',   // your email: every request is sent here. Empty = the form is switched off.
    'LEAD_FROM'  => '',   // sender, best on your own domain, e.g. 'assistant@al-falahmarketing.com' (create it in hPanel > Emails)

    // A real person customers can message when they ask for one (digits, country code, no +).
    'HUMAN_WHATSAPP' => '224611351302',

    // WhatsApp spending protection and memory.
    'WA_PER_USER_HOUR' => 15,     // messages answered per customer per hour
    'WA_PER_USER_DAY'  => 50,     // per customer per day
    'WA_GLOBAL_DAY'    => 300,    // per day for the whole WhatsApp channel (your safety net)
    'MEMORY_TURNS'     => 6,      // question+answer pairs remembered for 24 hours so follow-ups make sense; 0 = remember nothing
];
