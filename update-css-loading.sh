#!/bin/bash

# Script to update HTML files with optimized CSS loading
# This script replaces old styles.css references with the new critical/lazy loading pattern

echo "Updating HTML files with optimized CSS loading pattern..."

# Define the pattern replacement function
update_html_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Use sed to replace the old CSS loading pattern
    # This is a simplified replacement - for complex cases, manual editing is needed
    
    # First, ensure base-theme.css is loaded first if not already
    if ! grep -q "css/critical.css" "$file"; then
        # Replace styles.css reference with the optimized pattern
        sed -i '/css\/styles\.css/c\
    <!-- CRITICAL CSS - Above-fold essentials loaded synchronously -->\
    <link rel="stylesheet" href="css/critical.css?v=1.0">\
    \
    <!-- PROGRESSIVE LOADING - Non-critical CSS loaded asynchronously -->\
    <link rel="preload" href="css/layout.css?v=1.0" as="style" onload="this.onload=null;this.rel='\''stylesheet'\''">\
    <noscript><link rel="stylesheet" href="css/layout.css?v=1.0"></noscript>\
    \
    <link rel="preload" href="css/components.css?v=1.0" as="style" onload="this.onload=null;this.rel='\''stylesheet'\''">\
    <noscript><link rel="stylesheet" href="css/components.css?v=1.0"></noscript>\
    \
    <link rel="preload" href="css/features.css?v=1.0" as="style" onload="this.onload=null;this.rel='\''stylesheet'\''">\
    <noscript><link rel="stylesheet" href="css/features.css?v=1.0"></noscript>' "$file"
        
        echo "Updated $file with optimized CSS loading"
    else
        echo "File $file already appears to be updated"
    fi
}

# Update remaining HTML files that reference styles.css
# Note: Some files may need manual adjustments for relative paths

files_to_update=(
    "lander.html"
    "admin/index.html"
    "pages/blog.html"
    "pages/celestial-commons.html"
    "pages/profile-setup.html"
    "pages/messaging.html"
    "pages/messageboard.html"
    "pages/manifesto.html"
    "pages/blogs.html"
    "pages/mindmap.html"
    "pages/news-fixed.html"
    "pages/messageboard_archive.html"
    "pages/debate.html"
    "pages/archive.html"
    "pages/eternal-hearth.html"
    "profile/index.html"
    "souls/eternally_yours/index.html"
    "souls/[username].html"
    "test-online-status.html"
    "test-news-debug.html"
)

# Process each file
for file in "${files_to_update[@]}"; do
    if [ -f "$file" ]; then
        update_html_file "$file"
    else
        echo "Warning: File not found: $file"
    fi
done

echo "CSS loading optimization complete!"
echo ""
echo "Note: Some files may require manual path adjustments for relative CSS references."
echo "Please review the changes and test the functionality."
echo ""
echo "Backup files have been created with .backup extension."