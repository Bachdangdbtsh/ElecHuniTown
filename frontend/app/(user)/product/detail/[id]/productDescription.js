"use client"
import { useEffect,useState } from "react";

export default function ProductDescription({des}) {
  const [seeAll,setseeAll]=useState(false);
  useEffect(()=>{
    
  },[])
  return (<>
    <div className="description">
      <div className="title">Thông tin sản phẩm</div>
      <div className={"des-detail"+(seeAll?" active":"")}>
        <div className="des-content">
          <span>
            {/* Máy cạo râu khô và ướt Coclear CS007 sở hữu tính năng cạo khô và ướt, cùng khả năng vừa cạo vừa sạc – phù hợp với người dùng hiện đại có nhịp sống nhanh. Bên cạnh đó, các tiện ích như khóa an toàn, đèn LED hiển thị và chống nước IPX7 giúp quá trình sử dụng trở nên an toàn, trơn tru và dễ sử dụng hơn.
            Thiết kế
            - Máy cạo râu Coclear sử dụng 2 lưỡi dao xoay, cho vùng cạo vừa đủ để làm sạch gọn gàng, phù hợp với những người có vùng râu nhỏ hoặc thích sự nhẹ nhàng, không gây tổn thương da.
            - Thiết kế nhỏ gọn, cân đối giúp cầm chắc tay, điều khiển dễ dàng. Trọng lượng nhẹ không gây mỏi tay khi cạo lâu, lý tưởng cho việc sử dụng thường xuyên hoặc mang theo khi di chuyển. */}
            {des}
          </span>
          {/* <img src="/tulanh.jpg"></img> */}
        </div>
        <div className="see-all">
          <button 
            onClick={()=>{
              setseeAll(!seeAll);
            }}
          >{seeAll?"Thu gọn":"Xem tất cả"}</button>
        </div>
      </div>
    </div>
  </>)
}