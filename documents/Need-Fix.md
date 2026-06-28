# Frontend & Email Template Fix Requirements

## Frontend Need to Fix

### Login Page

**URL:** `http://localhost:3000/login`

---

## Left Side of Login Page

### 1. Site Name (Done)

* Currently showing **"Enorsia"** as a static value.
* Make it dynamic and load from:

  * **Site Settings → Site Name**

### 2. Slogan (Done)

* Currently showing **"Enorsia Matrimony"** as a static value.
* Create a new field:

  * **Site Settings → Slogan**
* Display the slogan dynamically.

### 3. Replace Hero Section Content (Done)

Keep the existing design and indentation unchanged.

Replace the following text across all pages where it appears:

* Login
* Register
* Verify Email
* Forgot Password
* Reset Password

#### Find

```text
Premium Matrimony Platform
Find Your
Perfect Match

Join thousands of families who found their perfect life partner through Enorsia's intelligent matchmaking.

50K+
Members

12K+
Matches Made

98%
Satisfaction

"Where hearts find their home"
```

#### Replace With

```text
Premium Matrimony Platform

Find Your Perfect Match

Join a trusted matrimony platform designed to help individuals and families connect with compatible life partners through secure and intelligent matchmaking.

Verified Profiles

Smart Match Suggestions

Privacy & Security

Start Your Journey Today

"Where meaningful relationships begin"
```

---

## Right Side of Login Page (Done)

### Sign In Text

Replace:

```text
Sign in to your Enorsia account
```

With:

```text
Sign in to your {Site Name} account
```

Where `{Site Name}` is loaded dynamically from Site Settings.

---

## Reset Password Page (Done)

### Issue

When a user clicks the password reset link from email:

* First password reset works correctly.
* If the same reset link is opened again, the page displays an incorrect error message:

```text
T
```

---

# OTP Confirmation Email & Reset Password Email Template

## Global Email Template Changes (Done)

### Email Header

For all email templates:

#### Line 1

```text
{Site Name}
```

#### Line 2

```text
{Slogan}
```

Both values should be loaded dynamically from Site Settings.

---

## Registration OTP Email (Done)

### 1. Email Subject

Replace with:

```text
{Site Name} - Verify your email
```

---

### 2. Welcome Text (Done)

Replace:

```text
Welcome to Enorsia
```

With:

```text
Welcome to {Site Name}
```

---

### 3. Remove Verification Button Section (Done)

Remove:

```text
Click the button below to confirm your email address:
```

Remove:

```text
Verify My Email
```

Remove:

```text
Or use this one-time verification code:
```

The email should only display the OTP code.

---

### 4. OTP Expiry Time (Done)

Current text:

```text
This code expires in 15 minutes.
```

Requirements:

* Verify the actual OTP expiration time configured in the backend.
* Display the real expiry duration dynamically.
* Ensure frontend and backend values are consistent.

---

### 5. Remove Verification Link Expiry Text (Done)

Remove:

```text
This verification link will expire in 60 minutes.
```

---

### 6. Remove Fallback Link Section (Done)

Remove:

```text
If the button doesn't work, copy and paste this link into your browser:
```

Remove the URL displayed below it.

---

### 7. Replace "Enorsia" Globally (Done)

Replace all occurrences of:

```text
Enorsia
```

or

```text
Enorsia
```

with:

```text
{Site Name}
```

across all email templates.

---

### 8. Footer Updates (Done)

#### Remove

```text
Don't want these emails? Unsubscribe here
```

#### Make Footer Dynamic

Current static text:

```text
Bangladesh's Most Trusted Matrimony
```

Replace with:

```text
{Slogan}
```

add social link on footer.

loaded dynamically from Site Settings.

Apply this change globally to all email templates.

# Additional Frontend Fix Requirements

## After Login - Global Sidebar (Done)

1. Clicking the Site Name should redirect to the Home page. (Done)
2. Display the **Slogan** after the Site Name and remove the static text **"Matrimony"**. (Done)
3. Move **Upgrade Plan** menu directly below **My Profile**. (Done)
4. Rename **Profile Views** to **Profile Viewers** and place it after **Notifications**. (Done)
5. In Mobile View, all sidebar menu items are not visible. Investigate and ensure all menu items are accessible and displayed properly. (Done)

---

## Edit Profile (Done)

1. After successfully saving a tab, automatically navigate the user to the next tab. (Done)
2. Fix dropdown positioning issues. On smaller screens, dropdown options are cut off and not fully visible (e.g., **Employed In** field). (Done)
3. Add a new setting:

   * **Site Settings → Photo Auto Approval** (Done)
   * If enabled, uploaded photos should be approved automatically. (Done)
4. Upload profile photos to Cloudflare from the backend and serve all profile images from Cloudflare. (Done)

---

## Search Page

1. Rename button text:

   * **Apply Filters** → **Apply** (Done)
2. Apply **Verified** badge/filter for all verified (face approved) profiles. (Done)
3. Display profile images from Cloudflare and ensure image sizing matches card dimensions. (Done)
4. When a user clicks **Send Interest**, send an email notification to the recipient. (Done)
5. Implement infinite scroll / scroll pagination. (Done, not check yet)
6. Exclude Admin users from search results. (Done)

---

## Interests

### General

1. Implement scroll pagination for:

   * Received Interests
   * Sent Interests
2. If an interest request has been accepted, display a **Message** button.

### New Contacts Tab

Create a new tab:

**Contacts**

Requirements:

* Show all accepted connections.
* Display **Message** button for each connection.
* Support search functionality.
* Support scroll pagination.

### All Tabs

The following tabs should support:

* Search
* Scroll Pagination

Tabs:

* Received
* Sent
* Contacts

---

## Single Profile Page

**URL Example:** `profile/BON-241087`

1. Rename:

   * **Matrimonial Profile** → **Profile**
2. Profile completion percentage is incorrectly calculated. Review and fix the calculation logic.
3. Free account holders should not be able to view full profiles.

   * Display subscription upgrade prompt.
   * Show **Upgrade Plan** button.
4. All images should be loaded from Cloudflare.
5. Remove thumbnail strip from the main profile area and show only the primary profile image initially.
6. Create a dedicated photo gallery section:

   * Show all uploaded images as thumbnails.
   * Clicking a thumbnail should open a larger preview.
   * Use Fancybox or similar image viewer.

---

## Profile Viewers

1. Remove **Free** text and icon.
2. Implement scroll pagination.
3. Show actions based on relationship status:

   * No connection → Show **Interest** button.
   * Accepted connection → Show **Message** button.
4. When someone views a profile:

   * Send notification to the profile owner.
   * Send email notification to the profile owner.
   * Do not send notifications for free account holders.

---

## Shortlist

1. Shortlisted profile count is incorrect. Review and fix the count calculation.
2. If a shortlisted profile already has an accepted interest connection, show **Message** button.
3. Implement scroll pagination.

---

## Notifications

1. Implement scroll pagination.

---

## New Menu: Account Disable Request

Add a new sidebar menu:

### Account Disable Request

Fields:

**Request Type**

* Personal Reason
* Got Married Through This Platform

**Message**

* User entered message/reason

### Admin Actions

* Admin receives the request.
* Admin can disable/ban the account.
* Store and display the reason/message provided by the admin.

---

# Home Page

## Header

1. Display Site Name and Slogan.
2. Keep only the following menu items:

   * Home
   * Search Profile
   * Pricing
   * About Us
   * FAQ
   * Contact
3. Show **Login** and **Register** buttons only for guests (not logged in).
4. If user is logged in:

   * Show profile image
   * Show user name
   * Show clickable **Dashboard** link

---

## Footer

1. Display actual site logo and slogan.
2. Display all configured social media links.
3. Quick Links should load dynamically from Admin CMS.
4. Contact information should be dynamic and configurable from Admin.
5. Remove the bottom text section containing:

   * Terms
   * Privacy
   * Contact

# Home Page Content Update

## Section 1 - Hero Section

### Heading

```text
Premium Matrimony Platform
```

### Main Title

```text
Find Your Perfect Life Partner
```

### Description

```text
Connect with genuine and verified profiles through a secure matrimony platform designed to help individuals and families build meaningful relationships.
```

### Feature Highlights

```text
✓ Verified Profiles

✓ Smart Match Suggestions

✓ Privacy & Security
```

### Call to Action

```text
Start Your Journey Today
```

### Buttons

```text
[Create Free Profile]

[Browse Profiles]
```

---

## Section 2 - Profile Discovery Section

### Heading

```text
Explore Matrimony Profiles
```

### Sub Heading

```text
Looking for a Bride or Groom?
```

### Description

```text
Browse verified profiles based on age, religion, education, profession, and location to find compatible matches.
```

### Action Buttons

```text
[Browse Bride Profiles]

[Browse Groom Profiles]
```

### Notes

* Clicking **Browse Bride Profiles** should redirect users to the profile search/listing page with Bride profiles pre-selected.
* Clicking **Browse Groom Profiles** should redirect users to the profile search/listing page with Groom profiles pre-selected.
* Guests should be able to browse profile listings with limited profile visibility.
* Full profile details should require Login/Registration and an active subscription based on platform rules.

---

## Section 3 - Platform Features

Display the following feature cards/items:

```text
✓ Verified Member Profiles

✓ Secure & Private Platform

✓ Family-Friendly Matchmaking

✓ Smart Search & Filters

✓ Subscription-Based Premium Features

✓ Dedicated Customer Support
```

### Design Notes

* Maintain the current homepage design structure and spacing.
* Replace all existing statistics-based content with the above feature-based content.
* Do not display fake or hardcoded metrics such as:

  * 50,000+ Profiles
  * 10,000+ Matches Made
  * 98% Accuracy
  * Successful Marriages
* Future statistics should only be displayed when actual data is available from the platform.

## Section 4: Platform Benefits (Keep IT)

## Section 5: Newly Joined Members (Keep IT)

- Make it dynamic

## Section 6: Your Journey to a Perfect Match (Keep IT)

## Section 7: Your Safety is Our Priority (Keep it)

- Replace NID verified to Face Verified and content.

## Section 7: Membership Plans (Keep IT)

- Make dynamic

Remove 'Real Couples, Educated · Verified · From All 64 Districts, FAQ' section

## Section 7: Membership Plans (Keep IT)

## Section 8: Begin Your Journey Today (Keep IT)

- Remove '50,000+ Members'

# Implement Search prfile page same like exising search page. but user can not see profile details.

- Scroll pagiantion must.

# Implement Pricing page with dynamic content.
