export interface ImageMeta {
  id: string;
  filename: string;
  url: string;
  size: number;
  content_type: string;
  uploaded_at: string;
  reference_role: string;
  notes: string;
  is_primary: boolean;
}

export interface MetadataPayload {
  reference_role?: string;
  notes?: string;
  is_primary?: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function uploadImages(files: File[]): Promise<ImageMeta[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const data = await request<{ images: ImageMeta[] }>("/api/uploads/images", {
    method: "POST",
    body: form,
  });
  return data.images;
}

export async function getUploadedImages(): Promise<ImageMeta[]> {
  const data = await request<{ images: ImageMeta[] }>("/api/uploads/images");
  return data.images;
}

export async function updateImageMetadata(
  id: string,
  payload: MetadataPayload
): Promise<ImageMeta> {
  const data = await request<{ image: ImageMeta }>(
    `/api/uploads/images/${id}/metadata`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.image;
}

export async function deleteImage(id: string): Promise<void> {
  await request(`/api/uploads/images/${id}`, { method: "DELETE" });
}
