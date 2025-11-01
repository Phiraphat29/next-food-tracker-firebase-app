"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

export default function Page() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        alert("Error reading the file");
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //* upload image to supabase storage
    let image_url = "";
    if (image) {
      // named new image file
      const new_image_file_name = `${Date.now()}-${image.name}`;
      // upload it
      const { data, error } = await supabase.storage
        .from("user_bk")
        .upload(new_image_file_name, image);
      // after upload, check if the upload is successful
      if (error) {
        alert("พบปัญหาในการอัปโหลดรูปภาพ");
        console.log(error.message);
      } else {
        const { data } = await supabase.storage
          .from("user_bk")
          .getPublicUrl(new_image_file_name);
        image_url = data.publicUrl;
      }
    }

    //* submit form data to firestore
    try {
      const result = await addDoc(collection(db, "users"), {
        fullname: fullName,
        email: email,
        password: password,
        gender: gender,
        user_image_url: image_url,
        created_at: new Date(),
        updated_at: new Date(),
      });
      if (result) {
        alert("ลงทะเบียนสำเร็จ");
        router.push("/login");
        // clear form
        setFullName("");
        setEmail("");
        setPassword("");
        setGender("");
        setImage(null);
        setImagePreview(null);
      } else {
        alert("พบปัญหาในการลงทะเบียน");
        return;
      }
    } catch (error) {
      alert("พบปัญหาในการลงทะเบียน");
      console.log(error);
      return;
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-fuchsia-400 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/70 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white/80">
        {/* หัวข้อ */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-800 drop-shadow-md">
          Create an Account
        </h1>
        <p className="text-sm md:text-base mb-8 text-gray-600">
          Sign up to start tracking your meals!
        </p>

        {/* ฟอร์มลงทะเบียน */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* ช่องป้อนชื่อ-สกุล */}
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-3 border-2 border-gray-500 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            required
          />

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

          {/* เพศ (Radio buttons) */}
          <div className="flex items-center justify-between p-3 rounded-xl text-gray-600">
            <span className="font-medium">Gender:</span>
            <div className="flex gap-6">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  required
                  checked={gender === "male"}
                  onChange={(e) => setGender(e.target.value)}
                  className="form-radio h-5 w-5 text-purple-600 border-gray-300 focus:ring-purple-500 transition-colors"
                />
                <span className="ml-2">Male</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  required
                  checked={gender === "female"}
                  onChange={(e) => setGender(e.target.value)}
                  className="form-radio h-5 w-5 text-purple-600 border-gray-300 focus:ring-purple-500 transition-colors"
                />
                <span className="ml-2">Female</span>
              </label>
            </div>
          </div>

          {/* ช่องสำหรับอัปโหลดรูปภาพ */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="image-upload"
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white/50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Choose Image
              </label>
            </div>
            {image && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {image.name}
              </p>
            )}
          </div>

          {/* แสดงรูปภาพที่เลือก */}
          {imagePreview && (
            <div className="mt-4 flex justify-center">
              <Image
                src={imagePreview}
                alt="Image Preview"
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-full border-4 border-purple-500 shadow-md"
                unoptimized={true}
              />
            </div>
          )}

          {/* ปุ่มลงทะเบียน */}
          <button
            type="submit"
            className="mt-6 w-full bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 focus:outline-none"
          >
            Register
          </button>
        </form>

        {/* ลิงก์ไปยังหน้าล็อกอิน */}
        <p className="mt-8 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple-600 font-bold hover:underline transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
