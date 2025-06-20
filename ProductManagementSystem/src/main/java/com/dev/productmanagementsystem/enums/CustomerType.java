package com.dev.productmanagementsystem.enums;

public enum CustomerType {
    INDIVIDUAL("Individual"),
    BUSINESS("Business"),
    GOVERNMENT("Government"),
    NON_PROFIT("Non-Profit");

    private final String displayName;

    CustomerType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}