import { isEmpty } from "./commonUtils";

export const sum = (numbers: number[]): number => {
    return numbers.reduce((total, current) => total + current, 0);
};

export const formatWeight = (kg: number): string => {
    if (kg >= 1000) {
        const ton = kg / 1000;

        return `${Number.isInteger(ton) ? ton : ton.toFixed(2)} ton`;
    }

    return `${kg} kg`;
};

export const toNumber = (_str: string | undefined) => {
    try {
        if (!_str || isEmpty(_str))
            return 0;

        _str = _str.toString().replace(",", ".").trim();

        if (_str.toString().endsWith("."))
            _str = _str.toString().replace(".", "").trim();

        return parseFloat(_str.toString());
    } catch (error) {
        return -1;
    }
}