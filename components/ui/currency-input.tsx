"use client"

import React from 'react';
import { Input } from './input';

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function formatCurrencyInputValue(value: string): string {
  if (!value) return "";
  // Remove all non-digits
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  // Convert to cents
  const amount = parseInt(numericValue, 10) / 100;
  // Format as pt-BR
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrencyInputValue(e.target.value);
      onChange(formatted);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
