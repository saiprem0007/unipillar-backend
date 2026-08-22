# UniPillar — Backend

The NestJS backend for **UniPillar**, a college admission prediction and counselling platform for JEE aspirants. It provides authentication, student profiles, college/branch prediction, personalized preference-list generation, fee and seat-record APIs, payments, and recommendation PDFs.

**Live platform:** https://unipillar.in/

**Frontend:** https://github.com/saiprem0007/unipillar09

## Overview

The backend connects the student-facing application to PostgreSQL-backed application data and Python-based prediction/recommendation processing. It exposes REST APIs for the major counselling workflows and integrates authentication, OTP delivery, payments, and recommendation generation.

## Architecture

```text
Next.js Frontend
       │
       │ REST / JSON
       ▼
NestJS API
       │
       ├── Authentication / OTP / JWT
       ├── User Profiles
       ├── Prediction
       ├── Preference Generation
       ├── Seat & Fee APIs
       ├── Payments / Webhooks
       └── Recommendation PDFs
       │
       ├──────────────► PostgreSQL via Prisma
       │
       └──────────────► Python prediction / ranking services
                              │
                              └── Pandas / NumPy / JoSAA data
```

## Key Engineering Work

- Designed REST API modules around authentication, users, prediction, preferences, seats, fees, and payments.
- Implemented JWT-based authentication with Passport and bcrypt-backed password handling.
- Built signup and password-reset OTP workflows with email/SMS provider integrations.
- Used Prisma ORM with PostgreSQL for structured relational data and migrations.
- Integrated Python processing into the backend for cutoff-based prediction and personalized recommendation ranking.
- Implemented preference-list generation and recommendation-history persistence.
- Generated downloadable recommendation PDFs with PDFKit.
- Integrated Razorpay order creation, payment verification, and webhook handling.
- Added request throttling and CORS controls for the API.

## Project Scale

The system processes and stores substantial counselling data, including:

- **77,703** historical JoSAA cutoff records
- **68** academic branches
- **11,377** institute/predicted-cutoff records
- **1,797** recommendation lists generated
- Approx. **5 seconds** for prediction responses
- Approx. **10 seconds** for preference-list generation
- Reported usage of **70+ users**

These figures describe the current project data and observed application usage; they are not benchmark guarantees.

## Features

### Authentication & Security

- Email/mobile authentication
- Signup OTP verification
- Login and JWT authorization
- Password reset through OTP
- bcrypt password hashing
- Request throttling
- CORS controls

### Counselling & Prediction

- Student profile management
- JEE rank, category, state, gender, and branch preferences
- JoSAA and CSAB allocation records
- College-fee and seat-record lookup
- College/branch prediction from cutoff data
- Personalized preference-list generation
- Recommendation history
- PDF recommendation downloads

### Payments

- Razorpay order creation
- Payment verification
- Razorpay webhook handling

## Tech Stack

### Backend

- NestJS 11
- TypeScript
- Node.js
- REST APIs

### Database

- PostgreSQL
- Prisma ORM

### Authentication & Security

- JWT
- Passport
- bcrypt
- OTP workflows

### Data Processing

- Python
- Pandas
- NumPy

### Integrations

- Razorpay
- Nodemailer
- Optional Twilio / Fast2SMS OTP delivery
- PDFKit

### Development

- Jest
- ESLint
- Prettier

## Project Structure

```text
src/
├── auth/          # Authentication, OTP, JWT guard, messaging support
├── fees/          # College fee APIs
├── payments/      # Razorpay orders, verification, and webhooks
├── predictor/     # Cutoff-based prediction API
├── preferences/   # Personalized ranking and PDF generation
├── prisma/        # Prisma module and service
├── seat-records/  # Seat record APIs
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
- Python 3 with pip

## Installation

```bash
npm install
```

Create a local `.env` file with the variables required by the application:

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

Only configure the providers you intend to use.

**Never commit real environment files, API keys, passwords, database credentials, JWT secrets, payment secrets, or other private credentials.**

## Database Setup

Prisma is configured for PostgreSQL in `prisma/schema.prisma`.

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The repository contains database migrations, a seed script, CSV datasets, and a cutoff-data import utility.

## Python Components

The preference service runs `python/main.py` as a child process. It passes student profile information, recommendation weights, branch choices, and dataset information to the Python processing layer.

Install the Python dependencies with:

```bash
cd python
python -m pip install -r requirements.txt
```

The Python layer uses Pandas and NumPy for data processing and personalized ranking. `python/josaa_predictor.py` provides JoSAA-oriented cutoff and admission-probability processing.

## Run the API

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The default local API address is `http://localhost:3001`.

## Main API Routes

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/auth/send-signup-otp` | Send signup OTP | No |
| POST | `/auth/verify-signup-otp` | Confirm signup OTP | No |
| POST | `/auth/signup` | Create an account | No |
| POST | `/auth/login` | Log in and receive a token | No |
| POST | `/auth/forgot-password` | Send password-reset OTP | No |
| POST | `/auth/verify-reset-otp` | Verify reset OTP | No |
| POST | `/auth/reset-password` | Change password after OTP verification | No |
| POST | `/predictor/analyze` | Analyze college/branch prediction input | No |
| POST | `/preferences/generate` | Generate a personalized preference list | No |
| POST | `/preferences/download-pdf` | Generate recommendation PDF | No |
| GET / PUT | `/user/profile` | Read or update the current profile | Bearer token |
| GET / POST | `/user/josaa` | Read or add JoSAA allocation records | Bearer token |
| GET / POST | `/user/csab` | Read or add CSAB allocation records | Bearer token |
| GET | `/seat-records` | Query seat records | No |
| GET | `/fees` | List fee records | No |
| GET | `/fees/colleges` | List colleges with fee data | No |
| GET | `/fees/college?college=...` | Retrieve fee data for a college | No |
| POST | `/payments/create-order` | Create a Razorpay order | Bearer token |
| POST | `/payments/verify` | Verify a Razorpay payment | Bearer token |
| POST | `/payments/webhook` | Process Razorpay webhook events | No |

## Development Commands

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

## Deployment

The backend has been used with a deployed API configuration. Production deployment requires PostgreSQL connectivity, the required environment variables, configured CORS origins, and the appropriate external service credentials.

## Security Notes

- Keep all secrets in environment variables.
- Rotate any credential immediately if it is ever exposed in source control.
- Do not reuse production credentials for local development.
- Review payment webhook and authentication configuration before deploying changes.

## Related Repository

**Frontend application:** https://github.com/saiprem0007/unipillar09

## Author

**Lunavath Sai Prem**  
B.Tech, Engineering Physics — IIT Patna
