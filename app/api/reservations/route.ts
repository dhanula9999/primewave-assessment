
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Convert datetime-local input to a timestamp string
// without converting it to UTC.
function parseLocalDateTime(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Reject invalid calendar dates that JavaScript might normalize.
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = "0"] = timePart.split(":");
  const seconds = Number(second.split(".")[0]);

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute) ||
    date.getSeconds() !== seconds
  ) {
    return null;
  }

  // PostgreSQL timestamp without time zone accepts this format.
  return value.replace("T", " ");
}

// GET: Retrieve all reservations
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.user_id,
        u.name AS user_name,
        r.resource_id,
        res.name AS resource_name,
        res.location,
        r.start_time,
        r.end_time
      FROM reservations r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN resources res ON r.resource_id = res.id
      ORDER BY r.start_time DESC
    `);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Fetch reservations error:", error);

    return NextResponse.json(
      { error: "Failed to fetch reservations." },
      { status: 500 }
    );
  }
}

// POST: Create a reservation
export async function POST(request: Request) {
  let client;

  try {
    const body = await request.json();
    const { user_id, resource_id, start_time, end_time } = body;

    if (
      user_id == null ||
      resource_id == null ||
      !Number.isInteger(Number(user_id)) ||
      !Number.isInteger(Number(resource_id)) ||
      Number(user_id) <= 0 ||
      Number(resource_id) <= 0 ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide valid user, resource, start time and end time.",
        },
        { status: 400 }
      );
    }

    const startValue = parseLocalDateTime(start_time);
    const endValue = parseLocalDateTime(end_time);

    if (!startValue || !endValue) {
      return NextResponse.json(
        { error: "Invalid start or end date/time." },
        { status: 400 }
      );
    }

    // Compare the original datetime-local values.
    if (endValue <= startValue) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    const userResult = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [Number(user_id)]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found. Please enter an existing user ID." },
        { status: 404 }
      );
    }

    const resourceResult = await pool.query(
      "SELECT id FROM resources WHERE id = $1",
      [Number(resource_id)]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Lock this resource while checking and creating the booking.
      await client.query(
        "SELECT id FROM resources WHERE id = $1 FOR UPDATE",
        [Number(resource_id)]
      );

      const conflict = await client.query(
        `SELECT id
         FROM reservations
         WHERE resource_id = $1
           AND start_time < $2::timestamp
           AND end_time > $3::timestamp
         LIMIT 1`,
        [Number(resource_id), endValue, startValue]
      );

      if (conflict.rows.length > 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            error:
              "This resource is already booked for the selected time. Please choose another time.",
          },
          { status: 409 }
        );
      }

      const result = await client.query(
        `INSERT INTO reservations
         (user_id, resource_id, start_time, end_time)
         VALUES ($1, $2, $3::timestamp, $4::timestamp)
         RETURNING *`,
        [Number(user_id), Number(resource_id), startValue, endValue]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          message: "Reservation created successfully.",
          reservation: result.rows[0],
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      client = undefined;
    }
  } catch (error) {
    if (client) {
      client.release();
    }

    console.error("Reservation error:", error);

    return NextResponse.json(
      {
        error: "Failed to create reservation. Please try again.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Cancel a reservation by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idValue = searchParams.get("id");

    if (!idValue || !/^[1-9]\d*$/.test(idValue)) {
      return NextResponse.json(
        { error: "Please provide a valid reservation ID." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM reservations
       WHERE id = $1
       RETURNING id`,
      [Number(idValue)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Reservation cancelled successfully.",
        reservationId: result.rows[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel reservation error:", error);

    return NextResponse.json(
      { error: "Failed to cancel reservation. Please try again." },
      { status: 500 }
    );
  }
}
