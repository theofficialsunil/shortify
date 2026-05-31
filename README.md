# Shortify

Shortify is a full-stack smart URL shortener and analytics platform built with Next.js, TypeScript, MongoDB, NextAuth, Tailwind CSS, and shadcn/ui.

It allows users to create short links, use custom username-based aliases, generate QR codes, manage links, track clicks, and view analytics from a dashboard.

## Live Demo

Deployment URL:

```txt
https://shortify-woad.vercel.app
```

## Features

### Authentication

- User signup and login
- Credentials-based authentication using NextAuth
- Protected dashboard routes
- Logout support
- Username onboarding after signup/login

### URL Shortening

Shortify supports two types of short links.

Random generated short links:

```txt
/s/[shortCode]
```

Example:

```txt
https://shortify-woad.vercel.app/s/a8xPq2z
```

User-scoped custom aliases:

```txt
/s/[username]/[customAlias]
```

Example:

```txt
https://shortify-woad.vercel.app/s/nagar_s/my-leetcode
```

This allows different users to use the same alias under different usernames.

Example:

```txt
/s/nagar_s/my-github
/s/rahul/my-github
```

### Link Management

Users can:

- Create short links
- Add custom aliases
- Add descriptions
- Set expiration duration
- Enable or disable links
- Delete links
- Copy short URLs
- Open short URLs
- Search links
- View all links from the dashboard

### QR Code Generation

After creating a short link, Shortify generates a QR code for the short URL.

Users can:

- Preview the QR code
- Download the QR code as a PNG file
- Scan the QR code to open the short link

### Click Tracking

Shortify tracks click analytics when someone opens a short link.

Currently tracked fields include:

- Link ID
- User ID
- Click timestamp
- Referrer
- Referrer domain
- Visitor ID
- Session ID
- Hashed IP
- Country
- Region
- City
- Device type
- Browser
- Operating system
- Language
- UTM source
- UTM medium
- UTM campaign
- Bot detection

Raw IP addresses are not stored. Only hashed IP values are saved.

### Analytics Dashboard

Each link has a detailed analytics page showing:

- Total clicks
- Unique visitors
- Sessions
- Human clicks
- Bot clicks
- Clicks over time
- Device breakdown
- Browser breakdown
- Operating system breakdown
- Country breakdown
- Referrer breakdown
- UTM source breakdown
- Recent click records

### Click Map MVP

The click map page shows geo analytics from click data.

It currently includes:

- Total geo-tracked clicks
- Known country clicks
- Top country
- Country breakdown
- Region breakdown
- City breakdown
- Recent locations

Note: City and region may show as `Unknown` depending on deployment provider headers. Country-level data may be available on Vercel. A future version can add IP geolocation for more accurate city, state, latitude, and longitude tracking.

### Settings Page

Users can:

- View email
- Update name
- Update username
- Preview custom link format

Custom links use the username in the URL:

```txt
/s/[username]/[customAlias]
```

Existing custom links keep their original username. New custom links use the updated username.

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- next-themes
- sonner
- qrcode

### Backend

- Next.js Route Handlers
- MongoDB Atlas
- Mongoose
- NextAuth
- bcryptjs
- Zod
- nanoid
- ua-parser-js

### Deployment

- Vercel
- MongoDB Atlas

## Project Structure

```txt
app/
  api/
    analytics/
      geo/
        route.ts
    auth/
      [...nextauth]/
        route.ts
      signup/
        route.ts
    links/
      [id]/
        analytics/
          route.ts
        route.ts
      route.ts
    user/
      me/
        route.ts
      profile/
        route.ts
      username/
        route.ts

  dashboard/
    analytics/
      [id]/
        page.tsx
      page.tsx
    create/
      page.tsx
    links/
      page.tsx
    map/
      page.tsx
    settings/
      page.tsx
    layout.tsx
    page.tsx

  login/
    page.tsx
  onboarding/
    username/
      page.tsx
  s/
    [...segments]/
      route.ts
  signup/
    page.tsx
  layout.tsx
  page.tsx

components/
  ui/

lib/
  auth.ts
  db.ts
  expiration.ts
  request.ts
  session.ts
  short-code.ts
  username.ts
  validation-error.ts

models/
  Click.ts
  Link.ts
  User.ts

types/
  global.d.ts
  next-auth.d.ts

validations/
  auth.ts
  link.ts
  user.ts

proxy.ts
```

## Environment Variables

Create a `.env.local` file in the project root.

```env
MONGODB_URI=your_mongodb_atlas_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

For production on Vercel:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/shortify.git
cd shortify
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Build

Run a production build:

```bash
npm run build
```

Start the production server locally:

```bash
npm run start
```

## MongoDB Setup

Use MongoDB Atlas and create a database named:

```txt
shortify
```

Collections are created automatically by Mongoose:

```txt
users
links
clicks
```

For Vercel deployment, allow network access from Vercel. For a demo project, you can allow:

```txt
0.0.0.0/0
```

## URL Behavior

### Random short link

Request without custom alias creates:

```txt
/s/[shortCode]
```

Example:

```txt
/s/a8xPq2z
```

### Custom alias short link

Request with custom alias creates:

```txt
/s/[username]/[customAlias]
```

Example:

```txt
/s/nagar_s/my-leetcode
```

### Redirect route

All short links are handled by:

```txt
app/s/[...segments]/route.ts
```

It supports:

```txt
/s/[shortCode]
/s/[username]/[customAlias]
```

## Analytics Notes

Some analytics depend on browser or platform behavior.

### Referrer

Apps such as WhatsApp, Telegram, SMS, and some email clients may not send a referrer header. In those cases, Shortify stores:

```txt
Direct
```

For better campaign tracking, use UTM parameters:

```txt
/s/nagar_s/my-link?utm_source=whatsapp&utm_medium=social&utm_campaign=test
```

### Geo Data

Country may be available from deployment provider headers. Region and city may remain `Unknown` unless an IP geolocation service is added.

A future improvement can add:

- IP geolocation API
- Latitude and longitude
- Google Maps markers
- Country/state/city-level click map

## Current MVP Limitations

- Google login is not implemented yet
- Password-protected redirect UI is not completed yet
- City/state geo tracking depends on provider headers and may be unknown
- Google Maps visual marker view is planned for a later version
- Rate limiting is not yet implemented
- Username history is not implemented

## Future Improvements

- Google OAuth login
- Password-protected short link landing page
- IP geolocation with latitude and longitude
- Google Maps click map
- UTM builder UI
- Rate limiting with Upstash Redis
- Custom domain support
- Link edit page
- Export analytics as CSV
- Better bot detection
- Username history and redirects
- Team/workspace support

