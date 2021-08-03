export type publicFieldType = 'string' | 'number' | 'Asset' | 'Transform' | 'boolean' | 'json' | 'rgb' | 'v2' | 'v3';
export type publicFieldAssetTypes = 'any' | 'image' | 'text' | 'json' | 'entity';

export interface publicFieldConfig <T> {
    name: string,

    value?: T,

    type?: publicFieldType,
    array?: boolean,
    assetType?: publicFieldAssetTypes,

    description?: string,
    default?: T,

    overrideGet?: () => T,
    overrideSet?: (val: T) => void
}

export class publicField<T> {

    type: publicFieldType;
    assetType: publicFieldAssetTypes | undefined;
    value: any;
    name: string;
    description: string;
    array: boolean;
    default: any;

    constructor(config: publicFieldConfig<T>) {
        this.array = config.array || false;
        this.type = config.type || <publicFieldType> typeof config.value || 'string';
        this.value = config.value;
        this.name = config.name;
        this.description = config.description || '';
        this.default = config.default;
        this.assetType = config.assetType;

        if (this.array)
            if (this.value) {
                if (!Array.isArray(this.value))
                    this.value = [this.value];
            } else
                this.value = [];
    }
}