<?php
// Copy this file to config.php and edit. Never commit config.php.
return [
    // Origins allowed to send data (your English app's address). Use exact scheme + host, no trailing slash.
    'ALLOWED_ORIGINS' => ['https://english.al-falahmarketing.com'],

    // Any long random string. Needed ONCE to open setup.php, where you choose your dashboard password.
    'SETUP_TOKEN' => '',

    'TIMEZONE' => 'Africa/Conakry',

    // STRONGLY RECOMMENDED: a folder OUTSIDE public_html so nobody can download the database,
    // e.g. '/home/u123456789/afel-data' (Hostinger File Manager: create the folder next to public_html).
    // Leave empty to use collector/data/ (protected by .htaccess only).
    'DATA_DIR' => '',
];
