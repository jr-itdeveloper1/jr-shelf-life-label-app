async function parseApiError(response: Response, path: string) {
  let message = `API request failed: ${response.status} ${path}`;
  try {
    const payload = await response.json();
    message = payload.message ?? payload.error ?? message;
  } catch {
    // Keep the generic HTTP message when the API does not return JSON.
  }
  return new Error(Array.isArray(message) ? message.join(', ') : message);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, path);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw await parseApiError(response, path);
  }

  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, path);
  }

  return response.json() as Promise<T>;
}
