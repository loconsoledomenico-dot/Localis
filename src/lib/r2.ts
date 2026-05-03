import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  if (!accountId || !accessKey || !secretKey) {
    throw new Error('R2 credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY)');
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
  return _client;
}

function bucket(): string {
  return process.env.R2_BUCKET || 'localis-audio';
}

/**
 * Generate a signed URL for downloading an R2 object.
 */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(getClient(), cmd, { expiresIn: expiresInSeconds });
}

/**
 * Check whether an object exists in R2.
 */
export async function r2ObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === 'NotFound' || code === 'NoSuchKey') return false;
    throw err;
  }
}

/**
 * Upload bytes to R2.
 */
export async function uploadToR2(key: string, body: Uint8Array | Buffer | string, contentType: string): Promise<void> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getClient().send(cmd);
}
