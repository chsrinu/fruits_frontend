import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert, TouchableWithoutFeedback,
    Keyboard, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    verifyOtp, resendOtp,
} from '../api/user';
import {useAuthStore} from "@/app/stores/authStore";

export default function OtpScreen() {
    const { mobile } = useLocalSearchParams();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const setToken = useAuthStore((s) => s.setToken);
    const isDisabled = !otp || !firstName || !lastName || !email;

    const router = useRouter();

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);


    const handleResendOtp = async () => {
        try {
            setTimer(60); // restart the timer
            await resendOtp(mobile as string);
            Alert.alert("OTP Sent", "A new OTP has been sent to your mobile number.");
        } catch (error) {
            Alert.alert("Error", "Failed to resend OTP");
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                mobileNumber: mobile,
                firstName,
                lastName,
                email,
                otp,
                userRole: 'USER',
            };

            const resp = await verifyOtp(payload);
            const token = resp.data?.token;            // Alert.alert("Success", "User verified successfully");
            // Navigate to next screen if needed
            setToken(token, mobile as string)
            router.replace('/home'); // ✅ Navigate now

        } catch (error:any) {
            const message = error.response?.data?.error || 'Failed to verify OTP';
            Alert.alert('Error', message);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <View className="flex-1 p-10">
                    <Text className="text-2xl font-bold text-center mb-4">OTP Verification</Text>
                    <Text className="text-center text-gray-600 mb-6">Verifying for: {mobile}</Text>

                    <TextInput
                        className="border p-3 rounded mb-3"
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                    <TextInput
                        className="border p-3 rounded mb-3"
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                    <TextInput
                        className="border p-3 rounded mb-3"
                        placeholder="Email"
                        value={email}
                        keyboardType="email-address"
                        onChangeText={setEmail}
                    />

                    <TextInput
                        className="border p-3 rounded mb-3"
                        placeholder="Enter OTP"
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                        maxLength={6}
                    />

                    {timer > 0 ? (
                        <Text className="text-center text-gray-500 mb-4">Resend OTP in {timer}s</Text>
                    ) : (
                        <TouchableOpacity onPress={handleResendOtp} className="mb-4">
                            <Text className="text-center text-blue-600">Resend OTP</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!otp || !firstName || !lastName || !email}
                        className={`p-3 rounded ${isDisabled ? 'bg-gray-400' : 'bg-blue-600'}`}
                    >
                        <Text className="text-white text-center">Submit</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
