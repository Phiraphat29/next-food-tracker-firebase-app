"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    //* Check if User data exists in DB
    try {
      // Query Firestore for user with matching email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
        return;
      }

      // Get the first matching document
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      // Verify password matches
      if (data.password !== password) {
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
        return;
      }

      alert("ล็อกอินสำเร็จ");

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: docSnap.id,
          fullname: data.fullname || "",
          email: data.email || email,
          gender: data.gender || "",
          user_image_url: data.user_image_url || "",
        })
      );

      router.push("/dashboard");
    } catch (error) {
      alert("พบปัญหาในการล็อกอิน");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fuchsia-400 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/70 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white/80">
        {/* หัวข้อ */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-800 drop-shadow-md">
          Welcome Back
        </h1>
        <p className="text-sm md:text-base mb-8 text-gray-600">
          Log in to your account
        </p>

        {/* ฟอร์มล็อกอิน */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* ช่องป้อนอีเมล์ */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border-2 border-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            required
          />

          {/* ช่องป้อนรหัสผ่าน */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border-2 border-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            required
          />

          {/* ปุ่มล็อกอิน */}
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-6 w-full font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform focus:outline-none ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:scale-105 hover:bg-purple-700"
            } text-white`}
          >
            {isLoading ? "กำลังล็อกอิน..." : "Login"}
          </button>
        </form>

        {/* ลิงก์ไปยังหน้าลงทะเบียน */}
        <p className="mt-8 text-sm text-gray-600">
          Don{"'"}t have an account?{" "}
          <Link
            href="/register"
            className="text-purple-600 font-bold hover:underline transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
