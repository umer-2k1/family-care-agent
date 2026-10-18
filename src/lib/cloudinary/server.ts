import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export async function uploadHealthRecord(file: File, familyId: string) {
  configureCloudinary();
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await cloudinary.uploader.upload(`data:${file.type};base64,${base64}`, { folder: `family-care/${familyId}/records`, resource_type: "auto", type: "authenticated" });
  return { publicId: result.public_id, secureUrl: result.secure_url, resourceType: result.resource_type };
}

export async function deleteHealthRecordAsset(publicId: string, resourceType: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: "authenticated", invalidate: true });
}
