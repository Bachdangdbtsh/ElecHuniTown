"use client";
import { useState } from "react";
import { FaStar } from "react-icons/fa6";
import { FaStarHalf } from "react-icons/fa";
import ReviewForm from "./reviewForm";

export default function Comment({ product }) {
  const [filterStar, setFilterStar] = useState(null);

  const filteredComments = product.Comment.filter((com) => {
    if (!filterStar) return true; 
    return com.rating === filterStar; 
  });

  return (
    <div className="comment">
      <div className="first-part">
        <div className="rate">
          <div className="title">Đánh giá</div>
          <div className="point">{product.rate || 0}</div>
          
          <div className="list-star" style={{ display: "flex", gap: "2px", color: "#f60" }}>
            {Array.from({ length: 5 }).map((_, index) => {
              const rate = product.rate || 0;
              if (rate >= index + 1) return <FaStar key={index} />;
              if (rate >= index + 0.5) return <FaStarHalf key={index} />;
              return <FaStar key={index} color="#e4e5e9" />;
            })}
          </div>
        </div>

        <div className="list-rate-tag">
          <div 
            className={`rate-tag ${filterStar === null ? "active" : ""}`} 
            onClick={() => setFilterStar(null)}
          >
            Tất cả
          </div>
          {[5, 4, 3, 2, 1].map((star) => (
            <div 
              key={star}
              className={`rate-tag ${filterStar === star ? "active" : ""}`} 
              onClick={() => setFilterStar(star)}
            >
              <div>{star}</div>
              <FaStar />
            </div>
          ))}
        </div>
      </div>

      {/* Form viết đánh giá */}
      <ReviewForm productId={product.id} />

      {/* Danh sách đánh giá đã được lọc */}
      <div className="other-review">
        {filteredComments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Không có đánh giá nào!</div>
        ) : (
          filteredComments.map((com) => (
            <div className="review-detail" key={com.id}>
              <div className="name">{com.User.fullName}</div>
              <div className="point" style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar 
                    key={i} 
                    color={i < (com.rating || 0) ? "#f60" : "#e4e5e9"} 
                  />
                ))}
              </div>
              <div className="des-detail">{com.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}