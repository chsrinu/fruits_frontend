// utils/helper.ts


export const getDisplayUnit = (unit: string): string => {
    const unitMap: Record<string, string> = {
        KG: 'kg',
        LITRE: 'ltr',
        PIECE: 'pc',
        DOZEN: 'dzn',
    };
    return unitMap[unit.toUpperCase()] || unit.toLowerCase();
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));