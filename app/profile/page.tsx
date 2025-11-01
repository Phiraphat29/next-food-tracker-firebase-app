"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface UserProfile {
  id: string;
  email: string;
  fullname?: string;
  gender?: string;
  user_image_url?: string;
}

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  //* Fetch user profile data from localStorage and
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem("user");

        if (!userData) {
          alert("กรุณาเข้าสู่ระบบก่อน");
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(userData);

        // Get fresh user data from firestore collection users
        // Note: parsedUser.id is the email (document ID in Firestore)
        const userProfile = await getDoc(doc(db, "users", parsedUser.id));
        if (userProfile.exists()) {
          const userData = userProfile.data();
          const profileData = {
            id: parsedUser.id,
            email: userData.email || "",
            fullname: userData.fullname || "",
            gender: userData.gender || "",
            user_image_url: userData.user_image_url || "",
          };
          setUser(profileData);
          setFullName(profileData.fullname);
          setEmail(profileData.email);
          setGender(profileData.gender);
          setImagePreview(profileData.user_image_url);
          setOriginalImageUrl(profileData.user_image_url);
        } else {
          alert("ไม่พบข้อมูลผู้ใช้");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      if (!user) {
        alert("ไม่พบข้อมูลผู้ใช้");
        setIsUpdating(false);
        return;
      }

      // Upload new image if selected
      let avatar_url = originalImageUrl; // Keep existing image URL by default

      if (image) {
        // Delete old image from Supabase storage if it exists
        if (originalImageUrl) {
          try {
            // Extract filename from Supabase URL
            const urlParts = originalImageUrl.split("/user_bk/");
            if (urlParts.length > 1) {
              const filename = urlParts[1].split("?")[0]; // Remove query params if any
              const { error: deleteError } = await supabase.storage
                .from("user_bk")
                .remove([filename]);

              if (deleteError) {
                console.error("Error deleting old image:", deleteError);
                // Continue with upload even if old image deletion fails
              }
            }
          } catch (deleteError) {
            console.error("Error deleting old image:", deleteError);
            // Continue with upload even if old image deletion fails
          }
        }

        // Upload new image
        const new_image_file_name = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("user_bk")
          .upload(new_image_file_name, image);

        if (uploadError) {
          alert("พบปัญหาในการอัปโหลดรูปภาพ");
          console.log(uploadError.message);
          setIsUpdating(false);
          return;
        }

        // Get public URL for the new image
        const { data } = await supabase.storage
          .from("user_bk")
          .getPublicUrl(new_image_file_name);
        avatar_url = data.publicUrl;
      }

      // Prepare update data
      const updateData: {
        email: string;
        fullname: string;
        gender: string;
        user_image_url: string | null;
        password?: string;
      } = {
        email: email,
        fullname: fullName,
        gender: gender,
        user_image_url: avatar_url || null,
      };

      // Only update password if provided
      if (password) {
        updateData.password = password;
      }

      // Update user profile in firestore collection users (single update)
      await updateDoc(doc(db, "users", user.id), updateData);

      // Update localStorage with new data
      const updatedUserData = {
        id: user.id,
        fullname: fullName,
        email: email,
        gender: gender,
        user_image_url: avatar_url || null,
      };

      localStorage.setItem("user", JSON.stringify(updatedUserData));
      alert("อัปเดตข้อมูลโปรไฟล์สำเร็จ");

      router.push("/dashboard");
    } catch (error) {
      console.error("Update profile error:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fuchsia-400 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white/80">
        {/* หัวข้อ */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-800 drop-shadow-md">
          Edit Profile
        </h1>
        <p className="text-sm md:text-base mb-8 text-gray-600">
          Update your personal details
        </p>

        {/* ฟอร์มแก้ไขข้อมูล */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              กำลังโหลดข้อมูลโปรไฟล์...
            </div>
          ) : (
            <>
              {/* ช่องป้อนชื่อ-สกุล */}
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-gray-800 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                required
              />

              {/* ช่องป้อนอีเมล์ */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-gray-800 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                required
              />

              {/* ช่องป้อนรหัสผ่าน */}
              <input
                type="password"
                placeholder="Password (Leave blank to keep current)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-gray-800 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              />

              {/* ช่องเลือกเพศ */}
              <div className="flex justify-center gap-6 mt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === "male"}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all ${
                      gender === "male"
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {/* Icon or emoji for Male */}
                    <span className="text-xl">👨</span>
                  </span>
                  <span className="ml-2 text-gray-700">Male</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === "female"}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all ${
                      gender === "female"
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {/* Icon or emoji for Female */}
                    <span className="text-xl">👩</span>
                  </span>
                  <span className="ml-2 text-gray-700">Female</span>
                </label>
              </div>

              {/* ปุ่มและ Image Preview สำหรับรูปภาพ */}
              <div className="flex flex-col items-center mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
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
                      className="w-32 h-32 object-cover rounded-full border-4 border-purple-500 shadow-md"
                      unoptimized={true}
                    />
                  </div>
                )}
              </div>

              {/* ปุ่มบันทึก */}
              <button
                type="submit"
                disabled={isUpdating}
                className={`mt-6 w-full font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform focus:outline-none ${
                  isUpdating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:scale-105 hover:bg-purple-700"
                } text-white`}
              >
                {isUpdating ? "กำลังอัปเดต..." : "Save Changes"}
              </button>
            </>
          )}
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
