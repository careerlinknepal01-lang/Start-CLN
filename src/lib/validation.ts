export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
};

export const validateChallengeSubmission = (url: string, description?: string) => {
  const errors: string[] = [];
  
  if (!url || !isValidUrl(url)) {
    errors.push('A valid submission URL is required.');
  }
  
  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters.');
  }
  
  return errors;
};
