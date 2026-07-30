import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from "expo-router";

import { getWalletTransactions, WalletTransactionDTO } from "@/app/api/user";
import { useUserStore } from "@/app/stores/userStore";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppButton } from "@/components/ui/AppButton";

const sectionTitleClassName = "text-xl font-semibold text-black";
const transactionTextClassName = "text-base";

export default function WalletScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const refreshUser = useUserStore((state) => state.refreshUser);
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([]);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser().catch(() => {
      // Fallback to persisted value when refresh fails.
    });

    const loadTransactions = async () => {
      try {
        setTransactionError(null);
        const response = await getWalletTransactions();
        setTransactions(response.data ?? []);
      } catch {
        setTransactionError("Unable to load transactions right now.");
      }
    };

    loadTransactions();
  }, [refreshUser]);

  const currentBalance = useMemo(() => Number(user?.walletBalance || 0), [user?.walletBalance]);

  const formatTxnDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-3">
        <ScreenHeader title="Wallet" containerClassName="mb-2" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-24">
        <Text className={`${sectionTitleClassName} mt-2`}>Current Balance</Text>
        <Text className="mb-4 mt-1 text-5xl font-bold text-slate-900">₹{currentBalance.toLocaleString("en-IN")}</Text>

        <AppButton
          onPress={() => router.push("/payment/wallet")}
          label="TOP-UP"
          className="mb-6 w-40 rounded-lg"
        />

        <Text className={`${sectionTitleClassName} mb-3`}>Transactions</Text>

        {transactionError ? (
          <View className="rounded-xl border border-red-100 px-4 py-6">
            <Text className="text-center text-base text-red-600">{transactionError}</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View className="rounded-xl border border-blue-100 px-4 py-6">
            <Text className="text-center text-base text-slate-600">No transactions yet.</Text>
          </View>
        ) : (
          <View className="overflow-hidden rounded-xl border border-blue-100">
            {transactions.map((txn, index) => {
              const isCredit = txn.walletTransactionType === "CREDIT";
              const amountValue = Number(txn.amount || 0);
              return (
                <View
                  key={txn.id}
                  className={`px-4 py-3 flex-row items-center justify-between ${
                    index !== transactions.length - 1 ? "border-b border-blue-100" : ""
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text className={`${transactionTextClassName} font-semibold ${isCredit ? "text-green-700" : "text-red-600"}`}>
                      {isCredit ? "Credit" : "Debit"}
                    </Text>
                    {txn.purpose ? <Text className="mt-1 text-xs text-slate-600">{txn.purpose}</Text> : null}
                  </View>

                  <View className="items-end">
                    <Text className={`${transactionTextClassName} text-black`}>
                      {isCredit ? "+" : "-"} {amountValue.toFixed(2)}
                    </Text>
                    <Text className="text-sm text-slate-700">{formatTxnDate(txn.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
