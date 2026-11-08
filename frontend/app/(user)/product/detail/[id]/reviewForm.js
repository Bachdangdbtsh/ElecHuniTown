"use client";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId }) {
  const router=useRouter();
  const [rating, setRating] = useState(5); // Mặc định 5 sao
  const [hover, setHover] = useState(0); // Hiệu ứng hover
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá!");
      return;  
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/comment/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId,
          rating: rating,
          content: content,
        }),
      });
      const data = await res.json();

      if (data.code === "success") {
        toast.success("Đánh giá thành công!");
        setContent(""); 
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="write-review">
      <div className="title">Đánh giá sản phẩm tại đây</div>
      
      {/* PHẦN CHỌN SAO */}
      <div className="point" style={{ display: "flex", gap: "5px", cursor: "pointer", fontSize: "24px" }}>
        {[...Array(5)].map((star, index) => {
          const starValue = index + 1;
          return (
            <label key={index}>
              <input
                type="radio"
                name="rating"
                value={starValue}
                onClick={() => setRating(starValue)}
                style={{ display: "none" }}
              />
              <FaStar
                color={starValue <= (hover || rating) ? "#f60" : "#e4e5e9"}
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(0)}
              />
            </label>
          );
        })}
      </div>

      {/* PHẦN NHẬP NỘI DUNG */}
      <div className="des-part">
        <div className="des-title">Mô tả nhận xét</div>
        <form className="review-form" onSubmit={handleSubmit}>
          <textarea
            placeholder="Nhập mô tả tại đây"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      </div>
    </div>
  );
}