"use client"

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { cn } from "@/lib/utils";

// Type structure for the select dropdown options
interface SelectOption {
  id:    string;
  name:  string;
  label?: string;
  value?: string;
}

interface FormInputProps {
  name: string;
  label?: string;
  required?: boolean,
  readOnly?: boolean,
  value?: string | number | readonly string[] | undefined,
  className?: string;
  labelClassName?: string;
  type?: string;
  placeholder?: string;
  hintText?: string;
  textArea?: boolean;
  select?: boolean;
  nativeSelect?: boolean; 
  selectDefaultValue?: string;
  options?: SelectOption[]; 
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number | string | undefined;
  max?: number | string | undefined;
  step?: string;
}

export function FormInput({
  name,
  label,
  required,
  readOnly,
  value,
  labelClassName,
  className,
  type = "text",
  placeholder,
  hintText,
  textArea = false,
  select = false,
  nativeSelect = false,
  selectDefaultValue,
  options = [],
  disabled = false,
  maxLength,
  minLength,
  min, 
  max,
  step
}: FormInputProps) {
  const { register, control, formState: { errors } } = useFormContext();
  const error = errors[name];

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Field>
      {label && <FieldLabel className={labelClassName} htmlFor={name}>{label}</FieldLabel>}
      
      {/* 1. SELECT COMPONENT RENDERING */}
      {select ? (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select 
              onValueChange={(val) => {
                field.onChange(val);
              }} 
              value={field.value|| ""} 
              disabled={disabled}
            >
              <SelectTrigger 
                id={name}
                 className={cn(
                  error ? "border-destructive focus:ring-destructive" : "",
                  className 
                )}
              >
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {selectDefaultValue && <SelectItem value="none">{selectDefaultValue}</SelectItem>}
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        
      ) : nativeSelect ? (
        /* 1. NATIVE SELECT RENDERING */
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <NativeSelect 
              onChange={field.onChange}
              value={field.value}
              disabled={disabled}
              className={`${className} ${error ? "border-destructive" : ""}`}
              aria-invalid={!!error}
            >
              <NativeSelectOption value="">{placeholder || "Select an option"}</NativeSelectOption>
              {options.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        />
      ) : textArea ? (
        /* 2. TEXTAREA RENDERING */
        <Textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className={`${className} ${error ? "border-destructive" : ""}`}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          required = {required}
          readOnly = {readOnly}
          value={value}
        />
      ) : (
        /* 3. INPUT / PASSWORD RENDERING */
        <div className="relative">
          <Input
            {...register(name)}
            id={name}
            type={inputType}
            placeholder={placeholder}
            className={`${className} ${error ? "border-destructive" : ""} ${isPassword ? "pr-10" : ""}`}
            disabled={disabled}
            min={min}
            max = {max}
            value={value}
            required = {required}
            readOnly = {readOnly}
            step = {step}
          />
          
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" /> // Adjusted to h-4 w-4 standard layout size
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          )}
        </div>
      )}

      {error ? (
        <FieldDescription className="text-destructive text-xs font-medium mt-1">
          {error.message as string}
        </FieldDescription>
      ) : (
        hintText && <FieldDescription className="text-xs font-medium mt-1">{hintText}</FieldDescription>
      )}
    </Field>
  );
}
