"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function Page() {
  const [foodName, setFoodName] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);

    try {
      //* upload image to supabase storage
      let image_url = "";
      if (image) {
        // named new image file
        const new_image_file_name = `${Date.now()}-${image.name}`;
        // upload it
        const { data, error } = await supabase.storage
          .from("food_bk")
          .upload(new_image_file_name, image);
        // after upload, check if the upload is successful
        if (error) {
          alert("พบปัญหาในการอัปโหลดรูปภาพ");
          console.log(error.message);
          return;
        } else {
          const { data } = await supabase.storage
            .from("food_bk")
            .getPublicUrl(new_image_file_name);
          image_url = data.publicUrl;
        }
      }

      //* submit form data to firestore
      const docRef = await addDoc(collection(db, "foods"), {
        foodname: foodName,
        meal: meal,
        fooddate_at: date,
        food_image_url: image_url,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      alert("บันทึกข้อมูลอาหารสำเร็จ");
      // clear form
      setFoodName("");
      setMeal("");
      setDate("");
      setImage(null);
      setImagePreview(null);
      // redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Save food error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลอาหาร");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-fuchsia-400 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white/80">
        {/* หัวข้อ */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-800 drop-shadow-md">
          Add New Food
        </h1>
        <p className="text-sm md:text-base mb-8 text-gray-600">
          Record your meal details
        </p>

        {/* ฟอร์มเพิ่มอาหาร */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* ช่องป้อนชื่ออาหาร */}
          <input
            type="text"
            placeholder="Food Name"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="text-gray-700 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            required
          />

          {/* ช่องเลือกมื้ออาหาร */}
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            className="text-gray-700 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors bg-white"
            required
          >
            <option value="" disabled>
              Select Meal
            </option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>

          {/* ช่องเลือกวันเดือนปี */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-gray-700 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            required
          />

          {/* ปุ่มและ Image Preview สำหรับรูปภาพ */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-4">
                <Image
                  src={imagePreview}
                  alt="Image Preview"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-md border-4 border-purple-500 shadow-md"
                  unoptimized={true}
                />
              </div>
            )}
          </div>

          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-6 w-full font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform focus:outline-none ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:scale-105 hover:bg-purple-700"
            } text-white`}
          >
            {isLoading ? "กำลังบันทึก..." : "Save"}
          </button>
        </form>

        {/* ปุ่มย้อนกลับ */}
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="w-full inline-block bg-gray-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-500 focus:outline-none"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
