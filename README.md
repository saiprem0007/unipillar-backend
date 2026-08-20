# UNIPILLAR Backend

The NestJS API for UNIPILLAR, a college admission prediction and counselling platform for JEE aspirants. It supplies authentication, student profiles, college/branch prediction, preference-list generation, fees, seat records, payments, and PDF recommendations.

## Tech stack

- NestJS 11 with TypeScript
- Prisma ORM with PostgreSQL
- JWT, Passport, bcrypt
- Razorpay payments
- Nodemailer plus optional Twilio/Fast2SMS OTP delivery
- PDFKit for recommendation PDFs
- Python with pandas and NumPy for ranking and prediction processing
- Jest, ESLint, and Prettier

## Features

- Email/mobile authentication, signup OTP verification, login, and password reset
- User profiles with JEE ranks, category, state, gender, and premium status
- JoSAA and CSAB allocation records
- College-fee and seat-record lookup APIs
- College/branch prediction from cutoff data
- Personalized preference-list generation, recommendation history, and PDF download
- Razorpay order creation, verification, and webhook handling
- Request throttling and CORS controls

## Project structure

```text
src/
├── auth/          # Authentication, OTP, JWT guard, SMS/email support
├── fees/          # College fee APIs
├── payments/      # Razorpay orders, verification, webhooks
├── predictor/     # Cutoff-based prediction API
├── preferences/   # Personalized rankings and PDF generation
├── prisma/        # Prisma module and service
├── seat-records/  # Seat record API
├── user/          # User profile, JoSAA, and CSAB APIs
└── scripts/       # Data import utilities
prisma/
├── migrations/    # Database migrations
├── schema.prisma  # PostgreSQL schema
└── seed.ts        # Seed script
python/            # Ranking and JoSAA prediction scripts
data/              # Cutoff and fee datasets
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- Python 3 with pip (for the Python ranking scripts)

## Installation

```bash
npm install
```

Create a `.env` file with the variables used by the application:

```env
DATABASE_URL=
PORT=3001
EMAIL_USER=
EMAIL_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
FAST2SMS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Configure only the messaging providers you intend to use. Do not commit this file or any real credentials.

## Database

Prisma is configured for PostgreSQL in `prisma/schema.prisma`.

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The repository includes migrations, a TypeScript seed script, CSV datasets, and `src/scripts/import-cutoffs.ts` for cutoff-data imports. Ensure `DATABASE_URL` points to the intended database before running these commands.

## Python prediction components

The preference service runs `python/main.py` as a child process, passing the student profile, weights, branch choices, and dataset as JSON. The script uses pandas and NumPy to return personalized ranked recommendations.

```bash
cd python
python -m pip install -r requirements.txt
```

The `python/josaa_predictor.py` module provides JoSAA-oriented cutoff and admission-probability processing.

## Run the API

```bash
# watch mode
npm run start:dev

# production build and run
npm run build
npm run start:prod
```

The default API address is `http://localhost:3001`.

## Main API routes

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/auth/send-signup-otp` | Send signup OTP | No |
| POST | `/auth/verify-signup-otp` | Confirm signup OTP | No |
| POST | `/auth/signup` | Create an account directly | No |
| POST | `/auth/login` | Log in and receive a token | No |
| POST | `/auth/forgot-password` | Send password-reset OTP | No |
| POST | `/auth/verify-reset-otp` | Verify reset OTP | No |
| POST | `/auth/reset-password` | Change password after OTP verification | No |
| POST | `/predictor/analyze` | Analyze college/branch prediction input | No |
| POST | `/preferences/generate` | Generate a personalized preference list | No |
| POST | `/preferences/download-pdf` | Generate and download recommendation PDF | No |
| GET / PUT | `/user/profile` | Read or update the current user profile | Bearer token |
| GET / POST | `/user/josaa` | Read or add JoSAA allocation records | Bearer token |
| GET / POST | `/user/csab` | Read or add CSAB allocation records | Bearer token |
| GET | `/seat-records` | Query seat records | No |
| GET | `/fees` | List fee records | No |
| GET | `/fees/colleges` | List college names with fee data | No |
| GET | `/fees/college?college=...` | Retrieve fee data for a college | No |
| POST | `/payments/create-order` | Create a Razorpay order | Bearer token |
| POST | `/payments/verify` | Verify a Razorpay payment | Bearer token |
| POST | `/payments/webhook` | Process Razorpay webhook events | No |

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Build the API |
| `npm run start:prod` | Run the built API |
| `npm run lint` | Run ESLint with autofix |
| `npm run format` | Format source and test files |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

## CORS and deployment

The server permits local development origins, private-network development hosts, `unipillar.in`, and its configured server IP. Add any new frontend deployment origin in `src/main.ts` before deploying. Deployment infrastructure is not otherwise defined in this repository.

## Related repository

Frontend application: [unipillar09](https://github.com/saiprem0007/unipillar09)
