import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    Image,
    FlatList,
    TouchableOpacity,
    Keyboard,
    Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { fetchProducts } from '../api/products';
import CarouselBanner from '@/components/Carousel';
import AddToCartControl from '@/components/AddToCartControl';
import { useCartStore } from '@/app/stores/cartStore';
import {getDisplayUnit} from "@/app/utils/helper";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useProductStore } from "@/app/stores/productStore";
import { AppText } from "@/components/ui/AppText";
import { ui } from "@/app/theme/designSystem";

interface Product {
    productId: number;
    productType: string;
    pricePerUnit: number;
    productName: string;
    isAvailable: boolean;
    lastUpdated: string;
    productImageUrlPath: string;
    units: string;
    displayUnits: string;
}

export default function HomeScreen() {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [shouldShowSuggestions, setShouldShowSuggestions] = useState(true);
    const router = useRouter();
    const cachedProducts = useProductStore((state) => state.products);
    const setProductCatalog = useProductStore((state) => state.setProducts);
    const shouldRefreshProducts = useProductStore((state) => state.shouldRefreshProducts);

    const { items, addToCart, updateQuantity } = useCartStore();
    const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    // On mount: use cache immediately, fetch only if stale (> 1h)
    useEffect(() => {
        const handleFetchProducts = async () => {
            const hasCachedProducts = cachedProducts.length > 0;
            const shouldFetch = shouldRefreshProducts(60 * 60 * 1000);

            if (hasCachedProducts) {
                setProducts(cachedProducts as Product[]);
                setFilteredProducts(cachedProducts as Product[]);
            }

            if (!shouldFetch) return;

            setLoading(!hasCachedProducts);
            try {
                const rawData = await fetchProducts();
                const data = rawData.data.map((product: Product) => ({
                    ...product,
                    displayUnits: getDisplayUnit(product.units),
                }));
                setProducts(data);
                setFilteredProducts(data);
                setProductCatalog(data);
            } catch (err) {
                console.error('Failed to fetch products', err);
            } finally {
                setLoading(false);
            }
        };

        handleFetchProducts();
    }, []);

    // Suggestion logic
    useEffect(() => {
        if (!shouldShowSuggestions) {
            const timer = setTimeout(() => setShouldShowSuggestions(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [shouldShowSuggestions]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search.trim() === '') {
                handleClearSearch();
            } else if (shouldShowSuggestions) {
                const filtered = products
                    .map((p) => p.productName)
                    .filter((name) => name.toLowerCase().includes(search.toLowerCase()));
                setSuggestions(filtered.slice(0, 3));
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, products]);

    const handleClearSearch = () => {
        setSearch('');
        setSuggestions([]);
        setFilteredProducts(products);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearch(suggestion);
        setSuggestions([]);
        setShouldShowSuggestions(false);
        Keyboard.dismiss();

        const matchedProducts = products.filter(
            (p) => p.productName.toLowerCase() === suggestion.toLowerCase()
        );
        setFilteredProducts(matchedProducts);
    };

    const renderItem = ({ item }: { item: Product }) => {
        const quantity = items.find((i) => i.productId === item.productId)?.quantity || 0;

        const handleAddToCart = () => {
            addToCart({
                productId: item.productId,
                productName: item.productName,
                productImageUrlPath: item.productImageUrlPath,
                pricePerUnit: item.pricePerUnit,
                quantity: 1,
                units: item.units,
                isAvailable: item.isAvailable,
                displayUnits: item.displayUnits
            });
        };

        const handleIncrease = () => {
            updateQuantity(item.productId, quantity + 1);
        };

        const handleDecrease = () => {
            updateQuantity(item.productId, quantity - 1);
        };

        return (
            <View className="w-[48%] bg-white p-2 mb-4 rounded border">
                <Image
                    source={{ uri: item.productImageUrlPath }}
                    style={{ width: '100%', height: 100, resizeMode: 'contain' }}
                />
                <AppText className="mt-1 font-semibold">{item.productName}</AppText>
                <AppText variant="caption">${item.pricePerUnit.toFixed(2)}</AppText>
                <AddToCartControl
                    quantity={quantity}
                    onAdd={handleAddToCart}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                />
            </View>
        );
    };

    return (
        <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 flex-1">
                <AppText variant="title" className="mb-2">Home</AppText>

                {/* Search + Cart */}
                <View className="mb-2 flex-row items-center gap-2">
                    <View className={`${ui.inputContainer} h-11 flex-1 flex-row items-center justify-between`}>
                        <TextInput
                            className="flex-1 text-base text-brand-text"
                            placeholderTextColor="#64748b"
                            placeholder="Search for products"
                            value={search}
                            onChangeText={setSearch}
                            style={{
                                paddingVertical: 0,
                                ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : null),
                            }}
                        />
                        {search.trim() !== '' && (
                            <TouchableOpacity onPress={handleClearSearch}>
                                <AppText className="px-2 text-xl text-brand-muted">×</AppText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/cart" as any)}
                        className={`${ui.iconButton} relative w-12`}
                        accessibilityRole="button"
                        accessibilityLabel="Open cart"
                    >
                        <AppText className="text-xl">🛒</AppText>
                        {cartItemCount > 0 && (
                            <View className={`absolute -right-3 -top-2 min-w-[18px] items-center justify-center ${ui.badge}`}>
                                <AppText className={ui.badgeText}>
                                    {cartItemCount > 99 ? "99+" : cartItemCount}
                                </AppText>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Suggestions */}
                {search.length > 0 &&
                    suggestions.length > 0 &&
                    suggestions.map((s, i) => (
                        <TouchableOpacity key={i} onPress={() => handleSuggestionClick(s)}>
                            <AppText variant="caption" className="mb-1 ml-1">🔍 {s}</AppText>
                        </TouchableOpacity>
                    ))}

                {/* Carousel */}
                <CarouselBanner />

                {/* Product Grid */}
                <View className="flex-1">
                    {loading ? null : (
                        <FlatList
                            data={filteredProducts}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.productId.toString()}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                            contentContainerStyle={{ paddingBottom: 80 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>

            <BottomNavigation />
        </SafeAreaView>
        </SafeAreaProvider>
    );
}
