const { Upload } = require('@aws-sdk/lib-storage');
const { S3, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const generatePresignedUrl = async (fileKey) => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
  return getSignedUrl(s3, command, { expiresIn: 7 * 24 * 60 * 60 });
};

const uploadAndGetSignedUrl = async (file) => {
  const fileKey = `${uuidv4()}-${file.originalname}`;
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const s3Upload = new Upload({ client: s3, params: uploadParams });
  await s3Upload.done();
  const presignedUrl = await generatePresignedUrl(fileKey);
  return { fileKey, presignedUrl };
};

module.exports = { uploadAndGetSignedUrl, generatePresignedUrl };
