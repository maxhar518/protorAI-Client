

## Plan: Remove Navbar Links & Add Features/About/Contact Sections to Home Page

### Changes

**1. Update `src/components/Navbar.tsx`**
- Remove "Features", "About", and "Contact" from `navLinks` array
- Keep only: Home, Quiz, PDF Upload

**2. Expand `src/components/Hero.tsx` to a full landing page**

Add three new sections below the existing hero content:

**Features Section** (`#features`)
- Grid of 6 feature cards highlighting ProtorAi capabilities:
  - AI Eye Tracking, Tab Switch Detection, Fullscreen Enforcement, Copy/Paste Prevention, Webcam Monitoring, Violation Logging
- Each card: icon, title, short description
- Section heading: "Comprehensive Anti-Cheating Features"

**About Section** (`#about`)
- Two-column layout: text + stats/visual
- Mission statement about ProtorAi's purpose
- Key stats (detection rate, assessments secured, institutions)
- Brief explanation of how the AI proctoring works

**Contact Section** (`#contact`)
- Simple contact form (name, email, message) - UI only
- Contact info sidebar (email, social links)
- Section heading: "Get in Touch"

All sections use existing Tailwind classes, shadcn Card components, and lucide icons for consistency.

