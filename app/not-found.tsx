import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <p className="text-6xl">🔍</p>
        <h2 className="text-2xl font-bold text-gray-800">404</h2>
        <p className="text-gray-500">ไม่พบหน้าที่ต้องการ</p>
        <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
