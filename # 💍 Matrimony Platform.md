# 💍 Matrimony Platform — AI Development Prompt & Project Specification

> **PURPOSE OF THIS FILE:** This document is a structured prompt and specification guide intended to be read by an AI coding assistant (e.g., Claude, Cursor, GitHub Copilot) to develop a full-stack matrimony web application. Follow every section sequentially. Do not skip steps. Respect all constraints, tech choices, and business rules defined here.

---
## **0. GLOBAL PRINCIPLES**

### **0.1 Core Principles**

- Always follow framework conventions:
    - Backend: Laravel (PSR-12, Eloquent ORM, Service/Repository pattern)
    - Frontend: Next.js 14+ App Router with TypeScript

- Never use `any` in TypeScript — always define strict interfaces/types.

- Never trust client input — always validate, sanitize, and cast data.

- Never use `$request->all()` — always whitelist fields explicitly.

- Never allow partial data writes — ensure atomic operations.

- Use database transactions (`DB::transaction`) for multi-table operations.

- Do NOT use try-catch everywhere. Use it only when:
    - Custom error handling is required
    - Additional logging context is needed
    - Graceful recovery is required

- Always separate concerns:
    - Controller → Request handling
    - Service → Business logic
    - Model → Data layer

- Never pass raw Request objects into Service layer — use validated data or DTOs.

- Use constants/enums for fixed values — avoid magic strings.

- Use config files for static/business values — never hardcode.

- Design for idempotency where applicable (updates, payments, retries).

- Always consider scalability and performance (queries, caching, indexing).

- Write clean, readable, maintainable code — prioritize clarity over cleverness.

---

### **0.2 BACKEND (Laravel Rules)**

- Every API must be protected with Laravel Sanctum unless explicitly public.
- Always enforce authorization using Policies or Gates at controller/service entry.
- Every controller must use Form Request classes — no inline validation.
- Validate business logic beyond FormRequest when required (ownership, conditions).
- Use Eloquent ORM for all database operations — no raw SQL except complex reporting.
- Every model must define:
    - `$fillable`
    - `$hidden`
    - `$casts`
    - Relationships

- Prevent N+1 queries using eager loading (`with`, `load`).
- Always use API Resources / Transformers — never return raw models.
- Keep controllers thin — move business logic to Service layer.
- Use Repository pattern when abstraction is beneficial.
- Use database transactions for all multi-step writes.
- Handle nullable fields explicitly to prevent accidental overwrites.
- Use soft deletes where recovery is required.
- Always hash sensitive data — never store plain text secrets.
- Use Events/Listeners for side effects (emails, notifications, etc.).
- Use database queue driver for background jobs.
- Use factories and seeders for test/demo data.
- Never modify existing migrations — always create new ones.
- Add indexes for frequently queried columns.
- Use database constraints (foreign keys, unique indexes) for data integrity.
- Prevent race conditions using:
    - Transactions
    - Unique constraints
    - Optional row locking
- Log all critical operations with structured context:
    - user_id
    - request_id (if available)
    - key identifiers

  Format:[MODULE NAME - action description]
---

### **0.3 API & SECURITY RULES**

- All APIs must be versioned (e.g., `/api/v1/`).

- All responses must follow this format:
```json
{ "success": true, "data": {}, "message": "string", "errors": {} }
```
---

### **0.3 FRONTEND (Next.js Rules)**
- Use Next.js 14+ App Router with TypeScript.
- Never use `any` — define proper types/interfaces.
- Use Tailwind CSS — no inline styles.
- Keep components small, reusable, and modular.
- Separate concerns:
- UI components
- Hooks (logic)
- Services (API calls)
- Use server components where possible; client components only when needed.
- Centralize API calls in a service layer — avoid direct API calls inside components.
- Handle loading, error, and empty states properly.
- Use proper form validation (client + server consistency).
- Avoid unnecessary re-renders — use memoization when needed.
- Follow accessibility best practices (semantic HTML, ARIA).
---
### 0.4 FRONTEND DESIGN SYSTEM (UI/UX GUIDELINES)

### Design Style
- Modern, clean, premium matrimony platform
- Inspired by: Shaadi.com / Bharat Matrimony style UI (but more lightweight and modern)
- Layout: card-based, spacious, minimal clutter

### Color System
- Primary: Gold (#C9A227 / #D4AF37 gradient allowed)
- Secondary: White (#FFFFFF)
- Background: Soft light gray (#F8F9FB)
- Text: Dark charcoal (#1F2937)
- Accent: Soft green for success, red for errors

### UI Feel
- Premium but minimal
- No heavy shadows or animations
- Smooth transitions only (150–250ms max)
- Rounded corners (8px–16px standard)

### Typography
- Use modern sans-serif (Inter / Poppins)
- Clear hierarchy:
    - H1: bold, large
    - H2: medium bold
    - Body: regular readable size
- No decorative fonts

### Component Style Rules
- Cards must be lightweight (no heavy blur or shadows)
- Buttons: solid + outline variants only
- Inputs: minimal border, focus highlight in gold
- Forms: step-by-step where possible (not long single page forms)

### Spacing System
- Use consistent spacing scale (4px, 8px, 16px, 24px, 32px)
- Avoid random padding/margin values

### Animation Rules
- No heavy animations
- Only:
    - fade-in
    - slide-up
    - hover scale (very subtle)

### Performance Rules (IMPORTANT)
- No layout shift (CLS = 0 target)
- Lazy load images
- Use Next/Image optimization
- Avoid unnecessary client components

### Performance Rules

- Target metrics:
    - LCP < 2.5s
    - INP < 200ms
    - CLS = 0
    - FCP < 1.8s
    - TTFB < 600ms
- Always use:
    - Next.js Image optimization
    - Lazy loading components
    - Dynamic imports for heavy UI
- Never:
    - Load all JS in one bundle
    - Render heavy components on initial load
    - Block main thread with large computations
- Split code:
    - page-level components
    - reusable UI components
    - service layer for API calls
- Prefer Server Components over Client Components


### SEO Rules

- Every page must have:
    - Unique title
    - Meta description
    - OpenGraph tags
    - Structured data (JSON-LD)
- Use semantic HTML:
    - header, main, section, article, footer
- Use keyword strategy:
    - matrimony
    - marriage profile
    - bride/groom search
    - matchmaking
- URL structure must be clean:
    - /profile/{id}
    - /search
    - /success-stories
- Avoid duplicate content
- Pre-render important pages (SSR/SSG where possible)

---

## 1. PROJECT OVERVIEW

| Property | Value |
|---|---|
| **Project Name** | Bondhon (বন্ধন) — Matrimony Platform |
| **Type** | Full-stack Web Application |
| **Purpose** | A matrimony platform where users can create profiles, find matches, connect, chat, and call each other |
| **Target Market** | Bangladesh (primary), South Asian diaspora (secondary) |
| **Primary Language** | English (UI), Bengali support optional |

---

## 2. TECH STACK (STRICT — DO NOT CHANGE)

### Backend
| Layer | Technology | Version    |
|---|---|------------|
| Framework | Laravel | 12.x       |
| Language | PHP | 8.1+       |
| Database | MySQL | 8.0+       |
| Cache | Redis | 7.x        |
| Queue | Database Queue Driver | (built-in) |
| Real-time | Laravel Reverb | latest     |
| Search | Laravel Scout + MySQL Full-Text | built-in   |
| Storage | Cloudflare R2 (S3-compatible) | —          |
| Auth | Laravel Sanctum (SPA) | —          |
| Email | SMTP / Mailtrap (dev) | —          |
| SMS | — (removed) | —          |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| State Management | Zustand | latest |
| Server State | TanStack Query (React Query) | v5 |
| Real-time Client | Laravel Echo + Pusher JS (for Reverb) | latest |
| HTTP Client | Axios | latest |
| Forms | React Hook Form + Zod | latest |
| Video/Audio Calls | WebRTC (native browser API) | — |

### Infrastructure
| Service | Tool |
|---|---|
| App Hosting | DigitalOcean Droplet |
| Frontend Hosting | Vercel |
| Database | Managed MySQL (DigitalOcean) |
| Cache | Upstash Redis |
| File Storage | Cloudflare R2 |
| STUN Server | Google STUN (stun.l.google.com:19302) — free |
| TURN Server | Coturn (self-hosted on VPS) or Metered.ca free tier |
| Payment | SSLCommerz (Bangladesh) |

---

## 3. FOLDER STRUCTURE

### Laravel Backend (`/backend`)
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthController.php
│   │   │   │   └── EmailVerificationController.php
│   │   │   ├── ProfileController.php
│   │   │   ├── MatchController.php
│   │   │   ├── InterestController.php
│   │   │   ├── ChatController.php
│   │   │   ├── MessageController.php
│   │   │   ├── CallController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── SubscriptionController.php
│   │   │   └── Admin/
│   │   │       ├── AdminDashboardController.php
│   │   │       ├── AdminUserController.php
│   │   │       ├── AdminPhotoModerationController.php
│   │   │       └── AdminReportController.php
│   │   ├── Requests/
│   │   │   ├── Auth/RegisterRequest.php
│   │   │   ├── Auth/LoginRequest.php
│   │   │   ├── Profile/UpdateProfileRequest.php
│   │   │   ├── Profile/UpdatePreferenceRequest.php
│   │   │   └── Chat/SendMessageRequest.php
│   │   └── Middleware/
│   │       ├── EnsureEmailIsVerified.php
│   │       ├── EnsureProfileIsComplete.php
│   │       └── CheckSubscription.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Profile.php
│   │   ├── ProfilePhoto.php
│   │   ├── ReligiousDetail.php
│   │   ├── FamilyDetail.php
│   │   ├── EducationCareer.php
│   │   ├── Lifestyle.php
│   │   ├── HoroscopeDetail.php
│   │   ├── PartnerPreference.php
│   │   ├── Interest.php
│   │   ├── ProfileView.php
│   │   ├── Shortlist.php
│   │   ├── Block.php
│   │   ├── Report.php
│   │   ├── Conversation.php
│   │   ├── Message.php
│   │   ├── CallLog.php
│   │   ├── Notification.php
│   │   ├── Subscription.php
│   │   └── MatchScore.php
│   ├── Services/
│   │   ├── MatchingService.php
│   │   ├── ProfileCompletionService.php
│   │   ├── NotificationService.php
│   │   ├── WebRTCSignalingService.php
│   │   ├── SubscriptionService.php
│   │   └── PhotoModerationService.php
│   ├── Events/
│   │   ├── MessageSent.php
│   │   ├── CallInitiated.php
│   │   ├── CallAnswered.php
│   │   ├── CallEnded.php
│   │   ├── InterestReceived.php
│   │   └── UserOnlineStatus.php
│   ├── Listeners/
│   │   └── SendInterestNotification.php
│   └── Jobs/
│       ├── SendDailyMatchDigest.php
│       ├── ExpireOldInterests.php
│       └── SendEmailNotification.php
├── database/
│   ├── migrations/
│   └── seeders/
└── routes/
    ├── api.php
    └── channels.php
```

### Next.js Frontend (`/frontend`)
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/
│   │   │   ├── edit/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── matches/page.tsx
│   │   ├── search/page.tsx
│   │   ├── interests/page.tsx
│   │   ├── shortlist/page.tsx
│   │   ├── chat/
│   │   │   ├── page.tsx
│   │   │   └── [conversationId]/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── subscription/page.tsx
│   └── admin/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── users/page.tsx
│       ├── photos/page.tsx
│       └── reports/page.tsx
├── components/
│   ├── auth/
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileDetail.tsx
│   │   └── ProfileCompletionBar.tsx
│   ├── match/
│   │   ├── MatchCard.tsx
│   │   └── CompatibilityScore.tsx
│   ├── chat/
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   ├── call/
│   │   ├── IncomingCallModal.tsx
│   │   ├── VideoCallScreen.tsx
│   │   └── AudioCallScreen.tsx
│   ├── notification/
│   │   └── NotificationBell.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── api.ts
│   ├── echo.ts
│   ├── webrtc.ts
│   └── utils.ts
├── store/
│   ├── authStore.ts
│   ├── callStore.ts
│   └── notificationStore.ts
└── types/
    ├── user.ts
    ├── profile.ts
    ├── message.ts
    └── call.ts
```

---

## 4. DATABASE SCHEMA (Generate all migrations in this order)

### 4.1 `users` table
```
id, name, email (unique), email_verified_at, password, gender (enum: male,female),
profile_created_by (enum: self, parents, siblings), role (enum: user, admin),
is_active (boolean, default true), is_banned (boolean, default false),
subscription_plan (enum: free, silver, gold, platinum, default: free),
subscription_expires_at (nullable timestamp),
remember_token, timestamps, softDeletes
```

### 4.2 `profiles` table
```
id, user_id (FK → users), profile_id (unique string e.g. "BON-001234"),
dob (date), height_cm (integer), weight_kg (integer),
complexion (enum: very_fair, fair, wheatish, dark),
blood_group (enum: A+,A-,B+,B-,O+,O-,AB+,AB-),
marital_status (enum: never_married, divorced, widowed, awaiting_divorce),
mother_tongue (string), nationality (string, default: Bangladeshi),
country (string), state (string), city (string),
about_me (text, nullable),
profile_completion_percentage (integer, default: 0),
is_verified (boolean, default: false),
is_photo_approved (boolean, default: false),
last_seen_at (nullable timestamp),
timestamps
```

### 4.3 `religious_details` table
```
id, user_id (FK), religion (string), caste (string, nullable),
sub_caste (string, nullable), gotra (string, nullable),
manglik_status (enum: yes, no, partial, dont_know),
timestamps
```

### 4.4 `family_details` table
```
id, user_id (FK), family_type (enum: joint, nuclear, extended),
family_status (enum: middle_class, upper_middle_class, rich, affluent),
family_income_bdt_per_month (integer, nullable),
father_occupation (string, nullable), mother_occupation (string, nullable),
brothers_count (integer, default: 0), sisters_count (integer, default: 0),
timestamps
```

### 4.5 `education_careers` table
```
id, user_id (FK), highest_education (string),
college_university (string, nullable), profession (string),
employed_in (enum: private, government, business, self_employed, not_working),
annual_income_bdt (integer, nullable), timestamps
```

### 4.6 `lifestyles` table
```
id, user_id (FK), diet (enum: vegetarian, non_vegetarian, vegan, jain),
smoking (enum: non_smoker, smoker, occasionally),
drinking (enum: non_drinker, drinker, occasionally),
hobbies (json, nullable), languages_known (json), timestamps
```

### 4.7 `horoscope_details` table
```
id, user_id (FK), birth_place (string, nullable), birth_time (time, nullable),
rashi (string, nullable), nakshatra (string, nullable),
manglik (boolean, nullable), timestamps
```

### 4.8 `partner_preferences` table
```
id, user_id (FK),
age_min (integer), age_max (integer),
height_min_cm (integer), height_max_cm (integer),
marital_status (json), religion (json), caste (json, nullable),
education (json, nullable), profession (json, nullable),
income_min_bdt (integer, nullable), income_max_bdt (integer, nullable),
country (json, nullable), city (json, nullable),
diet (json, nullable), smoking_acceptable (boolean, default: true),
drinking_acceptable (boolean, default: true),
timestamps
```

### 4.9 `profile_photos` table
```
id, user_id (FK), file_path (string), is_primary (boolean, default: false),
is_approved (boolean, default: false), is_private (boolean, default: false),
moderation_status (enum: pending, approved, rejected, default: pending),
timestamps
```

### 4.10 `interests` table
```
id, sender_id (FK → users), receiver_id (FK → users),
status (enum: pending, accepted, declined, ignored, expired, default: pending),
expires_at (timestamp — set to 30 days from creation),
timestamps
```
**Business rule:** Sender cannot send interest to same receiver twice if previous is still pending. Auto-expire via `ExpireOldInterests` job.

### 4.11 `profile_views` table
```
id, viewer_id (FK → users), viewed_id (FK → users), viewed_at (timestamp)
```
**Business rule:** Only record once per day per viewer-viewed pair.

### 4.12 `shortlists` table
```
id, user_id (FK), shortlisted_user_id (FK → users), timestamps
```

### 4.13 `blocks` table
```
id, blocker_id (FK → users), blocked_id (FK → users), timestamps
```

### 4.14 `reports` table
```
id, reporter_id (FK → users), reported_id (FK → users),
reason (enum: fake_profile, inappropriate_photo, abusive, spam, other),
description (text, nullable),
status (enum: pending, reviewed, action_taken, dismissed, default: pending),
timestamps
```

### 4.15 `conversations` table
```
id, user_one_id (FK → users), user_two_id (FK → users),
last_message_at (nullable timestamp),
timestamps
```
**Business rule:** Unique pair (user_one_id, user_two_id) — always store lower ID as user_one_id.

### 4.16 `messages` table
```
id, conversation_id (FK), sender_id (FK → users),
type (enum: text, image, document, voice),
body (text, nullable), file_path (string, nullable),
is_deleted (boolean, default: false),
delivered_at (nullable timestamp), read_at (nullable timestamp),
timestamps
```

### 4.17 `call_logs` table
```
id, caller_id (FK → users), receiver_id (FK → users),
type (enum: audio, video),
status (enum: initiated, answered, missed, declined, ended),
started_at (nullable timestamp), ended_at (nullable timestamp),
duration_seconds (integer, nullable),
timestamps
```

### 4.18 `notifications` table (use Laravel default + custom fields)
```
Standard Laravel notifications table +
is_read (boolean, default: false), read_at (nullable timestamp)
```

### 4.19 `subscriptions` table
```
id, user_id (FK), plan (enum: silver, gold, platinum),
amount_bdt (decimal 10,2), payment_method (string),
transaction_id (string, unique), status (enum: pending, active, expired, refunded),
starts_at (timestamp), expires_at (timestamp), timestamps
```

### 4.20 `match_scores` table
```
id, user_id (FK), candidate_id (FK → users),
score (decimal 5,2 — 0.00 to 100.00),
score_breakdown (json), calculated_at (timestamp), timestamps
```

---

## 5. API ROUTES (All prefixed with `/api/v1`)

### Auth Routes (Public)
```
POST   /auth/register              → AuthController@register
POST   /auth/login                 → AuthController@login
POST   /auth/logout                → AuthController@logout (auth required)
GET    /auth/me                    → AuthController@me (auth required)
POST   /auth/email/resend          → EmailVerificationController@resend
GET    /auth/email/verify/{id}/{hash} → EmailVerificationController@verify
POST   /auth/password/forgot       → ForgotPasswordController@sendLink
POST   /auth/password/reset        → ResetPasswordController@reset
```

### Profile Routes (Auth required)
```
GET    /profile                    → ProfileController@show (own profile)
PUT    /profile                    → ProfileController@update
GET    /profile/{profileId}        → ProfileController@showById (view others)
POST   /profile/photos             → ProfileController@uploadPhoto
DELETE /profile/photos/{photoId}  → ProfileController@deletePhoto
PUT    /profile/photos/{photoId}/primary → ProfileController@setPrimaryPhoto
PUT    /preferences                → ProfileController@updatePreferences
GET    /profile/completion         → ProfileController@completionStatus
```

### Match Routes (Auth required)
```
GET    /matches                    → MatchController@index (daily suggestions)
GET    /matches/search             → MatchController@search (with filters)
GET    /matches/{userId}/score     → MatchController@compatibilityScore
GET    /matches/search?query=BON-001234 → MatchController@searchById
```

### Interest Routes (Auth required)
```
POST   /interests                  → InterestController@send
GET    /interests/received         → InterestController@received
GET    /interests/sent             → InterestController@sent
PUT    /interests/{id}/accept      → InterestController@accept
PUT    /interests/{id}/decline     → InterestController@decline
PUT    /interests/{id}/ignore      → InterestController@ignore
```

### Shortlist / Block Routes (Auth required)
```
POST   /shortlist/{userId}         → ShortlistController@toggle
GET    /shortlist                  → ShortlistController@index
POST   /block/{userId}             → BlockController@block
DELETE /block/{userId}             → BlockController@unblock
POST   /report/{userId}            → ReportController@report
GET    /profile-views              → ProfileViewController@myViewers
```

### Chat Routes (Auth required + mutual interest enforced)
```
GET    /conversations              → ChatController@index
GET    /conversations/{id}/messages → MessageController@index
POST   /conversations/{id}/messages → MessageController@send
DELETE /messages/{id}             → MessageController@delete
PUT    /messages/{id}/read        → MessageController@markRead
```

### Call Routes (Auth required + premium check)
```
POST   /calls/initiate             → CallController@initiate
PUT    /calls/{id}/answer          → CallController@answer
PUT    /calls/{id}/decline         → CallController@decline
PUT    /calls/{id}/end             → CallController@end
GET    /calls/history              → CallController@history
```

### Notification Routes (Auth required)
```
GET    /notifications              → NotificationController@index
PUT    /notifications/{id}/read   → NotificationController@markRead
PUT    /notifications/read-all    → NotificationController@markAllRead
DELETE /notifications/{id}        → NotificationController@destroy
```

### Subscription Routes (Auth required)
```
GET    /subscription/plans         → SubscriptionController@plans
POST   /subscription/initiate      → SubscriptionController@initiate (SSLCommerz)
POST   /subscription/callback      → SubscriptionController@callback (SSLCommerz webhook — public)
GET    /subscription/status        → SubscriptionController@status
```

### Admin Routes (Auth + Admin role required)
```
GET    /admin/dashboard            → AdminDashboardController@stats
GET    /admin/users                → AdminUserController@index
PUT    /admin/users/{id}/ban       → AdminUserController@ban
PUT    /admin/users/{id}/verify    → AdminUserController@verify
GET    /admin/photos/pending       → AdminPhotoModerationController@pending
PUT    /admin/photos/{id}/approve  → AdminPhotoModerationController@approve
PUT    /admin/photos/{id}/reject   → AdminPhotoModerationController@reject
GET    /admin/reports              → AdminReportController@index
PUT    /admin/reports/{id}/action  → AdminReportController@takeAction
POST   /admin/notifications/broadcast → AdminNotificationController@broadcast
```

---

## 6. MATCHING ALGORITHM (Analytics-Based — No AI/ML)

The `MatchingService` calculates a **compatibility score (0–100%)** using weighted analytics. Implement as follows:

```
SCORE BREAKDOWN (total = 100 points):

1. Religion match              → 20 points (exact match = 20, else 0)
2. Age within preference range → 15 points (within range = 15, close = 7, else 0)
3. Location match              → 15 points (same city=15, same state=8, same country=4)
4. Education level match       → 10 points (same level=10, one level diff=5)
5. Income range match          → 10 points (within partner preferred range=10)
6. Marital status match        → 10 points (preference match=10, else 0)
7. Diet compatibility          → 8 points (both same=8, compatible=4)
8. Height within preference    → 7 points (within range=7, close=3)
9. Lifestyle match             → 5 points (smoking/drinking pref match)

Store score + breakdown JSON in match_scores table.
Recalculate daily via SendDailyMatchDigest job (cron: daily at 8am).
```

**Matching rules:**
- Only suggest profiles of opposite gender.
- Never suggest blocked users.
- Never suggest already-accepted connections.
- Paginate results (20 per page), sorted by score descending.

---

## 7. REAL-TIME EVENTS (Laravel Reverb + Laravel Echo)

### WebSocket Channel Definitions (`routes/channels.php`)

```php
// Private channel per user
Broadcast::channel('user.{userId}', fn($user, $userId) => $user->id === (int)$userId);

// Private conversation channel
Broadcast::channel('conversation.{conversationId}', function($user, $conversationId) {
    $convo = Conversation::find($conversationId);
    return $convo && ($convo->user_one_id === $user->id || $convo->user_two_id === $user->id);
});
```

### Events to Broadcast

| Event Class | Channel | Frontend Listens On |
|---|---|---|
| `MessageSent` | `conversation.{id}` (private) | Chat window |
| `CallInitiated` | `user.{receiverId}` (private) | Incoming call modal |
| `CallAnswered` | `user.{callerId}` (private) | Start video/audio |
| `CallEnded` | both users' channels | End call screen |
| `InterestReceived` | `user.{receiverId}` (private) | Notification bell |
| `UserOnlineStatus` | `user.{userId}` (private) | Online dot on profile |

---

## 8. WEBRTC CALL FLOW (No external SDK — pure browser WebRTC)

### Signaling Flow (via Laravel Reverb)

```
CALL INITIATION:
1. Caller clicks "Call" → POST /api/v1/calls/initiate → returns call_id
2. Backend broadcasts CallInitiated event to receiver's channel
3. Receiver sees IncomingCallModal in Next.js

CALL ACCEPTANCE:
4. Receiver clicks "Accept" → PUT /api/v1/calls/{id}/answer
5. Backend broadcasts CallAnswered to caller's channel
6. Both sides create RTCPeerConnection with ice servers

ICE SERVER CONFIG (hardcode in frontend):
{
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
}

OFFER/ANSWER EXCHANGE (via Reverb):
7. Caller creates RTCPeerConnection → createOffer() → setLocalDescription
8. Caller sends offer SDP to backend → backend relays via WebSocket to receiver
9. Receiver setRemoteDescription(offer) → createAnswer() → setLocalDescription
10. Receiver sends answer SDP → backend relays to caller
11. Caller setRemoteDescription(answer)

ICE CANDIDATE EXCHANGE:
12. Both sides: onicecandidate → send candidate via WebSocket to other party
13. Both sides: receive candidate → addIceCandidate()

CALL ACTIVE:
14. ontrack event fires → attach MediaStream to <video> element
15. Frontend starts call timer

CALL END:
16. Either party clicks "End" → PUT /api/v1/calls/{id}/end
17. Backend stores duration → broadcasts CallEnded to both
18. Frontend closes RTCPeerConnection, stops media tracks
```

**Access rules:**
- Audio/Video calling is only available to **Gold and Platinum** subscribers.
- Users must have **mutual accepted interest** before calling.
- If receiver is offline → status set to `missed`.

---

## 9. NOTIFICATION SYSTEM

### In-App Notifications (stored in DB)
Trigger on these events:
- New interest received
- Interest accepted
- Profile viewed (notify viewed user — once per day per viewer)
- New message received
- Match suggestions available (daily digest)
- Subscription expiring in 3 days
- Photo approved/rejected by admin
- Interest request expired

### Email Notifications (queued via database queue)
| Trigger | Email Type |
|---|---|
| Registration | Welcome email |
| Daily (8am) | Match digest (top 5 matches) |
| New message | Message alert (if user offline > 10 min) |
| Interest received | Interest notification |
| Subscription expiry -3 days | Renewal reminder |

### Push Notifications
- Use **Firebase Cloud Messaging (FCM)** for browser push (PWA-ready).
- Store FCM tokens in a `fcm_tokens` table (user_id, token, device).

---

## 10. SUBSCRIPTION & PAYMENT (SSLCommerz)

### Plan Limits (enforce via `CheckSubscription` middleware)

| Feature | Free | Silver | Gold | Platinum |
|---|---|---|---|---|
| Profile views per day | 10 | Unlimited | Unlimited | Unlimited |
| Contact info views per month | 0 | 10 | 30 | Unlimited |
| Send interests per day | 5 | 20 | 50 | Unlimited |
| Chat | Request only | ✅ | ✅ | ✅ |
| Audio/Video Call | ❌ | ❌ | ✅ | ✅ |
| See who liked you | ❌ | ❌ | ✅ | ✅ |
| Profile boost (appear on top) | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ |

### SSLCommerz Integration Flow
```
1. User selects plan → POST /subscription/initiate
2. Backend creates pending subscription → calls SSLCommerz API → returns payment URL
3. Redirect user to SSLCommerz hosted payment page
4. On success → SSLCommerz POSTs to /subscription/callback
5. Backend verifies transaction → activates subscription → sets expires_at
6. Email confirmation sent to user
```

---

## 11. TRUST & SAFETY FEATURES

### Profile Verification
- **Email verification** — required before accessing any feature (use Laravel's built-in email verification).
- **NID/Passport verification** — user uploads document → stored in R2 (private) → admin reviews in panel.
- **Photo verification** — selfie comparison with primary photo → manual admin approval.
- **Verified badge** — show green tick on profile once verified.

### Photo Moderation
- All uploaded photos start as `moderation_status: pending`.
- Admin must approve before photo is visible to other users.
- Rejected photos notify user via in-app + email notification.

### Privacy Settings (store as JSON in `profiles` table column `privacy_settings`)
```json
{
  "show_photo_to": "all | connections_only | none",
  "show_phone_to": "connections_only | none",
  "show_email_to": "none",
  "hide_profile_from": ["user_id_1", "user_id_2"],
  "show_online_status": true
}
```

### Block & Report
- Blocked users cannot view profile, send interest, or message.
- Reported profiles go to admin queue for review.
- 3+ reports on a profile → auto-flag for priority review.

---

## 12. PROFILE COMPLETION TRACKER

Calculate `profile_completion_percentage` in `ProfileCompletionService`:

```
Basic Info (Profile table)        → 15%
Religious Details                 → 10%
Family Details                    → 10%
Education & Career                → 15%
Lifestyle                         → 10%
Horoscope Details                 → 5%
Partner Preferences               → 15%
At least 1 approved photo         → 15%
About Me text (min 50 chars)      → 5%
TOTAL                             → 100%
```

Update `profile_completion_percentage` on every profile save.

---

## 13. SEARCH ENGINE (Laravel Scout + MySQL Full-Text)

### Scout Configuration
```env
SCOUT_DRIVER=database
```

### Searchable Model: `Profile`
Make `Profile` model searchable. Index these fields:
- `about_me`, `city`, `state`, `country`

### Search filters (all optional, combinable):
```
gender, age_min, age_max, religion, caste, marital_status,
height_min, height_max, education, profession, income_min, income_max,
country, city, diet, profile_id (for ID-based search)
```

Apply filters as Eloquent scopes chained on the Scout search query.

---

## 14. FRONTEND PAGES & COMPONENTS

### Key Pages to Build

**Auth Pages**
- `/register` — Multi-step registration (Step 1: basic info, Step 2: profile details, Step 3: preferences)
- `/login` — Email + password
- `/verify-email` — Email verification waiting screen

**Dashboard**
- `/dashboard` — Greeting, profile completion bar, today's matches (6 cards), recent visitors, pending interests badge

**Profile**
- `/profile/edit` — Tabbed form (Personal, Religious, Family, Career, Lifestyle, Horoscope, Preferences, Photos)
- `/profile/[id]` — Public profile view (respect privacy settings)

**Matches & Search**
- `/matches` — Paginated match cards with compatibility score badge
- `/search` — Filter sidebar + profile grid results

**Interests**
- `/interests` — Two tabs: Received | Sent — with Accept/Decline actions

**Chat**
- `/chat` — Conversation list (last message preview, unread count)
- `/chat/[conversationId]` — Full chat window with message history, input bar, voice message button, call button

**Notifications**
- `/notifications` — Full notification list with mark-as-read

**Subscription**
- `/subscription` — Plan comparison table with SSLCommerz pay button

**Admin**
- `/admin/dashboard` — Stats cards (total users, active today, revenue this month, pending photos)
- `/admin/users` — Searchable user table with ban/verify actions
- `/admin/photos` — Photo moderation queue (approve/reject with preview)
- `/admin/reports` — Reported profiles queue

---

## 15. DEVELOPMENT PHASES

> AI must generate code phase by phase. Complete and test each phase before moving to next.

### Phase 1 — Foundation (Week 1–2)
- [ ] Laravel project setup with Sanctum, Reverb config
- [ ] All database migrations in order (section 4)
- [ ] User registration with email verification
- [ ] Login / logout / me endpoint
- [ ] Profile CRUD (all sub-tables)
- [ ] Photo upload to Cloudflare R2
- [ ] Profile completion calculator
- [ ] Basic admin seeder (admin user)

### Phase 2 — Core Features (Week 3–5)
- [ ] Matching algorithm (`MatchingService`)
- [ ] Match score calculation and storage
- [ ] Search with filters (Scout + MySQL Full-Text)
- [ ] Interest system (send, accept, decline, expire job)
- [ ] Shortlist, Block, Report
- [ ] Profile view tracking
- [ ] Next.js frontend: Auth, Dashboard, Profile, Search, Matches pages

### Phase 3 — Real-time (Week 6–8)
- [ ] Laravel Reverb setup and channel definitions
- [ ] Chat system (conversations + messages)
- [ ] Message delivery/read receipts
- [ ] Typing indicator
- [ ] Online/offline status
- [ ] In-app notifications (DB + WebSocket push)
- [ ] Email notification jobs (queued)
- [ ] Next.js: Chat page, Notification bell

### Phase 4 — Calling & Payments (Week 9–10)
- [ ] WebRTC signaling via Reverb (offer/answer/ICE)
- [ ] Call log storage
- [ ] Incoming call modal in Next.js
- [ ] Video/Audio call screen component
- [ ] SSLCommerz subscription flow
- [ ] Subscription middleware enforcement
- [ ] Next.js: Subscription page, Call UI

### Phase 5 — Admin & Safety (Week 11–12)
- [ ] Admin panel (all routes and pages)
- [ ] Photo moderation queue
- [ ] Report review system
- [ ] Profile/NID verification workflow
- [ ] Broadcast notification from admin
- [ ] FCM push notification setup
- [ ] Daily match digest cron job

---

## 16. ENVIRONMENT VARIABLES (`.env` template)

```env
APP_NAME="Bondhon"
APP_ENV=production
APP_KEY=
APP_URL=https://api.bondhon.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bondhon
DB_USERNAME=
DB_PASSWORD=

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=database

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

BROADCAST_DRIVER=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=0.0.0.0
REVERB_PORT=8080

FILESYSTEM_DISK=r2
AWS_ACCESS_KEY_ID=           # Cloudflare R2 key
AWS_SECRET_ACCESS_KEY=       # Cloudflare R2 secret
AWS_DEFAULT_REGION=auto
AWS_BUCKET=bondhon-media
AWS_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=true

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS="noreply@bondhon.com"
MAIL_FROM_NAME="Bondhon"

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_SANDBOX=true

FIREBASE_SERVER_KEY=         # For FCM push notifications

SCOUT_DRIVER=database
```

---

## 17. CODING STANDARDS & CONSTRAINTS

1. **Never expose user email or phone** in public profile API responses.
2. **Always paginate** list endpoints (default: 20 per page).
3. **Rate limit** sensitive endpoints: login (5/min), register (3/min), interest send (per plan limit).
4. **Soft delete** users — never hard delete.
5. **All timestamps** stored in UTC. Frontend converts to user's local timezone.
6. **Images** must be resized to max 1200px wide before uploading to R2 (use Intervention Image).
7. **Passwords** hashed with bcrypt (Laravel default).
8. **API versioned** under `/api/v1/` — future versions go in `/api/v2/`.
9. **CORS** configured to allow only the Next.js frontend domain.
10. **All money values** stored in BDT (Bangladeshi Taka) as integers (taka only, no paisa).
11. **Match scores** recalculate nightly — never calculate on request (too slow).
12. **Chat is only allowed** between users with mutually accepted interests.
13. **Calls are only allowed** for Gold/Platinum subscribers with mutual accepted interest.
14. **Blocked users** are completely invisible to each other across all queries.

---

*End of project specification. AI: Begin with Phase 1. Generate code file by file, run migrations, seed the database, then proceed to Phase 2.*
