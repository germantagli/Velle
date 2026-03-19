import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly client: S3Client | null = null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly configured: boolean;

  constructor(private config: ConfigService) {
    const accessKey = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.config.get<string>('AWS_REGION', 'us-east-1');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', '');

    this.configured = !!(accessKey && secretKey && this.bucket);

    if (this.configured) {
      this.client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: accessKey!,
          secretAccessKey: secretKey!,
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async upload(key: string, buffer: Buffer, contentType = 'image/jpeg'): Promise<string> {
    if (!this.client) throw new Error('S3 no configurado');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.client) throw new Error('S3 no configurado');

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {expiresIn});
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
