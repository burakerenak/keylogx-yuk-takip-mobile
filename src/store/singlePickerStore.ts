import { create } from 'zustand';
import { LoginResponse } from '../types/user.types';
import { GetConstantListResponseData } from '../types/constant.types';
import { CustomSingleSelectModel } from '../components/SingleSelect';

type SinglePickerState = {
    isSinglePickerShown: boolean;
    singlePickerItems: GetConstantListResponseData[];
    setSelectedSinglePickerValue?: React.Dispatch<React.SetStateAction<CustomSingleSelectModel | undefined>> | ((value: CustomSingleSelectModel | undefined) => void);
    showSinglePicker: (items: GetConstantListResponseData[], setSelectedValue: React.Dispatch<React.SetStateAction<CustomSingleSelectModel | undefined>> | ((value: CustomSingleSelectModel | undefined) => void), title: string | undefined) => void;
    hideSinglePicker: () => void;
    singlePickerTitle: string | undefined;
};

export const useSinglePickerStore = create<SinglePickerState>((set) => ({
    isSinglePickerShown: false,
    singlePickerItems: [],
    showSinglePicker(items, setSelectedValue, title) {
        set({ isSinglePickerShown: true, singlePickerItems: items, setSelectedSinglePickerValue: setSelectedValue, singlePickerTitle: title })
    },
    hideSinglePicker() {
        set({ isSinglePickerShown: false, singlePickerItems: [], setSelectedSinglePickerValue: undefined, singlePickerTitle: '' })
    },
    singlePickerTitle: ''
}));