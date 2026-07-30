import React, { useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
// import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";

import { updateAddress } from "@/app/api/user";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppButton } from "@/components/ui/AppButton";
import { GOOGLE_MAPS_API_KEY } from "@/config/googleMaps";
import { UserAddressDTO, useUserStore } from "@/app/stores/userStore";

type AddressEditorProps = {
  mode: "add" | "edit";
};

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type ResolvedAddress = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  localityName: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  formatted_address: string;
  address_components: GoogleAddressComponent[];
};

const DEFAULT_REGION: MapRegion = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const getComponentValue = (
  components: GoogleAddressComponent[],
  candidates: string[]
) => {
  const match = components.find((component) =>
    component.types.some((type) => candidates.includes(type))
  );

  return match?.long_name ?? "";
};

const buildResolvedAddress = (
  result: GoogleGeocodeResult,
  latitude: number,
  longitude: number
): ResolvedAddress => {
  const route = getComponentValue(result.address_components, ["route"]);
  const streetNumber = getComponentValue(result.address_components, ["street_number"]);
  const premise = getComponentValue(result.address_components, ["premise"]);
  const neighborhood = getComponentValue(result.address_components, [
    "sublocality_level_1",
    "sublocality",
    "neighborhood",
  ]);
  const city = getComponentValue(result.address_components, [
    "locality",
    "administrative_area_level_2",
  ]);
  const state = getComponentValue(result.address_components, [
    "administrative_area_level_1",
  ]);
  const pincode = getComponentValue(result.address_components, ["postal_code"]);

  const addressParts = [streetNumber, route || premise].filter(Boolean);
  const addressLine =
    addressParts.join(" ").trim() ||
    result.formatted_address.split(",").slice(0, 2).join(", ").trim();

  return {
    addressLine,
    city,
    state,
    pincode,
    localityName: neighborhood,
    latitude,
    longitude,
    formattedAddress: result.formatted_address,
  };
};

const reverseGeocodeWithGoogle = async (
  latitude: number,
  longitude: number
): Promise<ResolvedAddress> => {
  if (!GOOGLE_MAPS_API_KEY) {
    const fallback = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = fallback[0];
    if (!first) {
      throw new Error("Unable to resolve this location.");
    }

    const addressLine = [first.streetNumber, first.street].filter(Boolean).join(" ").trim();

    return {
      addressLine,
      city: first.city || first.subregion || "",
      state: first.region || "",
      pincode: first.postalCode || "",
      localityName: first.district || "",
      latitude,
      longitude,
      formattedAddress: [
        addressLine,
        first.city,
        first.region,
        first.postalCode,
      ]
        .filter(Boolean)
        .join(", "),
    };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();

  if (!response.ok || data.status !== "OK" || !data.results?.length) {
    throw new Error("Unable to resolve this location.");
  }

  return buildResolvedAddress(data.results[0], latitude, longitude);
};

export function AddressEditor({ mode }: AddressEditorProps) {
  const router = useRouter();
  //const mapRef = useRef<MapView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const refreshUser = useUserStore((state) => state.refreshUser);
  const currentAddress = useUserStore((state) => state.user?.address);

  const [addressLine, setAddressLine] = useState(currentAddress?.address || "");
  const [city, setCity] = useState(currentAddress?.city || "");
  const [stateName, setStateName] = useState(currentAddress?.state || "");
  const [localityName, setLocalityName] = useState(currentAddress?.localityName || "");
  const [pincode, setPincode] = useState(currentAddress?.pincode || "");
  const [landmark, setLandmark] = useState(currentAddress?.landmark || "");
  const [region, setRegion] = useState<MapRegion>({
    latitude: currentAddress?.latitude ?? DEFAULT_REGION.latitude,
    longitude: currentAddress?.longitude ?? DEFAULT_REGION.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  });
  const [locating, setLocating] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollYRef = useRef(0);
  const fieldPositionsRef = useRef({
    addressLine: 0,
    landmark: 0,
  });
  const mapHeight = keyboardHeight > 0 ? 160 : 280;

  const title = mode === "edit" ? "Edit Address" : "Add Address";
  const ctaLabel = mode === "edit" ? "Update Address" : "Save Address";

  const scrollFieldIntoView = (field: "addressLine" | "landmark") => {
    setTimeout(() => {
      const windowHeight = Dimensions.get("window").height;
      const footerAllowance = 116;
      const visibleBottom = windowHeight - keyboardHeight - footerAllowance;
      const desiredTop = keyboardHeight > 0 ? 260 : 180;
      const fieldY = fieldPositionsRef.current[field];
      const currentVisibleY = fieldY - scrollYRef.current;

      if (currentVisibleY > visibleBottom || currentVisibleY > desiredTop) {
        const targetY = Math.max(0, fieldY - desiredTop);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }
    }, 220);
  };

  const recordFieldPosition =
    (field: "addressLine" | "landmark") => (event: LayoutChangeEvent) => {
      fieldPositionsRef.current[field] = event.nativeEvent.layout.y;
    };

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const updateRegion = (latitude: number, longitude: number) => {
    const nextRegion = {
      latitude,
      longitude,
      latitudeDelta: DEFAULT_REGION.latitudeDelta,
      longitudeDelta: DEFAULT_REGION.longitudeDelta,
    };
    setRegion(nextRegion);
    //mapRef.current?.animateToRegion(nextRegion, 300);
  };

  const canSave = useMemo(() => {
    return (
      addressLine.trim().length > 0 &&
      city.trim().length > 0 &&
      localityName.trim().length > 0 &&
      stateName.trim().length > 0 &&
      pincode.trim().length > 0 &&
      !resolving &&
      !locating
    );
  }, [addressLine, city, localityName, locating, pincode, resolving, stateName]);

  const applyResolvedAddress = (
    resolved: ResolvedAddress,
    source: "current" | "search" | "map" = "map"
  ) => {
    setAddressLine((current) => current.trim() || resolved.addressLine);
    setCity(resolved.city);
    setStateName(resolved.state);
    setLocalityName(resolved.localityName);
    setPincode(resolved.pincode);

    const nextRegion = {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      latitudeDelta: DEFAULT_REGION.latitudeDelta,
      longitudeDelta: DEFAULT_REGION.longitudeDelta,
    };
    setRegion(nextRegion);
    //mapRef.current?.animateToRegion(nextRegion, 300);
  };

  const resolveCoordinates = async (
    latitude: number,
    longitude: number,
    source: "current" | "search" | "map" = "map"
  ) => {
    updateRegion(latitude, longitude);

    try {
      setResolving(true);
      const resolved = await reverseGeocodeWithGoogle(latitude, longitude);
      applyResolvedAddress(resolved, source);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to resolve address.";
      Alert.alert("Location Error", message);
    } finally {
      setResolving(false);
    }
  };

  const centerToCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Allow location access to auto-fill your address."
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await resolveCoordinates(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        "current"
      );
    } catch {
      Alert.alert("Location Error", "Unable to fetch your current location.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && currentAddress?.latitude && currentAddress?.longitude) {
      setLocating(false);
      resolveCoordinates(currentAddress.latitude, currentAddress.longitude);
      return;
    }

    centerToCurrentLocation();
  }, []);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    const payload: UserAddressDTO = {
      id: mode === "edit" ? currentAddress?.id ?? null : null,
      address: addressLine.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      localityName: localityName.trim(),
      state: stateName.trim(),
      landmark: landmark.trim() || null,
      societyName: currentAddress?.societyName ?? null,
      blockName: currentAddress?.blockName ?? null,
      latitude: region.latitude,
      longitude: region.longitude,
      serviceableAreaId: currentAddress?.serviceableAreaId ?? 1,
      societyId: currentAddress?.societyId ?? 1,
      blockId: currentAddress?.blockId ?? 1,
    };

    try {
      setSaving(true);
      await updateAddress(payload);
      await refreshUser();
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Unable to save address right now.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white px-5 pt-5">
        <ScreenHeader title={title} />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 12}
      >
        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref;
          }}
          className="flex-1 bg-white"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 140 : 140,
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          onScroll={(event) => {
            scrollYRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View className="mb-4 overflow-hidden rounded-2xl border border-gray-200">
            {/* <MapView
              ref={(ref) => {
                mapRef.current = ref;
              }}
              style={{ height: mapHeight, width: "100%" }}
              region={region}
              scrollEnabled
              zoomEnabled
              moveOnMarkerPress={false}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                resolveCoordinates(latitude, longitude, "map");
              }}
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                draggable
                onDragEnd={(event) => {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  resolveCoordinates(latitude, longitude, "map");
                }}
              />
            </MapView> */}

            <TouchableOpacity
              onPress={() => {
                if (locating || resolving) return;
                centerToCurrentLocation();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Use current location again"
              accessibilityState={{ disabled: locating || resolving }}
              className={`absolute bottom-4 right-4 h-12 w-12 items-center justify-center rounded-full border ${
                locating || resolving
                  ? "border-green-600 bg-white"
                  : "border-gray-300 bg-white"
              }`}
              style={{
                opacity: 1,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
              }}
            >
              <MaterialIcons
                name="my-location"
                size={22}
                color={locating || resolving ? "#16a34a" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          <Text className="mb-4 text-sm text-blue-700">
            {locating || resolving
              ? "Fetching your location details..."
              : "You can drag or tap the map pin location to update this address."}
          </Text>

          <View onLayout={recordFieldPosition("addressLine")}>
            <Text className="mb-2 text-sm text-blue-900">ADDRESS LINE</Text>
            <TextInput
              placeholder="House number, flat, building, landmark"
              value={addressLine}
              onChangeText={setAddressLine}
              onFocus={() => scrollFieldIntoView("addressLine")}
              className="mb-4 rounded-lg border border-gray-300 px-4 py-3"
            />
          </View>

        <View onLayout={recordFieldPosition("landmark")}>
          <Text className="mb-2 text-sm text-blue-900">NEARBY LANDMARK</Text>
            <TextInput
              placeholder="Temple, park, mall, school, etc."
              value={landmark}
              onChangeText={setLandmark}
              onFocus={() => scrollFieldIntoView("landmark")}
              className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
          />
        </View>

        <Text className="mb-2 text-sm text-blue-900">LOCALITY</Text>
        <TextInput
          value={localityName}
          editable={false}
          className="mb-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
        />

        <View className="mb-4 flex-row gap-3">
          <View className="w-32">
              <Text className="mb-2 text-sm text-blue-900">PINCODE</Text>
              <TextInput
                value={pincode}
                editable={false}
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm text-blue-900">CITY</Text>
              <TextInput
                value={city}
                editable={false}
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
              />
            </View>
          </View>

            <Text className="mb-2 text-sm text-blue-900">STATE</Text>
            <TextInput
              value={stateName}
              editable={false}
            className="mb-6 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
          />

        </ScrollView>

        <View className="border-t border-gray-200 bg-white px-5 pb-6 pt-4">
          <AppButton
            className="rounded-xl"
            disabled={!canSave || saving}
            onPress={handleSave}
            loading={saving}
            label={saving ? "Saving..." : ctaLabel}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
