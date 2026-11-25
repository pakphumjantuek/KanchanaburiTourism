# Kanchanaburi Travel

แพลตฟอร์มท่องเที่ยวจังหวัดกาญจนบุรี รวมข้อมูลสถานที่ อาหารพื้นถิ่น และผู้ประกอบการท้องถิ่นไว้ในที่เดียว พร้อมระบบ **แนะนำสถานที่ด้วย Machine Learning** และ **วางแผนทริปอัตโนมัติ** ที่จัดเส้นทางบนแผนที่ให้เอง

<!-- TODO: ใส่ภาพหน้าจอ 3–4 ภาพที่นี่ เช่น หน้าหลัก หน้าสถานที่ หน้าวางแผนทริปบนแผนที่
![หน้าหลัก](docs/screenshots/home.png)
-->

## ระบบนี้ทำอะไรได้

| กลุ่มงาน | สิ่งที่ทำได้ |
|---|---|
| **สถานที่ท่องเที่ยว** | ดูรายการสถานที่และอีเวนต์ กรองตามหมวดหมู่และแท็ก ดูรายละเอียด ภาพ เวลาเปิด–ปิด และรีวิวจากผู้ใช้ |
| **อาหารพื้นถิ่น** | จัดการเมนูอาหารท้องถิ่น ผูกกับร้านหรือสถานที่ที่มีเมนูนั้น พร้อมภาพ |
| **วางแผนทริป** | สร้างทริปเอง เพิ่ม–ลบ–สลับลำดับสถานที่ หรือให้ระบบ **สร้างทริปอัตโนมัติ** แล้วดูเส้นทางและระยะทางแต่ละช่วงบนแผนที่ |
| **แนะนำสถานที่** | จัดอันดับหมวดหมู่ที่เหมาะกับผู้ใช้แต่ละคนจากพฤติกรรมและความสนใจ และดูเมนูอาหารยอดนิยม |
| **ผู้ประกอบการ** | ยื่นคำขอเป็นผู้ประกอบการ ให้ผู้ดูแลอนุมัติ แล้วจัดการสถานที่และเมนูของตนเอง พร้อมแดชบอร์ดของสถานที่ |
| **ผู้ใช้และสิทธิ์** | สมัคร ล็อกอิน (JWT พร้อม Refresh Token) โปรไฟล์ ความสนใจส่วนตัว และการแยกบทบาทผู้ดูแลระบบ |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| **Backend** | ASP.NET Core Web API (.NET 8), Entity Framework Core 8, SQL Server, JWT, BCrypt, AutoMapper, ML.NET (LightGBM), Swagger |
| **Frontend** | React 19, TypeScript 5.9, Vite 7, Redux Toolkit, Ant Design 6, Tailwind CSS 4, React Router 7, Leaflet และ Longdo Map, Recharts |
| **เส้นทาง** | OSRM (คำนวณระยะทางและเส้นทางถนนจริง ตั้งค่าเซิร์ฟเวอร์ได้) |
| **ทดสอบ** | xUnit |

## จุดเด่นทางเทคนิค

- **วางแผนทริปอัตโนมัติ** สร้างทริปจากสถานที่ที่เหมาะสม แล้วคำนวณระยะทางจริงระหว่างจุดด้วย OSRM เก็บเป็นตารางระยะทางถนนเพื่อจัดลำดับเส้นทาง
- **ระบบแนะนำด้วย ML.NET** โมเดลจัดอันดับหมวดหมู่ตามผู้ใช้ (Regression) และโมเดลคาดการณ์ความนิยมของเมนูอาหาร (LightGBM) โหลดผ่าน PredictionEnginePool ไฟล์โมเดลที่ฝึกแล้วอยู่ใน `backend/TravelKanjanuburi/MLModels`
- **เก็บพฤติกรรมผู้ใช้** บันทึกการเข้าชมและความสนใจ เพื่อใช้ป้อนโมเดลแนะนำ
- **ยืนยันตัวตนแบบ JWT** มี Access Token และ Refresh Token เก็บรหัสผ่านด้วย BCrypt
- **ผู้ประกอบการและการอนุมัติ** ผู้ใช้ยื่นคำขอ ผู้ดูแลอนุมัติ จึงจัดการข้อมูลของตนเองได้
- **ฐานข้อมูลที่ดูแลด้วย Migration** กว่า 20 Migration ตลอดการพัฒนา
- **มีเทสต์อัตโนมัติ** กว่า 50 กรณีทดสอบ ครอบคลุมการวางแผนทริปอัตโนมัติ (รวมแบบ End-to-End) และบริการทริป

## โครงสร้างโปรเจกต์

```
KanchanaburiTravel/
├── backend/
│   ├── TravelKanjanuburi/          Web API (Controllers, Services, ML, Migrations)
│   └── TravelKanjanuburi.Tests/    xUnit tests
└── frontend/                       React + TypeScript (Vite)
```

## วิธีรันบนเครื่อง

**สิ่งที่ต้องมี:** .NET 8 SDK, Node.js, SQL Server (หรือ SQL Server Express) และ `dotnet-ef` (`dotnet tool install --global dotnet-ef`)

### 1) Backend

```powershell
cd backend\TravelKanjanuburi

dotnet user-secrets init

# คีย์ลงนาม JWT (ตั้งเป็นข้อความยาวอย่างน้อย 32 ตัวอักษร เดายาก)
dotnet user-secrets set "Jwt:SigningKey" "ข้อความลับของคุณ"

# (ไม่บังคับ) ถ้าฐานข้อมูลไม่ใช่ .\SQLEXPRESS ให้ตั้งเอง
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=.\SQLEXPRESS;Database=Kanjanaburitravel;TrustServerCertificate=True;Trusted_Connection=True;"

# สร้างตารางในฐานข้อมูล
dotnet ef database update

dotnet run
```

API อยู่ที่ `http://localhost:5077` (ตั้งไว้ใน `Properties/launchSettings.json`) และมี Swagger ให้ลองเรียก

> ในโค้ดไม่มีการสร้างผู้ดูแลระบบอัตโนมัติ การให้บทบาท `Admin` กับบัญชีใดบัญชีหนึ่งต้องกำหนดเองในฐานข้อมูล ส่วนเซิร์ฟเวอร์เส้นทางใช้ OSRM สาธารณะเป็นค่าเริ่มต้น เปลี่ยนได้ที่ `Osrm:BaseUrl`

### 2) Frontend

```powershell
cd frontend
copy .env.example .env
```

แก้ `.env` ให้ `VITE_API_BASE_URL` (ต้องลงท้ายด้วย `/`) และ `VITE_API_BASE_URLS` ชี้ไปที่ API และใส่คีย์ `VITE_LONGDO_KEY` ของคุณเอง ([ขอได้ที่ Longdo Map](https://map.longdo.com)) และ `VITE_MAPBOX_TOKEN` (ไม่บังคับ ถ้าไม่ใส่ จะไม่แสดงแผนที่ภาพนิ่งในหน้ารายละเอียดสถานที่ ใช้ [Mapbox](https://account.mapbox.com) และจำกัดโดเมนของโทเค็น) แล้วรัน:

```powershell
npm install
npm run dev
```

เปิด `http://localhost:5173` (backend อนุญาต CORS จากพอร์ตนี้ไว้แล้ว)

### 3) รันเทสต์

```powershell
cd backend
dotnet test TravelKanjanuburi.Tests
```

## ผู้พัฒนา

**ภาคภูมิ จันทร์ทึก** · นักพัฒนาเว็บแอปพลิเคชัน

- GitHub: [github.com/pakphumjantuek](https://github.com/pakphumjantuek)
- อีเมล: _(ใส่อีเมลที่ต้องการให้ติดต่อ)_

> โปรเจกต์นี้พัฒนาเพื่อการเรียนรู้และแสดงผลงาน ข้อมูลตัวอย่างทั้งหมดไม่ใช่ข้อมูลจริงของผู้ใช้ ชุดข้อมูลฝึกโมเดลและรูปที่ผู้ใช้อัปโหลดไม่ได้รวมอยู่ในรีโปนี้
