import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { WalletTopUpDraft } from '../../../types/wallet.types';

interface WalletTopUpModalProps {
  visible: boolean;
  loading?: boolean;
  creating?: boolean;
  onClose: () => void;
  onCreateDraft: (amount: number) => Promise<WalletTopUpDraft>;
  onConfirmSuccess: (draft: WalletTopUpDraft) => Promise<void>;
}

const formatCurrency = (value: number) =>
  `${Math.max(0, value || 0).toLocaleString('vi-VN')} VND`;

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

export const WalletTopUpModal: React.FC<WalletTopUpModalProps> = ({
  visible,
  loading = false,
  creating = false,
  onClose,
  onCreateDraft,
  onConfirmSuccess,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [draft, setDraft] = useState<WalletTopUpDraft | null>(null);

  useEffect(() => {
    if (!visible) {
      setAmountInput('');
      setDraft(null);
    }
  }, [visible]);

  const parsedAmount = useMemo(
    () => Number(amountInput.replace(/[^\d]/g, '')) || 0,
    [amountInput]
  );
  const qrValue = draft?.qrValue || draft?.qrUrl || draft?.transferContent || '';
  const isQrUrlFallback =
    Boolean(draft?.qrUrl) && draft?.qrValue === draft?.qrUrl;

  const handleCreateTransaction = async () => {
    if (parsedAmount < 10000) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập ít nhất 10.000 VND');
      return;
    }

    try {
      const nextDraft = await onCreateDraft(parsedAmount);
      setDraft(nextDraft);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo mã QR nạp tiền');
    }
  };

  const handleConfirm = async () => {
    if (!draft) {
      return;
    }

    try {
      await onConfirmSuccess(draft);
      Alert.alert(
        'Đã ghi nhận',
        'Yêu cầu nạp tiền đã được ghi nhận. Số dư sẽ được cập nhật sau khi hệ thống xác nhận giao dịch.'
      );
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể xác nhận giao dịch');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Nạp tiền vào ví">
      <ScrollView showsVerticalScrollIndicator={false}>
        {!draft ? (
          <View>
            <Input
              label="Số tiền nạp"
              placeholder="Vi du: 100000"
              keyboardType="number-pad"
              value={amountInput}
              onChangeText={value =>
                setAmountInput(value.replace(/[^\d]/g, ''))
              }
            />
            <View style={styles.quickAmountRow}>
              {QUICK_AMOUNTS.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.quickAmountChip}
                  activeOpacity={0.8}
                  onPress={() => setAmountInput(String(item))}
                >
                  <Text style={styles.quickAmountText}>
                    {formatCurrency(item)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Tạo mã QR"
              onPress={handleCreateTransaction}
              loading={creating}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <View style={styles.qrCard}>
              <QRCodeStyled
                data={qrValue}
                style={styles.qrCode}
                padding={18}
                // pieceSize={7}
                pieceBorderRadius={2}
                isPiecesGlued
                color={COLORS.primaryDark}
                outerEyesOptions={{
                  topLeft: { color: COLORS.primaryDark },
                  topRight: { color: COLORS.primaryDark },
                  bottomLeft: { color: COLORS.primaryDark },
                }}
              />
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Tài khoản đích</Text>
              <Text style={styles.infoValue}>{draft.bankName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Mã ngân hàng</Text>
              <Text style={styles.infoValue}>{draft.bankCode}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Số tài khoản</Text>
              <Text style={styles.infoValue}>{draft.bankAccountNumber}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Chủ tài khoản</Text>
              <Text style={styles.infoValue}>
                {draft.bankAccountName || 'Đang cập nhật'}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Số tiền</Text>
              <Text style={[styles.infoValue, styles.amountValue]}>
                {formatCurrency(draft.amount)}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Mã giao dịch</Text>
              <Text style={styles.infoValue}>{draft.transactionId}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Nội dung chuyển khoản</Text>
              <Text style={styles.infoValue}>{draft.transferContent}</Text>
            </View>
            {draft.expireAt ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Hết hạn</Text>
                <Text style={styles.infoValue}>
                  {new Date(draft.expireAt).toLocaleString('vi-VN')}
                </Text>
              </View>
            ) : null}

            <Button
              title="Tôi đã chuyển tiền, kiểm tra lại"
              onPress={handleConfirm}
              loading={loading}
              fullWidth
            />
            <Button
              title="Tạo lại"
              onPress={() => setDraft(null)}
              variant="outline"
              fullWidth
              style={styles.secondaryAction}
            />
          </View>
        )}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickAmountChip: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  quickAmountText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  amountPreview: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  infoBlock: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qrCode: {
    width: 220,
    height: 220,
    marginBottom: SPACING.sm,
  },
  qrCaption: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  qrFallbackNote: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
    color: COLORS.warning,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  amountValue: {
    color: COLORS.success,
  },
  secondaryAction: {
    marginTop: SPACING.sm,
  },
});
