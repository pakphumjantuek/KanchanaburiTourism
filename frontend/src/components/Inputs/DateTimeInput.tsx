import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  showTime?: boolean;
  className?: string;
};

export default function DateTimeInput({
  label,
  value,
  onChange,
  placeholder = "เลือกวันและเวลา",
  required,
  minDate,
  maxDate,
  disabled,
  showTime = true,
  className = "",
}: Props) {
  return (
    <div>
      {label && (
        <label className="text-sm text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <DatePicker
        selected={value}
        onChange={onChange}
        locale="th"
        dateFormat={showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"}
        showTimeSelect={showTime}
        timeCaption="เวลา"          // ✅ ตรงนี้แหละ
        timeFormat="HH:mm"
        timeIntervals={15}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 ${className}`}
      />
    </div>
  );
}
