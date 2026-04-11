import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../theme';
import { reportsApi } from '../api';

const REPORT_REASONS = [
  { id: '1', title: '거래 금지 물품이에요' },
  { id: '2', title: '전문판매업자 같아요' },
  { id: '3', title: '사기 피해를 입었어요' },
  {
    id: '4',
    title: '당근의 다른 서비스에 등록되어야 하는 게시글이에요',
    subtitle: '커뮤니티,부동산,알바 등 다른 서비스에 등록되어야 하는 게시글',
  },
  { id: '5', title: '부적절한 행위가 있거나 중고거래 목적이 아니에요.' },
  { id: '6', title: '작성자 신고하기', isBlue: true },
];

export default function ReportScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { targetType, targetId } = route.params || {};

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      reportsApi.create({
        target_type: targetType || 'PRODUCT',
        target_id: targetId,
        reason,
      }),
    onSuccess: () => {
      Alert.alert('신고 완료', '정상적으로 신고가 접수되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('오류', '신고 접수에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleReasonSelect = (reasonTitle: string) => {
    Alert.alert(
      '신고하기',
      '해당 사유로 신고하겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        { text: '네', onPress: () => reportMutation.mutate(reasonTitle) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          게시글을 신고하는 이유를 선택해주세요.
        </Text>

        <View style={styles.listContainer}>
          {REPORT_REASONS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.reasonRow}
                activeOpacity={0.6}
                onPress={() => handleReasonSelect(item.title)}
                disabled={reportMutation.isPending}
              >
                <View style={styles.reasonTextContainer}>
                  <Text
                    style={[
                      styles.reasonTitle,
                      { color: item.isBlue ? '#3B82F6' : colors.text },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.reasonSubtitle, { color: colors.textTertiary }]}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              
              {}
              {index < REPORT_REASONS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 30,
    marginTop: 10,
  },
  listContainer: {
    width: '100%',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  reasonTextContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  reasonSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
});
