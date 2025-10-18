import React, { useRef, useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    Dimensions,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;

const slides = [
    {
        title: 'Special Offer',
        description: '20% off all items',
        bgColor: 'bg-orange-500',
    },
    {
        title: 'Free Delivery',
        description: 'On orders above ₹500',
        bgColor: 'bg-blue-500',
    },
    {
        title: 'Buy 1 Get 1',
        description: 'Limited time offer',
        bgColor: 'bg-green-500',
    },
];

export default function CarouselBanner() {
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % slides.length;
            setCurrentIndex(nextIndex);

            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    x: nextIndex * screenWidth,
                    animated: true,
                });
            }
        }, 2000); // every 2 seconds

        return () => clearInterval(interval);
    }, [currentIndex]);

    return (
        <View className="my-4 w-full">
            <ScrollView
                horizontal
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                scrollEventThrottle={16}
                scrollEnabled={false} // disables manual swipe if needed
            >
                {slides.map((slide, index) => (
                    <View
                        key={index}
                        style={{ width: screenWidth }}
                        className={`${slide.bgColor} p-4 h-32 justify-center rounded`}
                    >
                        <Text className="text-white text-lg font-bold">{slide.title}</Text>
                        <Text className="text-white text-sm">{slide.description}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
