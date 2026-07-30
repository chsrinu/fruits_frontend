import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";

import { updateUserDetails } from "@/app/api/user";
import { useAuthStore } from "@/app/stores/authStore";
import { useUserStore } from "@/app/stores/userStore";
import { BottomNavigation } from "@/components/BottomNavigation";
import { BackButton } from "@/components/BackButton";
import { colors } from "@/app/theme/designSystem";
import { AppButton } from "@/components/ui/AppButton";
import { sleep } from "@/app/utils/helper";

const screenTitleClassName = "ml-2 flex-1 text-left text-3xl font-bold text-black";
const sectionTitleClassName = "mb-3 text-xl font-semibold text-black";
const labelClassName = "mb-2 text-sm text-black";
const inputClassName = "mb-4 rounded-lg border border-brand-primary px-4 py-3 text-base text-black";
const multilineInputClassName = "mb-3 min-h-[72px] rounded-lg border border-brand-primary px-3 py-2 text-base text-black";
const disabledInputClassName = `${inputClassName} bg-gray-50`;
const disabledMultilineInputClassName = `${multilineInputClassName} bg-gray-50`;
const centeredInputStyle = {
  paddingVertical: 0,
  textAlignVertical: "center" as const,
};
const cardShadowStyle = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 3,
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const refreshUser = useUserStore((state) => state.refreshUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const clearToken = useAuthStore((state) => state.clearToken);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    refreshUser().catch(() => {
      // Fall back to persisted user data if refresh fails.
    });
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.userEmail || "");
    setMobile(user.mobileNumber || "");
  }, [user]);

  const canSaveProfile = useMemo(() => email.trim().length > 0, [email]);

  const handleLogout = () => {
    clearToken();
    clearUser();
    router.replace("/auth/login");
  };


  const handleSaveProfile = async () => {
    if (!canSaveProfile) return;

    try {
      setSavingProfile(true);
      await Promise.all([
        (async () => {
          await updateUserDetails({
            firstName: firstName.trim() || null,
            lastName: lastName.trim() || null,
            userEmail: email.trim(),
          });
          await refreshUser();
        })(),
        sleep(1000), // guarantees at least 1s, but doesn't add on top of a slow request
      ]);
      Alert.alert("Success", "Personal details updated.");
    } catch {
      Alert.alert("Error", "Unable to update personal details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAddress = () => {
    if (!user?.address) return;
    router.push("/account/address/edit");
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <BackButton className="px-1 py-1" colorClassName="text-black" />
        <Text className={screenTitleClassName}>Profile</Text>
        <AppButton onPress={handleLogout} label="LOGOUT" variant="danger" size="sm" className="rounded-lg" accessibilityLabel="Logout" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-24">
        <Text className={`${sectionTitleClassName} mt-2`}>User Information</Text>

        <View className="mb-6 rounded-xl border border-brand-primary bg-white p-4" style={cardShadowStyle}>
          <Text className={labelClassName}>FIRST NAME</Text>
          <TextInput value={firstName} onChangeText={setFirstName} className={inputClassName} placeholder="First name" />

          <Text className={labelClassName}>LAST NAME</Text>
          <TextInput value={lastName} onChangeText={setLastName} className={inputClassName} placeholder="Last name" />

          <Text className={labelClassName}>EMAIL ADDRESS</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className={inputClassName}
            placeholder="Email address"
            style={centeredInputStyle}
          />

          <Text className={labelClassName}>MOBILE NUMBER</Text>
          <TextInput value={mobile} editable={false} className={disabledInputClassName}  />

          <AppButton
            onPress={handleSaveProfile}
            disabled={!canSaveProfile || savingProfile}
            variant="primary"
            loading={savingProfile}
            className="mt-4 rounded-lg"
            label={savingProfile ? "Saving..." : "Save Personal Details"}
          />
        </View>

        <Text className={sectionTitleClassName}>Address Info</Text>

        <View className="rounded-xl border border-brand-primary bg-white p-4" style={cardShadowStyle}>
          <Text className={labelClassName}>ADDRESS</Text>
          <TextInput value={user?.address?.address || ""} editable={false} multiline textAlignVertical="top" className={disabledMultilineInputClassName} />

          <Text className={labelClassName}>NEARBY LANDMARK</Text>
          <TextInput value={user?.address?.landmark || ""} editable={false} className={disabledInputClassName} style={centeredInputStyle} />

          <Text className={labelClassName}>LOCALITY</Text>
          <TextInput
            value={user?.address?.localityName || ""}
            editable={false}
            multiline
            textAlignVertical="top"
            className={disabledMultilineInputClassName}
          />

          <Text className={labelClassName}>PINCODE</Text>
          <TextInput value={user?.address?.pincode || ""} editable={false} className={disabledInputClassName} style={centeredInputStyle} />

          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text className={labelClassName}>CITY</Text>
              <TextInput value={user?.address?.city || ""} editable={false} className="h-12 rounded-lg border border-brand-primary bg-gray-50 px-3 text-base text-black" style={centeredInputStyle} />
            </View>

            <View className="flex-1">
              <Text className={labelClassName}>STATE</Text>
              <TextInput value={user?.address?.state || ""} editable={false} className="h-12 rounded-lg border border-brand-primary bg-gray-50 px-3 text-base text-black" style={centeredInputStyle} />
            </View>
          </View>

          <AppButton
            onPress={handleUpdateAddress}
            disabled={!user?.address}
            className="mt-4 rounded-lg"
            label="Update Address"
            variant="primary"
          />

          {!user?.address ? <Text className="mt-3 text-sm text-orange-700">No address found yet. Add one from address setup first.</Text> : null}
        </View>
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
