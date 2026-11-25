// components/TextInput.tsx
import React from "react";
import { useField } from "formik";

interface TextInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  className = "",
  ...props
}) => {
  const [field, meta] = useField(props.name);

  return (
    <div>
      <label
        className="block text-gray-700 font-medium mb-1"
        htmlFor={props.name}
      >
        {label}
      </label>
      <input
        {...field}
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          meta.touched && meta.error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-blue-400"
        } ${className}`} // รวม className ที่ส่งเข้ามา
      />
      {meta.touched && meta.error && (
        <p className="text-red-500 text-sm mt-1">{meta.error}</p>
      )}
    </div>
  );
};

export default TextInput;
