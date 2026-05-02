import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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

const isRemoteImageUrl = (value?: string | null) =>
  typeof value === 'string' &&
  /^https?:\/\//i.test(value) &&
  /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(value);

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
  const qrValue =
    draft?.qrValue || draft?.qrUrl || draft?.transferContent || '';
  const shouldRenderQrImage = isRemoteImageUrl(draft?.qrUrl);
  const isQrContentFallback =
    Boolean(draft) &&
    !shouldRenderQrImage &&
    qrValue === draft?.transferContent;

  const handleCreateTransaction = async () => {
    if (parsedAmount < 10000) {
      Alert.alert(
        'So tien khong hop le',
        'Vui long nhap it nhat 10.000 VND'
      );
      return;
    }

    try {
      const nextDraft = await onCreateDraft(parsedAmount);
      setDraft(nextDraft);
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the tao ma QR nap tien');
    }
  };

  const handleConfirm = async () => {
    if (!draft) {
      return;
    }

    try {
      await onConfirmSuccess(draft);
      Alert.alert(
        'Da ghi nhan',
        'Yeu cau nap tien da duoc ghi nhan. So du se duoc cap nhat sau khi he thong xac nhan giao dich.'
      );
      onClose();
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the xac nhan giao dich');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Nạp tiền vào ví">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces
      >
        {!draft ? (
          <View>
            <Input
              label="So tien nap"
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
              title="Tao ma QR"
              onPress={handleCreateTransaction}
              loading={creating}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <View style={styles.qrCard}>
              {shouldRenderQrImage ? (
                <Image
                  source={{ uri: draft?.qrUrl }}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              ) : (
                <QRCodeStyled
                  data={qrValue}
                  style={styles.qrCode}
                  padding={18}
                  pieceBorderRadius={2}
                  isPiecesGlued
                  color={COLORS.primaryDark}
                  outerEyesOptions={{
                    topLeft: { color: COLORS.primaryDark },
                    topRight: { color: COLORS.primaryDark },
                    bottomLeft: { color: COLORS.primaryDark },
                  }}
                />
              )}
              {isQrContentFallback ? (
                <Text style={styles.qrFallbackNote}>
                  QR tu backend chua co du lieu chuan de quet. Neu ung dung ngan
                  hang khong nhan ma, vui long chuyen khoan thu cong dung noi
                  dung ben duoi.
                </Text>
              ) : null}
            </View>

            {/* <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Tai khoan dich</Text>
              <Text style={styles.infoValue}>{draft.bankName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Ma ngan hang</Text>
              <Text style={styles.infoValue}>{draft.bankCode}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>So tai khoan</Text>
              <Text style={styles.infoValue}>{draft.bankAccountNumber}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Chu tai khoan</Text>
              <Text style={styles.infoValue}>
                {draft.bankAccountName || 'Dang cap nhat'}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>So tien</Text>
              <Text style={[styles.infoValue, styles.amountValue]}>
                {formatCurrency(draft.amount)}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Ma giao dich</Text>
              <Text style={styles.infoValue}>{draft.transactionId}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Noi dung chuyen khoan</Text>
              <Text style={styles.infoValue}>{draft.transferContent}</Text>
            </View> */}
            {draft.expireAt ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Het han</Text>
                <Text style={styles.infoValue}>
                  {new Date(draft.expireAt).toLocaleString('vi-VN')}
                </Text>
              </View>
            ) : null}

            <Button
              title="Hoan tat"
              onPress={handleConfirm}
              loading={loading}
              fullWidth
            />
            <Button
              title="Tao lai"
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
  scrollView: {
    marginHorizontal: -SPACING.lg,
    marginBottom: -SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl + SPACING.md,
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
