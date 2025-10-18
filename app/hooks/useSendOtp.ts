// hooks/useSendOtp.ts
import { useMutation } from '@tanstack/react-query';
import { sendOtp } from '../api/user';

export const useSendOtp = () => {
    return useMutation({ mutationFn: sendOtp });
};
