export type StrengthLevel = 'empty' | 'short' | 'weak' | 'good' | 'strong';

export interface PasswordStrength {
  /** 0 (chưa nhập) đến 4 (mạnh). Đăng ký chỉ chấp nhận từ 3 trở lên. */
  score: 0 | 1 | 2 | 3 | 4;
  level: StrengthLevel;
}

/** Điểm mạnh yếu của mật khẩu: dưới 6 ký tự là quá ngắn; cần cả chữ và số mới "tốt"; thêm ký tự đặc biệt và từ
 * 8 ký tự mới "mạnh". */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, level: 'empty' };
  if (password.length < 6) return { score: 1, level: 'short' };

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&.]/.test(password);

  if (hasLetter && hasNumber && hasSpecial && password.length >= 8) return { score: 4, level: 'strong' };
  if (hasLetter && hasNumber) return { score: 3, level: 'good' };
  return { score: 2, level: 'weak' };
}

/** Mức tối thiểu để được đăng ký hoặc đặt lại mật khẩu. */
export const MIN_ACCEPTED_SCORE = 3;
