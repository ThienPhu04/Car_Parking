import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../../../shared/components/Button';
import { COLORS } from '../../../shared/constants/colors';
import { authService } from '../services/authService';
import { useAuth } from '../../../store/AuthContext';
import { AuthStackParamList } from '../../../types/navigation.types';
import Icon from 'react-native-vector-icons/Ionicons';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type OTPScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
    const navigation = useNavigation<OTPScreenNavigationProp>();
    const route = useRoute<OTPScreenRouteProp>();
    const { login } = useAuth();
    const { phone } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto focus next input
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 số OTP');
            return;
        }

        try {
            setIsLoading(true);
            const response = await authService.verifyOTP({ phone, otp: otpCode });
            // The login will be handled by AuthContext
            Alert.alert('Thành công', 'Xác thực OTP thành công!');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Mã OTP không đúng');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = () => {
        if (countdown > 0) return;
        setCountdown(60);
        // TODO: Call API to resend OTP
        Alert.alert('Thông báo', 'Mã OTP mới đã được gửi');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.content}>
                <Icon name="mail-outline" size={64} color={COLORS.primary} />
                <Text style={styles.title}>Xác thực OTP</Text>
                <Text style={styles.subtitle}>
                    Mã xác thực đã được gửi đến số điện thoại {'\n'}
                    <Text style={styles.phone}>{phone}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <Button
                    title="Xác nhận"
                    onPress={handleVerify}
                    loading={isLoading}
                    fullWidth
                    style={styles.verifyButton}
                />

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Không nhận được mã? </Text>
                    <TouchableOpacity onPress={handleResendOTP} disabled={countdown > 0}>
                        <Text
                            style={[
                                styles.resendLink,
                                countdown > 0 && styles.resendLinkDisabled,
                            ]}
                        >
                            {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xxxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginTop: SPACING.lg,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    phone: {
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 8,
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        textAlign: 'center',
        color: COLORS.textPrimary,
        backgroundColor: COLORS.backgroundSecondary,
    },
    verifyButton: {
        marginBottom: SPACING.lg,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
    resendLink: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    resendLinkDisabled: {
        color: COLORS.textSecondary,
    },
});

export default OTPVerificationScreen;