import React from "react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = "อัปโหลดไฟล์",
  accept = ".pdf,.doc,.docx,.zip,.rar",
  file,
  setFile,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-md"
        >
          เลือกไฟล์
        </label>
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {file?.name || "ยังไม่ได้เลือกไฟล์"}
        </span>
      </div>
      <input
        id="file-upload"
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
