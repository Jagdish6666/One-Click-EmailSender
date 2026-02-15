# UI Implementation Plan

## Objective
Update the application UI to a premium dark-themed design inspired by the "FraudGuard" concept, adapted for the Certificate Sender project. Ensure consistency across all pages.

## Changes Implemented

### 1. Global Styles (`app/globals.css`)
- **Theme**: Switched to a dark theme with deep purple/blue gradients and accents.
- **Variables**: Defined `--bg-dark`, `--bg-card`, `--primary`, etc. matching the provided image.
- **Utilities**: Added `.glass-card`, `.feature-item`, `.split-layout`, `.table-container`, etc. to enable rapid UI development consistent with the new theme.
- **Animations**: Added `fadeIn` for smoother page loads.

### 2. Home Page (`app/page.js`)
- **Layout**: Implemented a modern split-screen layout.
  - **Left Panel**: Branding, Hero Text ("Advanced Certificate Sending for Modern Teams"), Feature Grid (Real-time delivery, Custom Templates), and Social Proof.
  - **Right Panel**: Interactive Auth Card with Login/Signup tabs, dark-themed inputs, and social login placeholders.
- **Icons**: Replaced external icon libraries with optimized inline SVGs to avoid dependency issues.

### 3. Authentication Pages
- **Login (`app/login/page.js`)**: Verified compatibility with new global styles (glassmorphism effect).
- **Signup (`app/signup/page.js`)**: Refactored from inline hardcoded styles to use the new global utility classes (`glass-card`, `btn-primary`), ensuring it matches the dark theme.

### 4. Dashboard (`app/dashboard/page.js`)
- **Theme Update**: Converted the dashboard from a light-themed, inline-styled page to a dark-themed layout using `.card` and `.table` utility classes.
- **Components**: Updated tables, inputs, and badges to be visually consistent with the rest of the application.

## Verification
- All pages now share the same "Certificate Sender" branding and premium dark aesthetic.
- The UI is responsive and adapts to different screen sizes.
