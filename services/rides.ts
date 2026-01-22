import { API_BASE_URL } from "../config/api";

// =======================
// SEARCH RIDES
// =======================
export async function searchRides(params: {
  departure: string;
  destination: string;
  date?: Date;
  token: string;
}) {
  const { departure, destination, date, token } = params;

  let url =
    `${API_BASE_URL}/api/rides/search` +
    `?departure=${encodeURIComponent(departure)}` +
    `&destination=${encodeURIComponent(destination)}`;

  if (date) {
    const formattedDate = date
      .toLocaleDateString("en-GB") // dd/mm/yyyy
      .split("/")
      .join("-"); // dd-MM-yyyy

    url += `&departureDate=${formattedDate}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("SEARCH ERROR:", text);
    throw new Error("FAILED_TO_SEARCH_RIDES");
  }

  return response.json();
}

// =======================
// CREATE / OFFER A RIDE
// =======================
export async function createRide(token: string, ride: any) {
  const response = await fetch(`${API_BASE_URL}/api/rides/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ride),
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "FAILED_TO_CREATE_RIDE");
  }

  return response.json();
}

// =======================
// MY BOOKINGS (MY RIDES)
// =======================
export async function getMyBookings(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/rides/my/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("MY BOOKINGS ERROR:", text);
    throw new Error("FAILED_TO_LOAD_MY_RIDES");
  }

  return response.json();
}

// =======================
// CANCEL BOOKING
// =======================
export async function cancelBooking(token: string, bookingId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/rides/booking/${bookingId}/cancel`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("CANCEL BOOKING ERROR:", text);
    throw new Error(text || "FAILED_TO_CANCEL_BOOKING");
  }

  return response.text(); // "Booking cancelled"
}

// =======================
// MY OFFERED RIDES
// =======================
export async function getMyOfferedRides(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/rides/my/offered`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("MY OFFERED RIDES ERROR:", text);
    throw new Error("FAILED_TO_LOAD_OFFERED_RIDES");
  }

  return response.json();
}

// =======================
// DELETE OFFERED RIDE
// =======================
export async function deleteRide(token: string, rideId: number) {
  const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("DELETE RIDE ERROR:", text);
    throw new Error(text || "FAILED_TO_DELETE_RIDE");
  }

  return response.text(); // "Ride deleted"
}

// =======================
// GET RIDE DETAILS BY ID
// =======================
export async function getRideById(token: string, rideId: number) {
  const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("GET RIDE ERROR:", text);
    throw new Error(text || "FAILED_TO_LOAD_RIDE_DETAILS");
  }

  return response.json();
}

// =======================
// GET BOOKINGS FOR A RIDE (OWNER)
// =======================
export async function getBookingsForRide(token: string, rideId: number) {
  const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("GET RIDE BOOKINGS ERROR:", text);
    throw new Error(text || "FAILED_TO_LOAD_RIDE_BOOKINGS");
  }

  return response.json();
}
// =======================
// BOOK RIDE
// =======================
export async function bookRide(
  token: string,
  rideId: number,
  booking: {
    passengerName: string;
    phoneNumber: string;
    seatsBooked: number;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/rides/book/${rideId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(booking),
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("BOOK RIDE ERROR:", text);
    throw new Error(text || "FAILED_TO_BOOK_RIDE");
  }

  return response.json();
}
