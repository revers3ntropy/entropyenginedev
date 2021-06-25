export abstract class System {
    protected constructor () {

    }

    abstract Start (): void;
    abstract Update (): void;
}