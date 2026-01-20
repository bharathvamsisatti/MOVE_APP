import { API_BASE_URL } from "../config/api";

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

