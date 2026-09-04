export type ShopCategory = "theme" | "cosmetic" | "powerup";
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    levelRequired: number;
    category: "theme" | "cosmetic" | "powerup";
    icon: string;
}
export declare const SHOP_ITEMS: ShopItem[];
export declare const getItemIcon: (itemId: string | undefined | null) => string;
export declare const getCosmetics: () => ShopItem[];
export declare const getItemsByCategory: (category: string) => ShopItem[];
/**
 * Formats a given number of milliseconds into a HH:MM:SS string.
 * It strictly handles hours (even over 24), minutes, and seconds,
 * always ensuring 2 digits for MM:SS for a clean clock look.
 */
export declare const formatTimeRemaining: (ms: number) => string;
//# sourceMappingURL=item.d.ts.map