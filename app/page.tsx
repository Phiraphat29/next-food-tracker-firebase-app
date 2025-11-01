import Image from "next/image";
import Link from "next/link";
import foodtracker from "./images/foodtracker.jpg";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="bg-white/70 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-center text-gray-800 max-w-md w-full">
        {/* ส่วนหัวข้อหลัก */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">
          Welcome to Food Tracker
        </h1>
        <p className="text-lg md:text-xl font-medium mb-8 opacity-90 drop-shadow">
          Track your meal!!
        </p>

        {/* ส่วนรูปภาพ */}
        <div className="mb-8">
          {/* แทนที่ URL ของรูปภาพด้วยรูปภาพของคุณเอง หรือใช้ placeholder นี้เป็นตัวอย่าง */}
          <Image
            src={foodtracker}
            alt="Food Tracker App"
            className="w-full h-auto rounded-4xl shadow-lg hover:scale-105 transition duration-300 ease-in-out"
          />
        </div>

        {/* ส่วนปุ่ม */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-100"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="bg-transparent text-gray-800 font-bold py-3 px-8 rounded-full border border-gray-800 transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-800 hover:text-white"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
