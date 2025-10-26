# LAB Member Hub

A minimal, production-quality Member Hub for LAB with a familiar, low-friction UX. Built with Next.js (App Router) + TypeScript + Tailwind CSS.

## Features

- **Familiar Feel**: Simple pages, big buttons, clear copy, no "new tool" learning
- **Mobile-First**: Responsive design that works great on all devices
- **Email Integration**: Email capture with deduplication and local storage
- **Event Management**: Upcoming events with Zoom links, Eventbrite registration, and calendar integration
- **Coaching Booking**: Embedded Calendly integration for easy scheduling
- **Resource Library**: Videos (Vimeo), Podcasts (Libsyn), and Documents (Google Drive/Canva)
- **Survey Integration**: Embedded Google Forms for member feedback
- **Admin Panel**: Simple interface for managing content (development only)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Heroicons
- **Data**: JSON files (no database required for v1)
- **Deployment**: Ready for Vercel, Netlify, or any static hosting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual URLs:
```env
NEXT_PUBLIC_CALENDLY_URL="https://calendly.com/your-handle/30min"
NEXT_PUBLIC_GOOGLE_FORM_URL="https://docs.google.com/forms/d/e/FORM_ID/viewform"
NEXT_PUBLIC_STRIPE_CHECKOUT_URL="https://buy.stripe.com/test_XXXX"
NEXT_PUBLIC_SUBSTACK_URL="https://your-substack.substack.com"
NEXT_PUBLIC_SLACK_URL="https://yourworkspace.slack.com"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── events/            # Events page
│   ├── coaching/          # Coaching booking page
│   ├── resources/         # Resources page
│   ├── surveys/           # Surveys page
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── data.ts           # Data loading/saving
│   ├── time.ts           # Time formatting utilities
│   ├── ics.ts            # Calendar file generation
│   └── email.ts          # Email validation/storage
└── types/                # TypeScript type definitions

data/                     # JSON data files
├── announcements.json    # Site announcements
├── events.json          # Event listings
├── resources.json       # Resource library
└── emails.json         # Email subscriptions (localStorage in production)
```

## Pages & Routes

- **/** - Home page with quick actions, announcements, and email capture
- **/events** - Upcoming events with Zoom links, registration, and calendar integration
- **/coaching** - Embedded Calendly booking with FAQ
- **/resources** - Videos, podcasts, and documents organized by type
- **/surveys** - Embedded Google Forms for member feedback
- **/admin** - Content management interface (development only)
- **/api/ping** - Health check endpoint

## Data Management

### Adding Content

1. **Events**: Edit `data/events.json` with new events
2. **Announcements**: Edit `data/announcements.json` with new announcements  
3. **Resources**: Edit `data/resources.json` with new resources
4. **Admin Panel**: Use `/admin` page for in-browser editing (development only)

### Data Format

**Events** (`data/events.json`):
```json
{
  "id": "event-1",
  "title": "LAB Monthly Strategy Session",
  "startISO": "2024-02-15T18:00:00-06:00",
  "endISO": "2024-02-15T19:30:00-06:00",
  "zoomUrl": "https://zoom.us/j/123456789",
  "eventbriteUrl": "https://www.eventbrite.com/e/...",
  "description": "Join us for our monthly strategy deep-dive..."
}
```

**Announcements** (`data/announcements.json`):
```json
{
  "id": "announcement-1",
  "title": "Welcome to LAB Member Hub!",
  "body": "Everything you need is now in one place...",
  "link": "/resources",
  "dateISO": "2024-01-15T10:00:00Z"
}
```

**Resources** (`data/resources.json`):
```json
{
  "id": "resource-1",
  "kind": "video",
  "title": "Getting Started with LAB",
  "description": "Complete onboarding walkthrough...",
  "url": "https://vimeo.com/123456789",
  "provider": "Vimeo"
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CALENDLY_URL` | Calendly booking URL | `https://calendly.com/your-handle/30min` |
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | Google Form URL | `https://docs.google.com/forms/d/e/FORM_ID/viewform` |
| `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` | Stripe checkout URL | `https://buy.stripe.com/test_XXXX` |
| `NEXT_PUBLIC_SUBSTACK_URL` | Substack newsletter URL | `https://your-substack.substack.com` |
| `NEXT_PUBLIC_SLACK_URL` | Slack workspace URL | `https://yourworkspace.slack.com` |

## Features

### Email Capture
- Validates email format
- Prevents duplicates
- Stores in localStorage (demo) or can be connected to email service
- Shows success/error states

### Calendar Integration
- Generates valid .ics files for events
- Downloads automatically when "Add to Calendar" is clicked
- Includes event details, times, and Zoom links

### Time Display
- Shows both Central Time (CT) and Eastern Time (ET)
- Uses `Intl.DateTimeFormat` for proper timezone handling
- Automatically detects upcoming vs past events

### Responsive Design
- Mobile-first approach
- Large tap targets for touch devices
- Accessible navigation and interactions
- High contrast colors for readability

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `.next`

### Other Static Hosts
1. Run `npm run build`
2. Upload the `.next` directory to your hosting provider
3. Configure environment variables

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Pages**: Create in `src/app/[page-name]/page.tsx`
2. **New Components**: Add to `src/components/` and export from `index.ts`
3. **New Utilities**: Add to `src/lib/` directory
4. **New Types**: Add to `src/types/index.ts`

## Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- High contrast colors
- Screen reader friendly

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, contact the LAB team or create an issue in the repository.
