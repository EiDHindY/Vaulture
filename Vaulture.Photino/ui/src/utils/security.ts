export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generateSecurePassword(options: PasswordOptions): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let pool = '';
  const requiredChars: string[] = [];

  if (options.uppercase) {
    pool += upper;
    requiredChars.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (options.lowercase) {
    pool += lower;
    requiredChars.push(lower[Math.floor(Math.random() * lower.length)]);
  }
  if (options.numbers) {
    pool += digits;
    requiredChars.push(digits[Math.floor(Math.random() * digits.length)]);
  }
  if (options.symbols) {
    pool += syms;
    requiredChars.push(syms[Math.floor(Math.random() * syms.length)]);
  }

  if (!pool) {
    pool = lower + digits;
  }

  const length = Math.max(options.length, requiredChars.length);
  const result: string[] = [...requiredChars];

  // Cryptographically secure random values
  const randomArray = new Uint32Array(length - result.length);
  window.crypto.getRandomValues(randomArray);

  for (let i = 0; i < randomArray.length; i++) {
    result.push(pool[randomArray[i] % pool.length]);
  }

  // Shuffle the result
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

export interface PasswordStrength {
  score: number; // 0 - 4
  label: string;
  color: string;
  bgColor: string;
  width: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'None', color: 'text-neutral-500', bgColor: 'bg-neutral-800', width: 'w-0' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (password.length >= 20) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 8) {
    return { score: 1, label: 'Too Short', color: 'text-red-400', bgColor: 'bg-red-500', width: 'w-1/5' };
  }

  if (score <= 2) {
    return { score: 1, label: 'Weak', color: 'text-orange-400', bgColor: 'bg-orange-500', width: 'w-2/5' };
  }
  if (score <= 3) {
    return { score: 2, label: 'Fair', color: 'text-amber-400', bgColor: 'bg-amber-500', width: 'w-3/5' };
  }
  if (score <= 4) {
    return { score: 3, label: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500', width: 'w-4/5' };
  }
  return { score: 4, label: 'Very Strong', color: 'text-emerald-400', bgColor: 'bg-emerald-500', width: 'w-full' };
}

export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(formattedUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[0].replace(/^www\./, '');
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
