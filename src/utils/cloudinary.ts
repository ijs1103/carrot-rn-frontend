const CLOUDINARY_CLOUD_NAME = 'dux10tchh';
const CLOUDINARY_UPLOAD_PRESET = 'carrot_preset';

export async function uploadToCloudinary(uri: string): Promise<string> {
  const formData = new FormData();

  formData.append('file', {
    uri: uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any);

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = await response.json();

    if (result.secure_url) {
      return result.secure_url;
    } else {
      console.error('Cloudinary Upload Error:', result);
      throw new Error(result.error?.message || '이미지 업로드에 실패했습니다.');
    }
  } catch (error) {
    console.error('Upload catch error:', error);
    throw error;
  }
}
