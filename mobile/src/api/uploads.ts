import { apiClient } from "./client";

export async function uploadImages(
    uris: string[]
): Promise<string[]> {
    const formData = new FormData();

    uris.forEach((uri) => {
        const filename =
            uri.split("/").pop() ??
            `image-${Date.now()}.jpg`;

        const extension =
            filename.split(".").pop()?.toLowerCase();

        const mimeType =
            extension === "png"
                ? "image/png"
                : "image/jpeg";

        formData.append("images", {
            uri,
            name: filename,
            type: mimeType,
        } as any);
    });

    const { data } = await apiClient.post(
        "/uploads/images",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return data.urls;
}
