import React from "react";
import { useFormContext } from "react-hook-form";
import { Country } from "country-state-city";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
// Change default import to a wildcard namespace import
import * as HasFlag from "country-flag-icons/react/3x2";
import { FormInput } from "./FormInput";

// Define a strict type for the flag icons object mapping string ISO codes to component shapes
type FlagIconsType = Record<string, React.ComponentType<{ title?: string; className?: string }>>;

// Safely cast the namespace collection to our Record mapping
const FlagIcons = HasFlag as unknown as FlagIconsType;

export function CustomPhoneField() {
const methods = useFormContext();
  
  const countriesList = Country.getAllCountries().map((c) => ({
    code: c.isoCode,
    name: c.name,
    dialCode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
  }));

  const defaultCountry = countriesList.find((c) => c.code === "GH") || countriesList[0];
  const selectedCountryCode = (methods.watch("countryCode") as string) || defaultCountry.code;
  const currentCountry = countriesList.find((c) => c.code === selectedCountryCode) || defaultCountry;

  // Type-safe lookup using our casted Record mapping
  const FlagComponent = FlagIcons[currentCountry.code];
  return (
    <div className="space-y-2">
      <Label className="mb-3">Phone Number *</Label>
      <div className="flex rounded-lg border  border-slate-200 bg-white focus-within:border-gray-200 focus-within:ring-1 focus-within:ring-gray-200 overflow-hidden shadow-sm h-fit transition-all">
        
        {/* Native Select Overlay Wrapper */}
        <div className="relative flex items-center bg-slate-50 border-r border-slate-200 px-3 cursor-pointer group hover:bg-slate-100/80 transition-colors">
          <select
            {...methods.register("countryCode")}
            defaultValue={defaultCountry.code}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          >
            {countriesList.map((country) => (
              <option key={`${country.code}-${country.dialCode}`} value={country.code}>
                {country.dialCode} ({country.name})
              </option>
            ))}
          </select>
          
          {/* Custom Styled Facade with clean SVG rendering */}
          <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
            {FlagComponent ? (
              <div className="w-5 h-3.5 object-cover rounded-[1px] shadow-sm overflow-hidden flex items-center justify-center">
                <FlagComponent title={currentCountry.name} />
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 font-mono">{currentCountry.code}</span>
            )}
            <span className="font-medium text-slate-800 text-xs">{currentCountry.dialCode}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
        <FormInput
        type="tel"
        required
        name="phone"
        placeholder="24 555 7899" 
        className="flex-1 h-10 bg-transparent rounded-bl-none rounded-tl-none px-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-transparent"
        />
      </div>
    </div>
  );
}