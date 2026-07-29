import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

export const useLogin = () => {
  return useMutation({
    mutationFn: authApi.login,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: authApi.verifyOtp,
  });
};
