const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteCloudinaryImages = async (urls) => {
  if (!urls) return;
  const list = Array.isArray(urls) ? urls : [urls];
  for (const url of list) {
    try {
      const parts = url.split('/');
      const filename = parts.pop();
      const publicId = filename.split('.')[0];
      const folder = parts.slice(parts.indexOf('upload') + 1, parts.length - 1).join('/');
      const fullId = folder ? `${folder}/${publicId}` : publicId;
      await cloudinary.uploader.destroy(fullId);
    } catch (err) {
      console.error('Cloudinary deletion failed:', err.message);
    }
  }
};

module.exports = { deleteCloudinaryImages };
