"use client";

import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface Food {
  id: string;
  foodname: string;
  meal: string;
  fooddate_at: string;
  food_image_url: string | null;
}

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const result = await getDocs(collection(db, "foods"));
        // set result to state food
        setFoods(
          result.docs.map((doc) => ({
            id: doc.id,
            foodname: doc.data().foodname,
            meal: doc.data().meal,
            fooddate_at: doc.data().fooddate_at,
            food_image_url: doc.data().food_image_url,
          }))
        );
      } catch (error) {
        console.error("Error fetching foods:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fetchFoods();
  }, []);

  //* filter foods by search term
  const filteredFoods = useMemo(() => {
    return foods.filter((food) =>
      food.foodname.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [foods, searchTerm]);

  //* calculate total pages and current foods
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);

  //* get current foods
  const currentFoods = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFoods.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredFoods]);

  //* handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
  };

  //* handle delete (AI Generated)
  const handleDelete = async (id: string) => {
    //* show confirm dialog
    const confirm = window.confirm("คุณต้องการลบข้อมูลอาหารนี้หรือไม่?");
    if (!confirm) {
      return;
    }

    try {
      // Get the food document to retrieve image URL
      const foodToDelete = foods.find((food) => food.id === id);
      if (!foodToDelete) {
        alert("ไม่พบข้อมูลอาหาร");
        return;
      }

      // Delete image from Supabase storage if image exists
      if (foodToDelete.food_image_url) {
        try {
          // Extract filename from Supabase URL
          // URL format: https://[project].supabase.co/storage/v1/object/public/food_bk/[filename]
          const urlParts = foodToDelete.food_image_url.split("/food_bk/");
          if (urlParts.length > 1) {
            const filename = urlParts[1].split("?")[0]; // Remove query params if any
            const { error: imageError } = await supabase.storage
              .from("food_bk")
              .remove([filename]);

            if (imageError) {
              console.error("Error deleting food image:", imageError);
              // Continue with document deletion even if image deletion fails
            }
          }
        } catch (imageError) {
          console.error("Error deleting food image:", imageError);
          // Continue with document deletion even if image deletion fails
        }
      }

      // Delete document from Firestore
      const docRef = doc(db, "foods", id);
      await deleteDoc(docRef);

      // Delete food from local state
      setFoods((prevFoods) => prevFoods.filter((food) => food.id !== id));

      alert("ลบข้อมูลอาหารสำเร็จ");

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  //* handle edit
  const handleEdit = (id: string) => {
    console.log(`Editing food with ID: ${id}`);
    //* redirect to updatefood page
    router.push(`/updatefood/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-400 via-purple-500 to-pink-500 p-4">
      <div className="container mx-auto max-w-7xl bg-white/90 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-2xl text-gray-800 border border-white/80">
        {/* Header และ Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center md:text-left drop-shadow-md">
            Dashboard
          </h1>
          <div className="flex w-full md:w-auto gap-2">
            <input
              type="text"
              placeholder="Search food name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 focus:outline-none"
            >
              Search
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 focus:outline-none text-center"
            >
              Profile
            </Link>
            <Link
              href="/addfood"
              className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 focus:outline-none text-center"
            >
              Add Food
            </Link>
          </div>
        </div>

        {/* ตารางแสดงข้อมูล */}
        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="min-w-full bg-white rounded-2xl">
            <thead>
              <tr className="bg-purple-600 text-white text-left text-sm md:text-base">
                <th className="py-4 px-6 rounded-tl-2xl">รูปอาหาร</th>
                <th className="py-4 px-6">วันที่</th>
                <th className="py-4 px-6">ชื่ออาหาร</th>
                <th className="py-4 px-6">มื้ออาหาร</th>
                <th className="py-4 px-6 rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : foods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : currentFoods.length > 0 ? (
                currentFoods.map((food) => (
                  <tr
                    key={food.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Image
                        src={
                          food.food_image_url ||
                          "https://placehold.co/100x100/A020F0/ffffff?text=No+Image"
                        }
                        alt={food.foodname}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md"
                        unoptimized={true}
                      />
                    </td>
                    <td className="py-4 px-6">{food.fooddate_at}</td>
                    <td className="py-4 px-6">{food.foodname}</td>
                    <td className="py-4 px-6">{food.meal}</td>
                    <td className="py-4 px-6 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEdit(food.id)}
                        className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-yellow-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    ไม่พบข้อมูลอาหารที่ตรงกับการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-purple-500 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-lg font-semibold text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="bg-purple-500 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
