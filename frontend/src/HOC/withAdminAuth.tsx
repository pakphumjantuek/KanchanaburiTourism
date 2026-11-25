// src/hoc/withAdminAuth.tsx
import React from "react";
import { jwtDecode } from "jwt-decode";
import { SD_Roles } from "../Common/SD";

// ต้องให้ตรงกับที่เราเซฟใน authSlice / localStorage
const ACCESS_TOKEN_KEY = "auth_accessToken";

interface JwtPayload {
  role?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  exp?: number; 
  [key: string]: any;
}

const withAdminAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAdminAuth: React.FC<P> = (props: P) => {
    console.log("withAdminAuth HOC called");

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";

    // ❌ ไม่มี token → เด้งไป login เลย
    if (!accessToken) {
      window.location.replace("/login");
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);

      // รองรับทั้งกรณี role ปกติ และ ClaimTypes.Role ของ .NET
      const role =
        decoded.role ??
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // เช็คหมดอายุ token (exp เป็นวินาที)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        // access token หมดอายุแล้ว → ให้กลับไป login ใหม่ (หรือจะยิง refresh ก็ได้)
        window.location.replace("/login");
        return null;
      }

      // ❌ ไม่ใช่ Admin → เด้งไปหน้า accessDenied
      if (!role || (role !== SD_Roles.ADMIN && role !== SD_Roles.OPERATOR)) {
        window.location.replace("/accessDenied");
        return null;
      }
    } catch (err) {
      // decode ไม่ได้ / token พัง → ให้กลับไป login ใหม่
      console.error("Failed to decode JWT", err);
      window.location.replace("/login");
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAdminAuth;
};

export default withAdminAuth;
