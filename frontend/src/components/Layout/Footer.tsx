import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-100 text-green-700">
                <MapPin size={18} />
              </span>
              <span className="font-semibold text-gray-900">Kanchanaburi Travel</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              เว็บสำหรับค้นหาสถานที่ท่องเที่ยว ที่พัก และวางแผนการเดินทางในจังหวัดกาญจนบุรี
            </p>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Kanchanaburi Travel. All rights reserved.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">เมนู</h3>
            <div className="space-y-2 text-sm">
              <Link to="/home" className="block text-gray-600 hover:text-gray-900">
                หน้าแรก
              </Link>
              <Link to="/places" className="block text-gray-600 hover:text-gray-900">
                สถานที่ท่องเที่ยว
              </Link>
              <Link to="/trip" className="block text-gray-600 hover:text-gray-900">
                ทริปของฉัน
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">ช่วยเหลือ</h3>
            <div className="space-y-2 text-sm">
              <span className="block text-gray-600">ติดต่อเรา</span>
              <span className="block text-gray-600">FAQ</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
