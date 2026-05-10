# Meituan FitQuest

Meituan FitQuest is a mobile-first Next.js product prototype for university students. It uses gamified workout tasks, squad motivation, XP, energy points, badges, and Meituan-style local lifestyle rewards to make exercise feel rewarding and easy to demo.

## Stack

- Next.js
- React
- Tailwind CSS
- Mock data only
- `localStorage` for lightweight progress persistence

## Prototype scope

- No backend
- No real login
- No real Meituan API
- No payment flow
- No API keys or secrets required

## Local development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

If your local machine has a restricted home/cache directory, you can point build caches into the project folder:

```bash
mkdir -p .cache .home
HOME=$PWD/.home XDG_CACHE_HOME=$PWD/.cache npm run build
```

## Deployment on Vercel

This project is static/mock-data based and is ready to deploy on Vercel without any environment variables.

### Option 1: Deploy from GitHub

1. Push this project to a GitHub repository.
2. Go to [Vercel](https://vercel.com/).
3. Click `Add New...` -> `Project`.
4. Import the GitHub repository.
5. Keep the default framework preset as `Next.js`.
6. Leave environment variables empty.
7. Click `Deploy`.

Vercel should automatically use:

- Build command: `npm run build`
- Output: Next.js default output

### Option 2: Deploy with the Vercel CLI

1. Install the CLI:

```bash
npm i -g vercel
```

2. Log in:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

4. For a production deployment:

```bash
vercel --prod
```

## Notes

- All product data is mocked in [`components/fitquest-app.tsx`](./components/fitquest-app.tsx).
- User progress is stored locally in the browser with `localStorage`.
- The app is designed as a mobile-first prototype and can be shared easily once deployed.
