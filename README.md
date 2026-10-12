This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# Resource Reservation Management System

A web-based Resource Reservation Management System developed for the PrimeWave Lab (Pvt) Ltd Software Engineering Internship Technical Assessment.

The application allows users to view available resources, create reservations, view saved bookings, prevent overlapping reservations, and cancel bookings.

## Features

- View resources retrieved from PostgreSQL.
- Create resource reservations.
- Validate user IDs and resource IDs.
- Validate start and end date/time.
- Prevent overlapping reservations for the same resource.
- View saved reservations with user and resource details.
- Cancel reservations.
- Display booking success and error messages.
- Store reservation data in PostgreSQL.

## Technology Stack

- Next.js
- React
- TypeScript
- PostgreSQL
- Node.js
- pg (node-postgres)
- Tailwind CSS

## Prerequisites

Install the following before running the application:

- Node.js (LTS version recommended)
- npm
- PostgreSQL
- pgAdmin 4 (optional, for database management)
- Git (optional, for cloning the repository)

## Installation

### 1. Clone the repository

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/primewave-assessment.git
cd primewave-assessment
```

Alternatively, download the repository and open the project folder in VS Code.

### 2. Install dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

Open pgAdmin 4 and create a database named:

```text
primewave_reservations
```

The application requires the following tables:

- `users`
- `resources`
- `reservations`

The tables must include the columns referenced by the application, including the required primary keys, foreign keys, resource details, user details, reservation start/end times, and any required reservation status fields.

Make sure the database contains at least one valid user and one resource before creating a reservation.

### 4. Configure environment variables

Create a `.env.local` file in the project root.

Add your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/primewave_reservations
```

Replace `YOUR_DB_USER` and `YOUR_DB_PASSWORD` with your local PostgreSQL credentials.

Do not commit `.env.local` or expose database passwords publicly.

If the project currently uses a different environment file, ensure the connection string is configured consistently with the project setup.

### 5. Run the development server

```bash
npm run dev
```

Open the application at:

http://localhost:3000

## Application Usage

1. Open the application in your browser.
2. View the available resources.
3. Select **Book This Resource**.
4. Enter an existing User ID.
5. Choose the start and end date/time.
6. Submit the booking.
7. View the saved reservation in the Reservations List.
8. Try booking the same resource for an overlapping time to test conflict prevention.
9. Select **Cancel Booking** to cancel a reservation.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resources` | Retrieve available resources |
| GET | `/api/reservations` | Retrieve reservations |
| POST | `/api/reservations` | Create a reservation |
| DELETE | `/api/reservations?id=RESERVATION_ID` | Cancel a reservation |

## Validation and Error Handling

The application validates required fields, positive integer IDs, date/time values, and the reservation time range.

It checks whether the user and resource exist before creating a reservation. Overlapping bookings for the same resource are rejected.

The API returns appropriate HTTP status codes for validation errors, missing records, booking conflicts, and server errors.

## Database Relationships

- One user can have multiple reservations.
- One resource can have multiple reservations at different times.
- Each reservation references one user and one resource.

The `reservations` table uses foreign keys to reference `users` and `resources`.

## Project Structure

```text
primewave-assessment/
├── app/
│   ├── api/
│   │   ├── resources/
│   │   │   └── route.ts
│   │   └── reservations/
│   │       └── route.ts
│   └── page.tsx
├── .env.local
├── package.json
└── README.md
```

This is a simplified overview. Other configuration and project files may also be present.

## Security Notes

- Keep database credentials in environment variables.
- Do not upload `.env.local` or passwords to GitHub.
- Validate all user input on the server.
- Use parameterized SQL queries.
- Restrict production database access appropriately.

## Author

Developed as part of the PrimeWave Lab (Pvt) Ltd Software Engineering Internship Technical Assessment.
