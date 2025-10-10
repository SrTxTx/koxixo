export type SignedUrl = { url: string; fields?: Record<string, string> }

// Placeholder interface for S3-compatible providers (S3/R2/MinIO)
export async function getSignedUploadUrl(key: string, contentType: string): Promise<SignedUrl> {
  // Implementar com SDK do provedor (ex.: @aws-sdk/s3-presigned-post ou R2)
  // Aqui retornamos um mock para desenvolvimento local
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3001'
  return { url: `${base}/api/attachments/mock-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}` }
}
