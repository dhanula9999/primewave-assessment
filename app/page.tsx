
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Resource = {
  id: number;
  name: string;
  description: string;
  location: string;
  capacity: number;
};

type Reservation = {
  id: number;
  user_id: number;
  user_name: string;
  resource_id: number;
  resource_name: string;
  location: string;
  start_time: string;
  end_time: string;
};

type BookingForm = {
  resourceId: number;
  resourceName: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState("");

  const [selectedResource, setSelectedResource] =
    useState<BookingForm | null>(null);

  const [userId, setUserId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationSuccess, setCancellationSuccess] = useState("");

  // Load reservations from the database
  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true);
    setReservationsError("");

    try {
      const response = await fetch("/api/reservations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load reservations.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid reservations response.");
      }

      setReservations(data as Reservation[]);
    } catch (err) {
      setReservationsError(
        err instanceof Error ? err.message : "Could not load reservations."
      );
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  // Load resources and reservations when the page opens
  useEffect(() => {
    async function fetchResources() {
      try {
        const response = await fetch("/api/resources", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load resources.");
        }

        const data: Resource[] = await response.json();
        setResources(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load resources. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchResources();
    void fetchReservations();
  }, [fetchReservations]);

  // Create a new reservation
  async function handleBookingSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedResource) return;

    setBookingError("");
    setBookingSuccess("");

    if (!userId.trim() || !startTime || !endTime) {
      setBookingError("Please fill in all fields.");
      return;
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setBookingError("Please enter a valid user ID.");
      return;
    }

    if (
      !Number.isFinite(new Date(startTime).getTime()) ||
      !Number.isFinite(new Date(endTime).getTime())
    ) {
      setBookingError("Please enter valid booking dates and times.");
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setBookingError("End time must be after start time.");
      return;
    }

    setBookingLoading(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parsedUserId,
          resource_id: selectedResource.resourceId,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reservation.");
      }

      setBookingSuccess(
        `Reservation created successfully for ${selectedResource.resourceName}!`
      );

      setUserId("");
      setStartTime("");
      setEndTime("");

      await fetchReservations();
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  // Cancel a reservation
  async function handleCancelReservation(reservation: Reservation) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Reservation #${reservation.id} for ${reservation.resource_name}? This will permanently delete the booking.`
    );

    if (!confirmed) return;

    setCancellingId(reservation.id);
    setCancellationError("");
    setCancellationSuccess("");

    try {
      const response = await fetch(
        `/api/reservations?id=${reservation.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }

      setCancellationSuccess(
        `Reservation #${reservation.id} was cancelled successfully.`
      );

      await fetchReservations();
    } catch (err) {
      setCancellationError(
        err instanceof Error
          ? err.message
          : "Could not cancel reservation. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  }

  function closeBookingForm() {
    if (bookingLoading) return;

    setSelectedResource(null);
    setBookingError("");
    setBookingSuccess("");
    setUserId("");
    setStartTime("");
    setEndTime("");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-cyan-400">
            PrimeWave Lab
          </h1>
          <span className="text-sm text-slate-300">
            Reservation System
          </span>
        </div>
      </nav>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Smart Resource Booking
        </p>

        <h2 className="mb-4 text-4xl font-bold md:text-5xl">
          Find Your Perfect Space
        </h2>

        <p className="mb-10 max-w-2xl text-slate-400">
          Explore available resources and find the right space
          for your next meeting or event.
        </p>

        {/* Available Resources */}
        <div className="mb-16">
          <h3 className="mb-6 text-2xl font-semibold">
            Available Resources
          </h3>

          {loading && (
            <p className="text-slate-400">Loading resources...</p>
          )}

          {error && (
            <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && resources.length === 0 && (
            <p className="text-slate-400">
              No resources are available yet.
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <article
                key={resource.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 text-2xl">
                  🏢
                </div>

                <h4 className="mb-2 text-xl font-semibold">
                  {resource.name}
                </h4>

                <p className="mb-5 text-sm text-slate-400">
                  {resource.description}
                </p>

                <div className="space-y-2 text-sm text-slate-300">
                  <p>📍 {resource.location}</p>
                  <p>👥 Capacity: {resource.capacity} people</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedResource({
                      resourceId: resource.id,
                      resourceName: resource.name,
                    });
                    setBookingError("");
                    setBookingSuccess("");
                    setUserId("");
                    setStartTime("");
                    setEndTime("");
                  }}
                  className="mt-6 w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-600"
                >
                  Book This Resource
                </button>
              </article>
            ))}
          </div>
        </div>

        {/* Reservations List */}
        <section
          id="reservations"
          className="border-t border-slate-800 pt-10"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
                Booking Records
              </p>
              <h3 className="text-2xl font-semibold">
                Reservations List
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                View and manage reservations saved in the database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCancellationError("");
                setCancellationSuccess("");
                void fetchReservations();
              }}
              disabled={reservationsLoading || cancellingId !== null}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reservationsLoading ? "Refreshing..." : "↻ Refresh Bookings"}
            </button>
          </div>

          {cancellationSuccess && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-300"
            >
              {cancellationSuccess}
            </div>
          )}

          {cancellationError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
            >
              {cancellationError}
            </div>
          )}

          {!reservationsLoading &&
            !reservationsError &&
            reservations.length > 0 && (
              <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">
                  Total reservations
                </p>
                <p className="mt-1 text-3xl font-bold text-cyan-400">
                  {reservations.length}
                </p>
              </div>
            )}

          {reservationsLoading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Loading reservations...
            </div>
          )}

          {reservationsError && (
            <div
              role="alert"
              className="rounded-xl border border-red-800 bg-red-950/40 p-5"
            >
              <p className="font-semibold text-red-300">
                Could not load reservations
              </p>
              <p className="mt-2 text-sm text-red-200">
                {reservationsError}
              </p>
              <button
                type="button"
                onClick={() => void fetchReservations()}
                className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!reservationsLoading &&
            !reservationsError &&
            reservations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
                <div className="mb-3 text-4xl">📅</div>
                <h4 className="text-lg font-semibold">
                  No Reservations Yet
                </h4>
                <p className="mt-2 text-sm text-slate-400">
                  Reservations will appear here after a booking is successfully created.
                </p>
              </div>
            )}

          {!reservationsLoading &&
            !reservationsError &&
            reservations.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {reservations.map((reservation) => (
                  <article
                    key={reservation.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-700"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950 text-xl">
                        📅
                      </div>

                      <span className="rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Saved
                      </span>
                    </div>

                    <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                      Reservation #{reservation.id}
                    </p>

                    <h4 className="mb-4 text-xl font-semibold text-white">
                      {reservation.resource_name}
                    </h4>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-slate-500">Booked by</p>
                        <p className="mt-1 text-slate-200">
                          {reservation.user_name ||
                            `User #${reservation.user_id}`}
                          <span className="ml-2 text-slate-500">
                            (ID: {reservation.user_id})
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Resource location
                        </p>
                        <p className="mt-1 text-slate-200">
                          📍 {reservation.location}
                        </p>
                      </div>

                      <div className="border-t border-slate-800 pt-3">
                        <p className="text-slate-500">
                          Start Date & Time
                        </p>
                        <p className="mt-1 text-slate-200">
                          {formatDateTime(reservation.start_time)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          End Date & Time
                        </p>
                        <p className="mt-1 text-slate-200">
                          {formatDateTime(reservation.end_time)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCancelReservation(reservation)}
                      disabled={cancellingId !== null || reservationsLoading}
                      className="mt-5 w-full rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === reservation.id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </button>
                  </article>
                ))}
              </div>
            )}
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        © 2026 PrimeWave Lab (Pvt) Ltd
      </footer>

      {/* Booking Modal */}
      {selectedResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeBookingForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
                  Resource Reservation
                </p>
                <h3 id="booking-title" className="text-2xl font-bold">
                  Book Your Space
                </h3>
                <p className="mt-2 text-slate-400">
                  {selectedResource.resourceName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBookingForm}
                disabled={bookingLoading}
                aria-label="Close booking form"
                className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {bookingSuccess ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-5"
              >
                <p className="text-lg font-semibold text-emerald-400">
                  ✓ Booking Successful
                </p>
                <p className="mt-3 text-sm text-slate-200">
                  {bookingSuccess}
                </p>
                <button
                  type="button"
                  onClick={closeBookingForm}
                  className="mt-5 w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold hover:bg-cyan-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="userId"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    User ID
                  </label>
                  <input
                    id="userId"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Enter your existing user ID"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Enter a user ID that exists in your database.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Start Date & Time
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    End Date & Time
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    required
                    min={startTime || undefined}
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                {bookingError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300"
                  >
                    {bookingError}
                  </p>
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeBookingForm}
                    disabled={bookingLoading}
                    className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bookingLoading ? "Submitting..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
