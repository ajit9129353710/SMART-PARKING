const API_BASE_URL = "${import.meta.env.VITE_API_URL}/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("parksmart_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Backend se connection nahi ho raha. Check karo ki server port 5000 par chal raha hai."
    );
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}