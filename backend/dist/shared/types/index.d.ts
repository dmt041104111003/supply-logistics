export interface Redeemer {
    title: string;
    schema: {
        $ref: string;
    };
}
export interface Datum {
    title: string;
    schema: {
        $ref: string;
    };
}
export interface Validator {
    title: string;
    compiledCode: string;
    hash: string;
    redeemer?: Redeemer;
    datum?: Datum;
}
export interface Plutus {
    preamble: {
        title: string;
        description: string;
        version: string;
        plutusVersion: string;
        compiler: {
            name: string;
            version: string;
        };
        license: string;
    };
    validators: Validator[];
    definitions: Record<string, unknown>;
}
export type Transaction = {
    hash: string;
    inputs: Input[];
    outputs: Output[];
};
export type Input = {
    address: string;
    amount: Asset[];
    tx_hash: string;
    output_index: number;
    data_hash?: string;
    inline_datum?: string;
    reference_script_hash?: string;
    collateral: boolean;
    reference: boolean;
};
export type Output = {
    address: string;
    amount: Asset[];
    output_index: number;
    data_hash?: string;
    inline_datum?: string;
    reference_script_hash?: string;
    collateral: boolean;
    consumed_by_tx?: string;
};
export type Asset = {
    unit: string;
    quantity: string;
};
export interface Amount {
    unit: string;
    quantity: string;
}
export interface UtXO {
    address: string;
    tx_hash: string;
    output_index: number;
    amount: Amount[];
    block: string;
    data_hash: string | null;
    inline_datum: string | null;
    reference_script_hash: string | null;
}
