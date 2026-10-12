# Resource Reservation Management System

A web-based Resource Reservation Management System developed for the PrimeWave Lab (Pvt) Ltd Software Engineering Internship Technical Assessment.

The system allows users to view resources, create reservations, view saved bookings, prevent overlapping bookings, and cancel reservations.

## Features

- View resources retrieved from PostgreSQL.
- Create resource reservations.
- Validate user IDs, resource IDs, and date/time inputs.
- Prevent overlapping reservations for the same resource.
- View saved reservations with user and resource details.
- Cancel existing reservations.
- Display booking success and error messages.
- Store reservation data in PostgreSQL.

## Technology Stack

- Next.js
- React
- TypeScript
- PostgreSQL
- Node.js
- `pg` (node-postgres)
- Tailwind CSS

## Prerequisites

Install the following:

- Node.js (LTS recommended)
- npm
- PostgreSQL
- pgAdmin 4 (optional)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dhanula9999/primewave-assessment.git
cd primewave-assessment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL

1. Open pgAdmin 4.
2. Create a database named `primewave_reservations`.
3. Ensure the database contains the `users`, `resources`, and `reservations` tables.
4. Ensure the tables have the required columns, primary keys, foreign keys, and constraints.
5. Add at least one valid user and one resource before testing bookings.

Use the database structure and constraints configured for this project.

### 4. Configure Environment Variables

Create a `.env.local` file in the project root and configure the database connection:

```env
DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/primewave_reservations
```

Replace `YOUR_DB_USER` and `YOUR_DB_PASSWORD` with your PostgreSQL credentials.

**Security:** Never commit `.env`, `.env.local`, database passwords, or other secrets to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Application Usage

1. View the available resources.
2. Select **Book This Resource**.
3. Enter an existing User ID.
4. Choose the start and end date/time.
5. Submit the booking.
6. View the saved booking in the Reservations List.
7. Try creating an overlapping booking to test conflict prevention.
8. Select **Cancel Booking** to cancel a reservation.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resources` | Retrieve resources |
| GET | `/api/reservations` | Retrieve saved reservations |
| POST | `/api/reservations` | Create a reservation |
| DELETE | `/api/reservations?id=RESERVATION_ID` | Cancel a reservation |

## Validation and Error Handling

The API validates required fields, positive integer IDs, valid dates, and the reservation time range.

It checks that the specified user and resource exist before creating a reservation. Overlapping reservations for the same resource are rejected.

The API returns appropriate HTTP status codes for validation errors, missing records, booking conflicts, and server errors.

## Database Relationships

- One user can have multiple reservations.
- One resource can have multiple reservations at different times.
- Each reservation belongs to one user and one resource.
- Foreign keys connect reservations to users and resources.

## ER Diagram

[View the Resource Reservation System ER Diagram](https://dbdiagram.io/d/6acd04bde308025ea5d15b59)

## Project Structure

```text
primewave-assessment/
├── app/
│   ├── api/
│   │   ├── resources/
│   │   │   └── route.ts
│   │   └── reservations/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Other Next.js configuration files may also be present.

## Security Notes

- Keep database credentials in environment variables.
- Never upload environment files containing secrets.
- Validate inputs on the server.
- Use parameterized SQL queries.
- Restrict production database access appropriately.

## Author

Developed for the PrimeWave Lab (Pvt) Ltd Software Engineering Internship Technical Assessment.
