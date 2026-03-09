export declare function requireNonEmptyString(value: unknown, message: string): string;
export declare function requirePositiveInt(value: unknown, message: string): number;
export declare function assertChangeAddressAndAssetName(body: {
    changeAddress?: unknown;
    assetName?: unknown;
}): void;
export declare function assertMetadataOrRequiredFields(body: {
    metadata?: unknown;
    name?: unknown;
    image?: unknown;
    receivers?: unknown;
    receiverLocations?: unknown;
    receiverCoordinates?: unknown;
    minterLocation?: unknown;
    minterCoordinates?: unknown;
}): void;
