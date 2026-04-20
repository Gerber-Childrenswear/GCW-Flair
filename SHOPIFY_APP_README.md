# GCW Product Manager - Shopify App

Custom campaign management app for Gerber Childrenswear. Built with React, Express, and Shopify CLI.

## Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   cd flair-next && npm install && cd ..
   cd server && npm install && cd ..
   ```

2. **Set up environment**
   - Copy `.env.local` template and fill in your app secret
   - Use the Cloudflare tunnel URL already configured in `shopify.app.toml`

3. **Start development servers**
   ```bash
   # Terminal 1: Build & serve frontend
   cd flair-next && npm run dev
   
   # Terminal 2: Start backend server
   cd server && npm run dev
   ```

4. **Development URLs**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

### Building for Production

Build both frontend and backend:
```bash
cd flair-next && npm run build && cd ..
cd server && npm run build && cd ..
```

The Docker build process will:
1. Build the React frontend → `flair-next/dist`
2. Build the server → `server/dist`
3. Copy frontend to `public/` directory
4. Start server on port 3001

### Deploying to Shopify

The app is already configured with:
- **Client ID**: 59ca78536b42e9e9018379ed5ca299a3
- **App URL**: https://wells-labels-ace-mustang.trycloudflare.com (Cloudflare tunnel)
- **Embedded**: Yes (Shopify admin embedded)
- **Scopes**: `read_products`, `write_products`, `read_discounts`, `write_discounts`

To deploy:
```bash
shopify app deploy
```

## Features

- **Campaign Management**: Create and manage product badges and banners
- **A/B Testing**: Split test different designs and messaging
- **Advanced Scheduling**: Day-of-week and time-of-day targeting
- **Bulk Operations**: Duplicate, publish, pause, archive campaigns in bulk
- **Metrics & ROI**: Track performance and revenue impact
- **Workflows**: Automated campaign workflows based on triggers
- **Smart Recommendations**: Data-driven optimization suggestions
- **Rule Builder**: Complex product targeting with AND/OR logic

## Project Structure

```
├── flair-next/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── types/        # TypeScript types
│   │   ├── data/         # Mock data & API client
│   │   └── styles/       # CSS
│   └── dist/             # Production build output
├── server/               # Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Server entry
│   └── dist/             # Compiled JavaScript
├── shopify.app.toml      # Shopify app config
├── Dockerfile            # Docker build configuration
└── .env.local           # Environment variables
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SHOPIFY_API_KEY` | App client ID |
| `SHOPIFY_API_SECRET` | App secret (must be kept private) |
| `SHOPIFY_SCOPES` | OAuth scopes for API access |
| `SHOPIFY_APP_URL` | Public app URL (Cloudflare tunnel or deployed host) |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key for encrypting stored tokens |
| `STATIC_DIR` | Path to serve frontend static files |

## Development Notes

- **Frontend**: Vite 7 + React 19 + TypeScript
- **Backend**: Express + TypeScript
- **Deployment**: Docker, Railway compatible
- **Shopify Integration**: Embedded app with custom OAuth flow
- **Database**: Local JSON file (can be replaced with real DB)

## Building Docker Image

```bash
docker build -t gcw-product-manager .
docker run -p 3001:3001 gcw-product-manager
```

The app will serve:
- Frontend (React) at `/`
- API routes at `/api/*`
- Health checks at `/health`
