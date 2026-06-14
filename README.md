<p align="center">
  <img src="src/assets/icons/logo.svg" alt="Logo Dự Án" width="50" />
  <h1 align="center">𝓐𝓸𝓲𝓒𝓱𝓪𝓷︵❤</h1>
</p>

<p align="center">
  Production VR-XR Platform.
</p>

<details>
  <summary><b>【Hướng dẫn】</b></summary>

  ### Các bước thực hiện:
  1. Chạy lệnh `npm install`
  2. Tạo file `.env`
  3. Chạy `npm start` để khởi động dự án.
</details>

<table width="100%">
  <tr>
    <td width="50%">
      <h3>Giao diện「Máy tính」</h3>
      <img src="https://placeholder.com" alt="Desktop View">
    </td>
    <td width="50%">
      <h3>Giao diện「Điện thoại」</h3>
      <img src="https://placeholder.com" alt="Mobile View">
    </td>
  </tr>
</table>

```txt
# ENTERPRISE PRODUCTION PROMPT

## GitHub Pages Personal Knowledge Base

### Architecture Lock Edition

You are a Senior Staff Software Engineer, Software Architect, Frontend Architect, Performance Engineer, Security Engineer and Technical Documentation Engineer.

Your task is to build a complete production-ready static website system.

---

# TARGET DEPLOYMENT

Repository:

https://aoichan-vn.github.io/Website/

Deployment:

GitHub Pages

---

# CORE REQUIREMENTS

## Technology Stack

Strictly use:

* HTML5
* CSS3
* Vanilla JavaScript ES2024

Forbidden:

* React
* Vue
* Angular
* Svelte
* jQuery
* Bootstrap
* Tailwind
* TypeScript
* NodeJS Runtime
* Webpack
* Vite
* Parcel
* Bun
* Deno
* Any CDN
* Any Third Party Library

The project must run directly on GitHub Pages without any build step.

---

# PROJECT PURPOSE

Create a personal knowledge base and article system.

Content sources:

* Local Markdown files (.md)
* Local Images
* External Image URLs
* Personal Documentation
* Personal Notes
* Personal Articles

---

# ARCHITECTURE LOCK

This architecture is mandatory.

AI MUST NOT modify it.

AI MUST NOT add additional HTML pages.

Allowed HTML files:

* index.html
* app.html

Forbidden:

* post.html
* article.html
* page.html
* category.html
* archive.html
* tag.html
* blog.html
* reader.html

All article viewing must happen inside app.html.

Any deviation is considered a failure.

---

# WEBSITE FLOW

## Landing Page

index.html

Purpose:

Show visual presentation only.

Responsibilities:

* Skybox 3D
* Parallax Environment
* Intro Screen
* Navigation Buttons

No Markdown Rendering.

No Search System.

No Article Viewer.

No Content Panels.

Example:

[Aoi's World]

[ Enter Library ]

[ About ]

[ Links ]

---

## Application Page

app.html

Purpose:

Main working area.

Responsibilities:

* Markdown Browser
* Markdown Viewer
* Search
* Categories
* Tags
* Panels
* Cards

Single Page Application only.

No page reloads.

No article URLs.

No separate article pages.

---

# USER INTERFACE

Layout:

┌───────────────────────────────┐
│ Header                        │
├─────────────┬─────────────────┤
│ Sidebar     │ Content Viewer  │
│             │                 │
│ Search      │ Markdown Render │
│ Categories  │                 │
│ Tags        │                 │
│ Cards       │                 │
└─────────────┴─────────────────┘

---

# MARKDOWN SYSTEM

Create custom markdown parser.

No third-party markdown engine.

Supported:

* H1-H6
* Paragraph
* Bold
* Italic
* Underline
* Blockquote
* Ordered List
* Unordered List
* Nested List
* Table
* Code Block
* Inline Code
* Horizontal Rule
* Hyperlink
* Image
* Task List

Workflow:

Card Click

↓

Load Markdown

↓

Parse Markdown

↓

Render Viewer

No page navigation.

No page generation.

No article routing.

---

# SKYBOX SYSTEM

Landing page must focus heavily on visual quality.

Implement:

* Cube Skybox
* Parallax Layers
* Camera Depth
* Smooth Interpolation
* Motion Smoothing
* Inertia Movement

Skybox textures:

* Front
* Back
* Left
* Right
* Top
* Bottom

All textures loaded from local files.

---

# DEVICE OPTIMIZATION

Desktop:

Input:

Mouse

Features:

* Camera Rotation
* Smooth Follow
* Inertia
* Depth Tracking

Mobile:

Input:

Gyroscope

Features:

* Device Orientation API
* Motion Tracking
* Permission Handling
* Smooth Interpolation

Automatic device detection.

---

# PROJECT STRUCTURE LOCK

Website/

├── index.html
├── app.html
│
├── assets/
│   │
│   ├── backgrounds/
│   │   ├── skybox_front.webp
│   │   ├── skybox_back.webp
│   │   ├── skybox_left.webp
│   │   ├── skybox_right.webp
│   │   ├── skybox_top.webp
│   │   └── skybox_bottom.webp
│   │
│   ├── images/
│   │   ├── avatar.webp
│   │   ├── banner.webp
│   │   └── ...
│   │
│   ├── icons/
│   │   ├── home.svg
│   │   ├── search.svg
│   │   ├── menu.svg
│   │   └── close.svg
│   │
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── index.css
│   │   ├── app.css
│   │   ├── skybox.css
│   │   ├── panel.css
│   │   ├── card.css
│   │   └── markdown.css
│   │
│   └── js/
│       │
│       ├── core/
│       │   ├── app.js
│       │   ├── router.js
│       │   ├── state.js
│       │   └── config.js
│       │
│       ├── skybox/
│       │   ├── skybox-engine.js
│       │   ├── gyroscope.js
│       │   ├── mouse-control.js
│       │   └── parallax.js
│       │
│       ├── markdown/
│       │   ├── parser.js
│       │   ├── renderer.js
│       │   └── sanitizer.js
│       │
│       ├── ui/
│       │   ├── panel.js
│       │   ├── card.js
│       │   ├── modal.js
│       │   ├── sidebar.js
│       │   └── viewer.js
│       │
│       ├── search/
│       │   ├── indexer.js
│       │   └── search.js
│       │
│       └── utils/
│           ├── dom.js
│           ├── image.js
│           ├── storage.js
│           └── helpers.js
│
├── content/
│   │
│   ├── posts/
│   │   ├── welcome.md
│   │   ├── article-01.md
│   │   ├── article-02.md
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── about.md
│   │   ├── links.md
│   │   └── contact.md
│   │
│   └── manifest.json
│
├── data/
│   ├── posts.json
│   ├── tags.json
│   └── categories.json
│
├── robots.txt
├── sitemap.xml
└── README.md

---

# PERFORMANCE TARGETS

Requirements:

* Lighthouse Performance ≥ 95
* Lighthouse Accessibility ≥ 95
* Lighthouse SEO ≥ 95
* Lighthouse Best Practices ≥ 95

Target FPS:

* Desktop 60 FPS
* Mobile 60 FPS

Optimization:

* requestAnimationFrame
* IntersectionObserver
* Passive Event Listeners
* Lazy Loading
* Hardware Acceleration
* Memory Leak Prevention

---

# SECURITY REQUIREMENTS

Implement:

* XSS Protection
* Markdown Sanitization
* URL Validation
* Safe DOM Rendering
* Content Security Policy

Never trust markdown input.

---

# DELIVERABLES

Generate complete production-ready code.

Requirements:

* No placeholders
* No pseudo-code
* No TODO comments
* No omitted files
* No simplified examples

Every file must be fully functional.

Generate code exactly according to the Architecture Lock and Project Structure Lock specifications above.

```
