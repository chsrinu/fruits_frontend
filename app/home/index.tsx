import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchProducts } from '../api/products';
import CarouselBanner from '@/app/components/Carousel';
import AddToCartControl from '@/app/components/AddToCartControl';
import { useCartStore } from '@/app/stores/cartStore';
import {getDisplayUnit} from "@/app/utils/helper";

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

    const { items, addToCart, updateQuantity, setCartItems } = useCartStore();
    const router = useRouter();

    // Fetch products & rebase cart
    useEffect(() => {
        const handleFetchProducts = async () => {
            setLoading(true);
            try {
                const rawData = await fetchProducts();
                const data = rawData.data.map(product => ({
                    ...product,
                    displayUnits: getDisplayUnit(product.units),
                }));
                setProducts(data);
                setFilteredProducts(data);

                // Rebase cart items with fresh product data
                const updatedCartItems = items
                    .map((item) => {
                        const product = data.find((p) => p.productId === item.productId);
                        if (!product) return null;
                        return {
                            ...item,
                            productName: product.productName,
                            productImageUrlPath: product.productImageUrlPath,
                            pricePerUnit: product.pricePerUnit,
                            units: product.units,
                            isAvailable: product.isAvailable,
                            displayUnits: product.displayUnits
                        };
                    })
                    .filter(Boolean) as typeof items;

                setCartItems(updatedCartItems);
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
                <Text className="text-base font-semibold mt-1">{item.productName}</Text>
                <Text className="text-sm text-gray-600">${item.pricePerUnit.toFixed(2)}</Text>
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
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 flex-1">
                <Text className="text-2xl font-bold mb-2">Home</Text>

                {/* Search bar */}
                <View className="border rounded bg-green-50 px-3 py-2 mb-2 flex-row items-center justify-between">
                    <TextInput
                        className="flex-1 text-base"
                        placeholder="Search for products"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.trim() !== '' && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <Text className="text-xl text-gray-600 px-2">×</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions */}
                {search.length > 0 &&
                    suggestions.length > 0 &&
                    suggestions.map((s, i) => (
                        <TouchableOpacity key={i} onPress={() => handleSuggestionClick(s)}>
                            <Text className="text-gray-500 mb-1 ml-1">🔍 {s}</Text>
                        </TouchableOpacity>
                    ))}

                {/* Carousel */}
                <CarouselBanner />

                {/* Product Grid */}
                <View className="p-4 flex-1">
                    {loading ? (
                        <ActivityIndicator size="large" className="mt-4" />
                    ) : (
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

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full flex-row justify-around py-2 bg-white border-t">
                <TouchableOpacity onPress={() => router.push('/cart')}>
                    <Text>🛒</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text>👤</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text>💰</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
