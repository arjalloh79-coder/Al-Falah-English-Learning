<?php
// Copy this file to config.php (same folder), then edit. NEVER upload config.php to GitHub or share it.
return [
    // Your OpenAI API key (platform.openai.com > API keys). Starts with "sk-".
    'OPENAI_API_KEY' => '',

    // The AI model used. A small, cheap model is plenty for a website assistant.
    // Check platform.openai.com/docs/models for the current options and prices.
    'MODEL' => 'gpt-4o-mini',

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
];
