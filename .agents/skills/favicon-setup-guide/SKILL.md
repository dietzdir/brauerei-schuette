---
name: favicon-setup-guide
description: Guide users and generate code for modern favicon setups, icon sizes, HTML tags, and web app manifests across desktop browsers, iOS, Android, and PWAs. Use when a user asks about favicon sizes, creating or configuring favicons, adding apple-touch-icon, setting up site.webmanifest, or configuring website icons.
---

# Favicon Setup and Sizing Guide

Provide standard specifications, HTML integration snippets, web app manifest configurations, and asset generation guidance for website favicons and mobile app icons.

## When to Use

- When a developer or designer needs the exact dimensions and formats for web icons.
- When generating `<link rel="icon">`, `<link rel="apple-touch-icon">`, or `site.webmanifest` markup.
- When auditing or troubleshooting missing, blurry, or misconfigured favicons on desktop browsers, iOS, or Android devices.
- When configuring Progressive Web App (PWA) splash screens and home screen icons.

## Standard Favicon Size Reference

All favicon assets must be square (1:1 aspect ratio).

| Asset / Size | Format | Use Case | Required / Recommended |
| --- | --- | --- | --- |
| `favicon.ico` (16x16, 32x32, 48x48) | ICO | Universal desktop browser fallback, bookmarks, tabs, Windows shortcuts | Required |
| `favicon-16x16.png` | PNG | Standard browser tab icon on modern browsers | Recommended |
| `favicon-32x32.png` | PNG | High-DPI / Retina browser tabs, taskbar shortcuts | Recommended |
| `apple-touch-icon.png` (180x180) | PNG | iOS home screen bookmark icon (iPhone and iPad) | Required for Apple devices |
| `android-chrome-192x192.png` | PNG | Android home screen icon, PWA installation | Required for PWAs |
| `android-chrome-512x512.png` | PNG | Android PWA splash screen and app store dialogs | Required for PWAs |

## Implementation Steps

### 1. Root Directory Asset Placement

Place the standard asset bundle directly in the website root directory:

- `/favicon.ico` (multi-resolution container holding 16x16, 32x32, and 48x48)
- `/favicon-16x16.png`
- `/favicon-32x32.png`
- `/apple-touch-icon.png` (180x180)
- `/android-chrome-192x192.png`
- `/android-chrome-512x512.png`
- `/site.webmanifest`

### 2. HTML Head Configuration

Include the following tags inside the `<head>` element:

```html
<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Standard PNG Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Web App Manifest for Android / PWA -->
<link rel="manifest" href="/site.webmanifest">