<?php
// Copy this file to config.php (same folder) and edit. Never share config.php.
return [
    // Secret word that opens the stats page:  https://al-falahmarketing.com/go/stats.php?t=THE-WORD
    // Choose a long one (15+ letters). Empty = the stats page is switched off.
    'STATS_TOKEN' => '',

    // Where every QR code sends visitors. You can change it later without reprinting anything.
    'DEST' => 'https://english.al-falahmarketing.com/',

    // Your website address (used to build the QR links on the stats page).
    'BASE' => 'https://al-falahmarketing.com',

    // Optional: a folder OUTSIDE public_html for the small counter database, for example
    // dirname(__DIR__, 2) . '/afel-go-data'   (leave empty to use go/data/, which is protected)
    'DATA_DIR' => '',
];
